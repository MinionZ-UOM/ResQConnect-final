"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/types";

// --- Colors ---
export const PRIORITY_BADGE: Record<TaskPriority | string, string> = {
  High: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  Medium: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  Low: "bg-green-500/15 text-green-700 border-green-500/30",
};

// Just one style for all statuses - primary blue
const STATUS_STYLE = "bg-primary/10 text-primary border-primary/30";

// --- Shared pill shape (keeps consistent height/spacing) ---
const PILL_CLASSES =
  "inline-flex h-7 items-center justify-center rounded-full border px-3 text-sm";

// --- Components ---
type CommonProps = React.ComponentPropsWithoutRef<typeof Badge> & {
  value: string;
};

export function PriorityBadge({ value, className, ...rest }: CommonProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        PILL_CLASSES,
        PRIORITY_BADGE[value] ?? "bg-slate-500/10 text-slate-700 border-slate-500/30",
        className
      )}
      aria-label={`Priority: ${value}`}
      {...rest}
    >
      {value}
    </Badge>
  );
}

export function StatusBadge({ value, className, ...rest }: CommonProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        PILL_CLASSES, 
        STATUS_STYLE, 
        className
      )}
      aria-label={`Status: ${value}`}
      {...rest}
    >
      {value}
    </Badge>
  );
}