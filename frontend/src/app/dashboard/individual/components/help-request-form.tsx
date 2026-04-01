"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mic, Camera, Send, Trash2, Loader2, StopCircle } from "lucide-react";
import type { RequestCreatePayload } from "@/lib/types/request";
import { useToast } from "@/components/ui/use-toast";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";
import { uploadFilesToS3 } from "@/lib/utils/uploadToS3";
import type { Uploaded } from "@/lib/utils/uploadToS3";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const MAX_IMAGE_MB = 8;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const isFiniteCoordinate = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const parseCoordinatesFromText = (value?: string): { lat: number; lng: number } | null => {
  if (!value) return null;

  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const getReadableErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const apiError = error as {
      message?: unknown;
      data?: {
        detail?: unknown;
      };
    };

    if (typeof apiError.message === "string" && apiError.message.trim()) {
      return apiError.message;
    }

    const detail = apiError.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const detailMessages = detail
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const msg = (entry as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        })
        .filter((msg): msg is string => Boolean(msg));

      if (detailMessages.length > 0) {
        return detailMessages.join("; ");
      }
    }
  }

  return "An error occurred while submitting your request.";
};

const formSchema = z.object({
  disaster: z.string().min(1, "Please select a disaster."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  details: z.string().min(10, "Please provide details."),
  location: z.object({
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    address: z.string().optional(),
  }).refine(
    (loc) =>
      (isFiniteCoordinate(loc.lat) && isFiniteCoordinate(loc.lng)) ||
      parseCoordinatesFromText(loc.address) !== null,
    { message: "Use GPS or enter coordinates as lat,lng (example: 6.9271,79.8612)." }
  ),
  photos: z.array(z.instanceof(File)).max(8).optional(),
  voiceTranscript: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Props = { onSubmit: (data: RequestCreatePayload) => Promise<void> };

export default function HelpRequestForm({ onSubmit }: Props) {
  const { toast } = useToast();
  const { joinedDisasters } = useDashboardDisasters();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disaster: "",
      title: "",
      details: "",
      location: { lat: null, lng: null, address: "" },
      photos: [],
      voiceTranscript: "",
    },
  });

  // ------- Photos -------
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photos = watch("photos") ?? [];
  const voiceTranscript = watch("voiceTranscript");
  const locationLat = watch("location.lat");
  const locationLng = watch("location.lng");
  const locationAddress = watch("location.address");
  const parsedInputCoordinates = parseCoordinatesFromText(locationAddress ?? "");
  const pickPhotos = () => photoInputRef.current?.click();
  const onPhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => ALLOWED_IMG_TYPES.includes(f.type) && f.size <= MAX_IMAGE_MB * 1024 * 1024);
    const merged = [...photos, ...valid].slice(0, 8);
    setValue("photos", merged, { shouldValidate: true, shouldDirty: true });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };
  const removePhotoAt = (idx: number) =>
    setValue("photos", photos.filter((_, i) => i !== idx), { shouldValidate: true, shouldDirty: true });
  const previews = useMemo(() => photos.map((f) => ({ url: URL.createObjectURL(f), name: f.name })), [photos]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  // ------- Voice Note -------
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        stopTimer();
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (audioURL) URL.revokeObjectURL(audioURL);
        setAudioURL(url);
      };
      setRecorder(mr);
      mr.start();
      setRecording(true);
      startTimer();
      const SpeechRecognitionCtor =
        typeof window !== "undefined"
          ? ( (window as SpeechRecognitionWindow).SpeechRecognition || (window as SpeechRecognitionWindow).webkitSpeechRecognition )
          : undefined;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.lang = "en-US";
        transcriptRef.current = "";
        setTranscriptionError(null);
        setTranscribing(true);
        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            const text = result[0]?.transcript ?? "";
            if (!text) continue;
            if (result.isFinal) {
              transcriptRef.current = `${transcriptRef.current} ${text}`.trim();
            } else {
              interim = `${interim} ${text}`.trim();
            }
          }
          const combined = `${transcriptRef.current} ${interim}`.trim();
          setValue("voiceTranscript", combined, { shouldDirty: true });
        };
        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          if (event.error !== "no-speech") {
            setTranscriptionError("Voice transcription encountered an issue. The recorded audio will not be uploaded.");
          }
        };
        recognition.onend = () => {
          setTranscribing(false);
          const finalTranscript = (transcriptRef.current || getValues("voiceTranscript") || "").trim();
          setValue("voiceTranscript", finalTranscript, { shouldDirty: true });
          recognitionRef.current = null;
        };
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setTranscribing(false);
        setTranscriptionError("Voice transcription is not supported in this browser. The recorded audio will not be uploaded.");
      }
    } catch {
      alert("Microphone permission is required.");
    }
  };
  const stopRecording = () => {
    if (recorder?.state !== "inactive") {
      recorder?.stop();
    }
    recognitionRef.current?.stop();
  };
  const deleteVoice = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    recognitionRef.current?.stop();
    transcriptRef.current = "";
    setValue("voiceTranscript", "", { shouldDirty: true });
    setTranscriptionError(null);
    stopTimer();
    setRecording(false);
  };
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  // ------- Geolocation -------
  const [geoLoading, setGeoLoading] = useState(false);
  const geolocate = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("location.lat", pos.coords.latitude, { shouldDirty: true });
        setValue("location.lng", pos.coords.longitude, { shouldDirty: true });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert("Unable to get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("location.lat", pos.coords.latitude, { shouldDirty: true });
        setValue("location.lng", pos.coords.longitude, { shouldDirty: true });
        setGeoLoading(false);
      },
      () => {
        // Leave lat/lng null so user can enter coordinates manually
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setValue]);

  const submitForm = async (data: FormData) => {
    const manualCoordinates = parseCoordinatesFromText(data.location.address);
    const lat = isFiniteCoordinate(data.location.lat) ? data.location.lat : manualCoordinates?.lat;
    const lng = isFiniteCoordinate(data.location.lng) ? data.location.lng : manualCoordinates?.lng;
    const trimmedAddress = data.location.address?.trim();

    if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
      toast({
        title: "Invalid location",
        description: "Use GPS or enter coordinates in lat,lng format.",
        variant: "destructive",
      });
      return;
    }

    if (!isFiniteCoordinate(data.location.lat) || !isFiniteCoordinate(data.location.lng)) {
      setValue("location.lat", lat, { shouldDirty: true, shouldValidate: true });
      setValue("location.lng", lng, { shouldDirty: true, shouldValidate: true });
    }

    try {
      let uploads: Uploaded[] = [];
      if (data.photos?.length) {
        try {
          uploads = await uploadFilesToS3(data.photos);
          console.log("Uploaded photos:", uploads);
        } catch (uploadError) {
          console.error("Failed to upload photos to S3. Proceeding without images.", uploadError);
        }
      }
      const imageUrls = uploads.map((u) => u.url);

      const payload: RequestCreatePayload = {
        disaster_id: data.disaster,
        type_of_need: "general",
        description: data.details,
        title: data.title,
        location: {
          lat,
          lng,
          address: trimmedAddress || undefined,
        },
        media: imageUrls.map((url) => ({ url, type: "image" })),
      };

      await onSubmit(payload);

      toast({
        title: "Help request submitted",
        description: "Your request has been sent successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Submission failed",
        description: getReadableErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <CardContent className="space-y-6">
        {/* Disaster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Disaster</Label>
            <Controller
              name="disaster"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select disaster" />
                  </SelectTrigger>
                  <SelectContent>
                    {joinedDisasters.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="not-listed">Not listed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.disaster && <p className="text-destructive text-sm">{errors.disaster.message}</p>}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Title</Label>
          <Input
            placeholder="Give a brief title to the help request"
            {...register("title")}
            className="h-12"
          />
          {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Details</Label>
          <Textarea
            rows={4}
            placeholder="Describe the help you need with as much detail as possible"
            {...register("details")}
          />
          {errors.details && <p className="text-destructive text-sm">{errors.details.message}</p>}
        </div>
        
        {/* Location */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Location</Label>
          <div className="flex gap-2">
            <Input {...register("location.address")}
                  placeholder="Use GPS or enter coordinates as lat,lng"
                  className="h-12" />
            <Button type="button" variant="outline" size="icon"
                    className="h-12 w-12" onClick={geolocate}>
              {geoLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            </Button>
          </div>

          {(isFiniteCoordinate(locationLat) && isFiniteCoordinate(locationLng)) || parsedInputCoordinates ? (
            <p className="text-sm text-muted-foreground">
              {isFiniteCoordinate(locationLat) && isFiniteCoordinate(locationLng)
                ? `lat ${locationLat.toFixed(5)} | lng ${locationLng.toFixed(5)}`
                : `lat ${parsedInputCoordinates?.lat.toFixed(5)} | lng ${parsedInputCoordinates?.lng.toFixed(5)}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Location not available. Use GPS or enter coordinates as lat,lng.
            </p>
          )}
          {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
        </div>

        <Separator />

        {/* Photos */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Photos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {previews.map((p, i) => (
              <div key={p.url} className="relative rounded-xl overflow-hidden border bg-muted/40 shadow-sm">
                <img src={p.url} alt={p.name} className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhotoAt(i)}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 shadow hover:bg-background"
                  aria-label="Remove photo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={pickPhotos}
              className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed text-sm text-slate-700 transition-colors bg-muted/20 hover:bg-[#68b4f4]/20 shadow-sm"
            >
              <Camera className="h-6 w-6 mb-1 text-slate-700" />
              Add Photo
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept={ALLOWED_IMG_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={onPhotosSelected}
          />
          {errors.photos && <p className="text-destructive text-sm">{errors.photos.message as string}</p>}
          <p className="text-sm xs:text-base text-slate-700">
            Up to 8 photos â€¢ JPG/PNG/WebP/HEIC â€¢ â‰¤ {MAX_IMAGE_MB}MB each
          </p>
        </div>

        <Separator />

        {/* Voice Note */}
        <div className="space-y-3">
          <div>
            <Label className="text-lg font-semibold block mb-1">Voice Note</Label>
            {!audioURL && !recording && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 w/full sm:w-auto h-12 rounded-xl hover:bg-[#68b4f4]/20"
                onClick={startRecording}
              >
                <Mic className="h-5 w-5" /> Add Voice Note
              </Button>
            )}
          </div>

          {recording && (
            <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-sm">{mmss(elapsed)}</span>
              </div>
              <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2">
                <StopCircle className="h-5 w-5" /> Stop
              </Button>
            </div>
          )}

          {audioURL && !recording && (
            <div className="space-y-3">
              <audio src={audioURL} controls className="w-full rounded-lg border" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={startRecording} className="gap-2 rounded-xl hover:bg-[#68b4f4]/20">
                  <Mic className="h-5 w-5" /> Re-record
                </Button>
                <Button type="button" variant="ghost" onClick={deleteVoice} className="gap-2">
                  <Trash2 className="h-5 w-5" /> Remove
                </Button>
              </div>
            </div>
          )}

          {transcribing && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Transcribing voice noteâ€¦
            </p>
          )}

          {voiceTranscript && (
            <div className="space-y-1 rounded-xl border bg-muted/40 p-3">
              <Label className="text-sm font-semibold">Transcript</Label>
              <p className="text-sm whitespace-pre-wrap text-slate-700">{voiceTranscript}</p>
            </div>
          )}

          {transcriptionError && (
            <p className="text-sm text-destructive">{transcriptionError}</p>
          )}

          <p className="text-sm text-slate-700 mt-1">Max 25MB Recorded as WebM (browser-native)</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" className="w-full gap-2 py-6" disabled={isSubmitting || recording}>
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Submit Help Request
        </Button>
      </CardFooter>
    </form>
  );
}

