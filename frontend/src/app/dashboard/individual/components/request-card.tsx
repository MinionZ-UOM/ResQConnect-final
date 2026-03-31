"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { MapPin, ChevronDown, ChevronUp, TriangleAlert, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockDisasters } from "@/lib/mock-data";

export type TrackableRequest = {
  id: string;
  title: string;
  disasterId?: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  location?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
};

type Props = {
  request: TrackableRequest;
  onDelete?: (requestId: string) => Promise<void> | void;
  isDeleting?: boolean;
};

export default function RequestCard({ request, onDelete, isDeleting = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!el) return;
      if (!expanded) {
        setCanExpand(el.scrollHeight > el.clientHeight + 1);
      } else {
        setCanExpand(true);
      }
    };

    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    window.addEventListener("resize", checkOverflow);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [expanded, request.description]);

  const lat = request.location?.lat ?? request.location?.latitude;
  const lng = request.location?.lng ?? request.location?.longitude;
  const locationText =
    request.location?.address ||
    (lat != null && lng != null ? `(${lat.toFixed(4)}, ${lng.toFixed(4)})` : "-");

  const disasterName = useMemo(() => {
    const found = mockDisasters.find((d) => d.id === request.disasterId);
    return found ? found.name : (request.disasterId ?? "-");
  }, [request.disasterId]);

  return (
    <div
      role="group"
      className={cn(
        "rounded-xl border bg-slate-50 p-4 sm:p-5 space-y-3 sm:space-y-4",
        "focus-within:ring-2 focus-within:ring-ring"
      )}
    >
      <h3 className="text-base sm:text-lg font-semibold text-slate-800">{request.title}</h3>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="h-7 rounded-full border-slate-300/60 bg-slate-500/5 text-slate-700 inline-flex items-center gap-1 px-2.5"
          title={locationText}
        >
          <MapPin className="h-3.5 w-3.5 opacity-70" />
          <span className="truncate max-w-[18rem]">{locationText}</span>
        </Badge>

        {/* <Badge
          variant="outline"
          className="h-7 rounded-full border-slate-400/40 bg-slate-400/10 text-slate-700 inline-flex items-center gap-1 px-2.5"
          title={disasterName}
        >
          <TriangleAlert className="h-3.5 w-3.5 opacity-70" />
          <span className="truncate max-w-[14rem]">{disasterName}</span>
        </Badge> */}

        <PriorityBadge value={request.priority} />
      </div>

      {request.description && (
        <div>
          <p
            ref={descRef}
            className={cn(
              "text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap",
              expanded ? "" : "line-clamp-2"
            )}
            style={
              expanded
                ? undefined
                : {
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }
            }
          >
            {request.description}
          </p>

          {canExpand && (
            <button
              className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm text-primary font-medium hover:underline"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="pt-2 border-t flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm font-medium text-slate-600">Current Status:</span>
        <StatusBadge value={request.status} />
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto gap-1 text-destructive border-destructive/40 hover:bg-destructive/5"
            onClick={() => {
              void onDelete(request.id);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
