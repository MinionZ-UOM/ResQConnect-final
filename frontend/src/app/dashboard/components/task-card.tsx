"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, TriangleAlert, Pencil, Save, X, Users, Package, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/lib/types";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";

type Props = {
  task: Task;
  footer?: React.ReactNode;
  onLocalEdit?: (updated: Task) => void;
  onSave?: (updated: Task) => Promise<void> | void;
  onDelete?: (task: Task) => Promise<void> | void;
  /** admin: editable card, responder: readonly card */
  variant?: "admin" | "responder" | "volunteer";
};

export default function TaskCard({ task, footer, onLocalEdit, onSave, onDelete, variant = "admin" }: Props) {
  const isResponder = variant === "responder";
  const isVolunteer = variant === "volunteer";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Task>(task);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { disasters } = useDashboardDisasters();

  useEffect(() => setDraft(task), [task]);

  const requirements = draft.requirements ?? {};
  const resourceDrafts = requirements.resources ?? [];
  const manpowerValue = requirements.manpower?.total_volunteers ?? "";
  const canEditRequirements = !isResponder && !isVolunteer && isEditing;
  const showRequirementsSection =
    canEditRequirements ||
    Boolean(
      task.requirements?.manpower?.total_volunteers != null ||
        (task.requirements?.resources?.length ?? 0) > 0
    );

  const locationText = useMemo(() => {
    if (task?.location?.address) return task.location.address;
    if (task?.location?.lat != null && task?.location?.lng != null) {
      return `(${task.location.lat.toFixed(4)}, ${task.location.lng.toFixed(4)})`;
    }
    return "—";
  }, [task.location]);

  const disasterName = useMemo(() => {
    if (!task.disasterId) return "—";
    return disasters.find((d) => d.id === task.disasterId)?.name ?? task.disasterId;
  }, [disasters, task.disasterId]);

  async function saveEdits() {
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(draft);
        onLocalEdit?.(draft);
        setIsEditing(false);
      } catch {
        // handled upstream
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsEditing(false);
    onLocalEdit?.(draft);
  }
  function cancelEdits() {
    setIsEditing(false);
    setDraft(task);
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(task);
    } catch {
      // handled upstream
    } finally {
      setIsDeleting(false);
      setIsEditing(false);
    }
  }

  function ResourcePill({ name, qty }: { name: string; qty: number }) {
    return (
      <Badge
        variant="outline"
        className="rounded-full px-2.5 py-1 inline-flex items-center gap-1.5"
        title={`${name} ×${qty}`}
      >
        <Package className="h-3.5 w-3.5 opacity-70" />
        <span className="font-medium text-sm">{name}</span>
        <span className="opacity-80">×{qty}</span>
      </Badge>
    );
  }

  const updateRequirements = (updater: (prev: typeof requirements) => typeof requirements) => {
    setDraft((d) => ({
      ...d,
      requirements: updater(d.requirements ?? {}),
    }));
  };

  const updateResourceDraft = (
    index: number,
    updates: Partial<(typeof resourceDrafts)[number]>
  ) => {
    updateRequirements((prev) => {
      const currentResources = prev.resources ? [...prev.resources] : [];
      if (!currentResources[index]) return prev;
      currentResources[index] = { ...currentResources[index], ...updates };
      return {
        ...prev,
        resources: currentResources,
      };
    });
  };

  const removeResourceDraft = (index: number) => {
    updateRequirements((prev) => {
      const currentResources = prev.resources ? [...prev.resources] : [];
      currentResources.splice(index, 1);
      return {
        ...prev,
        resources: currentResources,
      };
    });
  };

  const addResourceDraft = () => {
    updateRequirements((prev) => {
      const currentResources = prev.resources ? [...prev.resources] : [];
      currentResources.push({ type: "", quantity: 1 });
      return {
        ...prev,
        resources: currentResources,
      };
    });
  };

  return (
    <div
      role="group"
      className={cn(
        "rounded-lg border bg-card text-card-foreground p-4",
        "bg-slate-50 hover:bg-muted/40 transition",
        "focus-within:ring-2 focus-within:ring-ring"
      )}
    >
      {/* Header: meta (left) | status (+ edit for admin) (right) */}
      <div className="flex items-start justify-between gap-3">
        {/* LEFT: Meta chips */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Location */}
          {locationText && locationText !== "—" && (
            <Badge
              variant="outline"
              className="h-7 rounded-full border-slate-300/60 bg-slate-500/5 text-slate-700 inline-flex items-center gap-1 px-2.5"
              title={locationText}
            >
              <MapPin className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate max-w-[18rem]">{locationText}</span>
            </Badge>
          )}

          {/* Disaster */}
          {disasterName && disasterName !== "—" && (
            <Badge
              variant="outline"
              className="h-7 rounded-full border-slate-400/40 bg-slate-400/10 text-slate-700 inline-flex items-center gap-1 px-2.5"
              title={disasterName}
            >
              <TriangleAlert className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate max-w-[14rem]">{disasterName}</span>
            </Badge>
          )}

          {/* Priority (pill or editor) */}
          {!isEditing || isResponder || isVolunteer? (
            <PriorityBadge value={task.priority} />
          ) : (
            <div className="flex items-center gap-2">
              <Label className="text-xs">Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as TaskPriority }))}
              >
                <SelectTrigger className="h-7 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}
        </div>

        {/* RIGHT: Status + (Edit for admin only when Pending) */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge value={task.status} />

          {/* Admin can edit only while Pending */}
          {!isResponder && !isVolunteer && task.status === "Pending" && (
            !isEditing ? (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1" onClick={saveEdits} disabled={isSaving || isDeleting}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="gap-1" onClick={cancelEdits} disabled={isSaving}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={handleDelete}
                    disabled={isSaving || isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Description — NEVER clamped */}
      {!isEditing || isResponder || isVolunteer ? (
        task.description && (
          <div className="mt-6">
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-2">
          <Label className="text-sm">Task details</Label>
          <Textarea
            className="min-h-[96px]"
            value={draft.description ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
      )}

      {/* Requirements (glanceable in responder, editable in admin) */}
      {showRequirementsSection && (
        <div className="mt-5 space-y-3">
          <Label className="text-lg text-slate-800">Requirements</Label>

          {canEditRequirements ? (
            <div className="space-y-4 rounded-lg border border-dashed border-slate-300 bg-white p-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700">Manpower</Label>
                <Input
                  type="number"
                  min={0}
                  value={manpowerValue ?? ""}
                  readOnly
                  className="max-w-[140px]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-slate-700">Resources</Label>

                <div className="space-y-3">
                  {resourceDrafts.map((resource, index) => (
                    <div key={`${resource.resourceId ?? "new"}-${index}`} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <Input
                          value={resource.type}
                          onChange={(event) =>
                            updateResourceDraft(index, { type: event.target.value })
                          }
                          placeholder="Type (e.g., medikit)"
                        />
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Label className="text-xs uppercase tracking-wide text-slate-500">Qty</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          className="max-w-[120px]"
                          value={resource.quantity ?? ""}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            updateResourceDraft(index, {
                              quantity: Number.isFinite(value) ? value : 0,
                            });
                          }}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-slate-500 hover:text-slate-900"
                          onClick={() => removeResourceDraft(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove resource</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {!resourceDrafts.length && (
                    <p className="text-sm text-slate-500">No resources added yet.</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addResourceDraft}
                >
                  <Plus className="h-4 w-4" />
                  Add resource
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {task.requirements?.manpower?.total_volunteers != null && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 border-slate-300/70 bg-slate-100"
                  title={`${task.requirements.manpower.total_volunteers} volunteers`}
                >
                  <Users className="h-3.5 w-3.5 opacity-70" />
                  <span className="font-medium text-sm">Manpower</span>
                  <span className="opacity-80">: {task.requirements.manpower.total_volunteers}</span>
                </Badge>
              )}
              {task.requirements?.resources?.map((r, i) => (
                <ResourcePill key={`${r.type}-${i}`} name={r.type} qty={r.quantity} />
              ))}
            </div>
          )}
        </div>
      )}

      {footer && <div className="mt-6 mb-2">{footer}</div>}
    </div>
  );
}