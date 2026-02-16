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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";

import { MapPin, Mic, Camera, Send, Trash2, Loader2, StopCircle } from "lucide-react";
import type {
  FieldReportCreate,
  FieldReportSeverity,
} from "@/lib/types";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";

/* ---------- Constants ---------- */
const severities: [FieldReportSeverity, ...FieldReportSeverity[]] = ["Critical", "High", "Medium", "Low"];

const observationTypes = [
  "Damage Assessment",
  "Blocked Road",
  "Medical Need",
  "Shelter Need",
  "Resource Request",
  "Volunteer Availability",
  "Other",
] as const;

const MAX_IMAGE_MB = 8;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/* ---------- Schema ---------- */
// NOTE: location, photos, voiceNote are optional by request.
const formSchema = z.object({
  disaster: z.string().min(2, "Select a disaster."),
  observationType: z.enum(observationTypes),
  severity: z.enum(severities),
  title: z.string().min(5, "Title must be at least 5 characters."),
  // Reason details failed earlier: length was too strict. Relaxed to 8.
  details: z.string().min(8, "Please provide at least 8 characters."),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      // Make address optional (no error if empty)
      address: z.string().min(3, "Address should be at least 3 characters.").optional(),
    })
    .optional(),
  photos: z.array(z.instanceof(File)).max(8, "You can add up to 8 photos.").optional(),
  voiceNote: z.instanceof(File).nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;
type Props = { onSubmit: (data: FieldReportCreate) => void };

export default function FieldReportForm({ onSubmit }: Props) {
  const { toast } = useToast();
  const { joinedDisasters } = useDashboardDisasters();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",            // ✅ show error after leaving a field
    reValidateMode: "onChange" // ✅ live re-validate while typing
  });

  // ---------- Defaults ----------
  // We still provide defaults, but schema won't force location.
  useEffect(() => {
    setValue("location", { lat: 6.9271, lng: 79.8612, address: "" }, { shouldDirty: false });
    setValue("observationType", "Damage Assessment", { shouldDirty: false });
    setValue("severity", "Critical", { shouldDirty: false });
    setValue("photos", [], { shouldDirty: false });
    setValue("voiceNote", null, { shouldDirty: false });
  }, [setValue]);

  /* ---------- Photos ---------- */
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photos = watch("photos") ?? [];
  const pickPhotos = () => photoInputRef.current?.click();
  const onPhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => ALLOWED_IMG_TYPES.includes(f.type) && f.size <= MAX_IMAGE_MB * 1024 * 1024);
    const merged = [...photos, ...valid].slice(0, 8);
    setValue("photos", merged, { shouldValidate: true, shouldDirty: true });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };
  const removePhotoAt = (idx: number) =>
    setValue(
      "photos",
      photos.filter((_, i) => i !== idx),
      { shouldValidate: true, shouldDirty: true }
    );
  const previews = useMemo(() => photos.map((f) => ({ url: URL.createObjectURL(f), name: f.name })), [photos]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  /* ---------- Voice Note ---------- */
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
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
        const file = new File([blob], `field-report-voice-${Date.now()}.webm`, { type: "audio/webm" });
        setValue("voiceNote", file, { shouldValidate: true, shouldDirty: true });
        const url = URL.createObjectURL(blob);
        if (audioURL) URL.revokeObjectURL(audioURL);
        setAudioURL(url);
      };
      setRecorder(mr);
      mr.start();
      setRecording(true);
      startTimer();
    } catch {
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => recorder?.state !== "inactive" && recorder?.stop();

  const deleteVoice = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setValue("voiceNote", null, { shouldValidate: true, shouldDirty: true });
    stopTimer();
    setRecording(false);
  };

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ---------- Geolocation ---------- */
  const [geoLoading, setGeoLoading] = useState(false);
  const geolocate = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("location", { ...(watch("location") ?? {}), lat: pos.coords.latitude, lng: pos.coords.longitude }, { shouldDirty: true });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert("Unable to get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ---------- Submit ---------- */
  const submitForm = (data: FormData) => {
    onSubmit(data);
    toast({
      title: "✅ Report submitted",
      description: "Your field report was sent successfully.",
    });
    reset({
      disaster: "",
      observationType: "Damage Assessment",
      severity: "Critical",
      title: "",
      details: "",
      location: { lat: 6.9271, lng: 79.8612, address: "" },
      photos: [],
      voiceNote: null,
    });
    // cleanup voice preview
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
  };

  /* ---------- Render ---------- */
  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <CardContent className="space-y-6">
        {/* Disaster & Observation Type */}
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

          <div className="space-y-2">
            <Label className="text-lg font-semibold">Observation Type</Label>
            <Controller
              name="observationType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Damage Assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {observationTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.observationType && <p className="text-destructive text-sm">{errors.observationType.message}</p>}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Title</Label>
          <Input
            placeholder="Landslide at Kadugannawa blocks A1 — traffic halted"
            {...register("title")}
            className="h-12"
          />
          {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Details</Label>
          <Textarea rows={4} placeholder="Describe the situation, accessibility, weather, hazards..." {...register("details")} />
          <p className="text-xs text-slate-700">At least 8 characters.</p>
          {errors.details && <p className="text-destructive text-sm">{errors.details.message}</p>}
        </div>

        {/* Severity (Radio) */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Severity</Label>
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {severities.map((s) => (
                  <div key={s} className="flex items-center gap-2 rounded-md border p-3">
                    <RadioGroupItem id={`sev-${s}`} value={s} />
                    <Label htmlFor={`sev-${s}`} className="cursor-pointer">
                      {s}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          {errors.severity && <p className="text-destructive text-sm">{errors.severity.message}</p>}
        </div>

        {/* Location (Optional) */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold">Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <div className="flex gap-2">
            <Input {...register("location.address")} placeholder="Address or nearest landmark" className="h-12" />
            <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={geolocate}>
              {geoLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            lat {(watch("location")?.lat ?? 6.9271).toFixed(5)} | lng {(watch("location")?.lng ?? 79.8612).toFixed(5)}
          </p>
          {errors.location?.address && <p className="text-destructive text-sm">{errors.location.address.message}</p>}
        </div>

        <Separator />

        {/* Photos (Optional) */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Photos <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
              className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors bg-muted/20 hover:bg-[#68b4f4]/20 shadow-sm"
            >
              <Camera className="h-6 w-6 mb-1 text-muted-foreground" />
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
          <p className="text-xs text-muted-foreground">Up to 8 photos • JPG/PNG/WebP/HEIC • ≤ {MAX_IMAGE_MB}MB each</p>
        </div>

        <Separator />

        {/* Voice Note (Optional) */}
        <div className="space-y-3">
          <div>
            <Label className="text-lg font-semibold block mb-1">Voice Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
            {!audioURL && !recording && (
              <Button type="button" variant="outline" className="gap-2 h-12 rounded-xl hover:bg-[#68b4f4]/20" onClick={startRecording}>
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

          <p className="text-xs text-muted-foreground mt-1">Max 25MB • Recorded as WebM (browser-native)</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" className="w-full gap-2 py-6" disabled={isSubmitting || recording}>
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Submit Field Report
        </Button>
      </CardFooter>
    </form>
  );
}