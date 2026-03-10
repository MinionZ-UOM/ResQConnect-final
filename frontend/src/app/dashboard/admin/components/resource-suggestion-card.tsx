"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApprovalStatus, WorkflowResource, WorkflowResourceUpdatePayload } from "@/lib/types/workflow";
import { Package, Save, Pencil, X, Trash2, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles: Record<ApprovalStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
};

type Props = {
  resource: WorkflowResource;
  taskNames: Map<string, string>;
  onSave?: (payload: WorkflowResourceUpdatePayload) => Promise<void> | void;
  onStatusChange?: (status: ApprovalStatus) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isSaving?: boolean;
  isStatusUpdating?: boolean;
  isDeleting?: boolean;
};

export function ResourceSuggestionCard({
  resource,
  taskNames,
  onSave,
  onStatusChange,
  onDelete,
  isSaving = false,
  isStatusUpdating = false,
  isDeleting = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(resource);

  useEffect(() => setDraft(resource), [resource]);

  const breakdown = (resource.breakdown ?? []).map((entry) => ({
    taskId: entry.taskId,
    taskName: taskNames.get(entry.taskId) ?? entry.taskId,
    quantity: entry.quantity,
  }));

  async function handleSave() {
    if (!onSave) {
      setIsEditing(false);
      return;
    }

    const payload: WorkflowResourceUpdatePayload = {};

    if (draft.type !== resource.type) {
      payload.type = draft.type;
    }

    if (draft.totalQuantity !== resource.totalQuantity) {
      payload.total_quantity = draft.totalQuantity;
    }

    if ((draft.quantity ?? null) !== (resource.quantity ?? null)) {
      payload.quantity = draft.quantity ?? null;
    }

    if ((draft.substitutionFor ?? null) !== (resource.substitutionFor ?? null)) {
      payload.substitution_for = draft.substitutionFor ?? null;
    }

    if (!Object.keys(payload).length) {
      setIsEditing(false);
      return;
    }

    try {
      await onSave(payload);
      setIsEditing(false);
    } catch {
      // handled upstream
    }
  }

  async function handleStatusChange(status: ApprovalStatus) {
    if (!onStatusChange) return;
    try {
      await onStatusChange(status);
    } catch {
      // handled upstream
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      await onDelete();
    } catch {
      // handled upstream
    }
  }

  return (
    <div className="rounded-xl border-2 bg-card text-card-foreground p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Package className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{resource.type}</h3>
              <p className="text-sm text-muted-foreground">Total quantity: <span className="font-semibold text-foreground">{resource.totalQuantity}</span></p>
            </div>
          </div>
        </div>

        <Badge className={cn("border text-sm px-3 py-1", statusStyles[resource.approvalStatus])}>
          {resource.approvalStatus.charAt(0).toUpperCase() + resource.approvalStatus.slice(1)}
        </Badge>
      </div>

      {(resource.substitutionFor || resource.quantity) && (
        <div className="grid gap-2 text-sm">
          {resource.quantity && <div><span className="font-semibold">Unit:</span> <span className="text-muted-foreground">{resource.quantity}</span></div>}
          {resource.substitutionFor && (
            <div>
              <span className="font-semibold">Substitution for:</span> <span className="text-muted-foreground">{resource.substitutionFor}</span>
            </div>
          )}
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Suggested Allocation</Label>
          <ul className="space-y-1.5">
            {breakdown.map((item) => (
              <li key={`${resource.id}-${item.taskId}`} className="flex items-center justify-between text-sm bg-muted/20 rounded-lg px-3 py-2">
                <span className="truncate pr-2">{item.taskName}</span>
                <span className="font-bold text-base">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isEditing && (
        <div className="space-y-4 border-t pt-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Type</Label>
            <Input className="h-11" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Total quantity</Label>
            <Input
              className="h-11"
              type="number"
              min={0}
              value={draft.totalQuantity}
              onChange={(e) => setDraft((d) => ({ ...d, totalQuantity: Number(e.target.value || 0) }))}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Unit / Notes</Label>
            <Input
              className="h-11"
              value={draft.quantity ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value || undefined }))}
              placeholder="e.g., boxes, kits"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Substitution for</Label>
            <Input
              className="h-11"
              value={draft.substitutionFor ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, substitutionFor: e.target.value || undefined }))}
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => setIsEditing(true)}
              disabled={isSaving || isStatusUpdating || isDeleting}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="default"
                className="gap-2"
                onClick={handleSave}
                disabled={isSaving || isStatusUpdating || isDeleting}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="default"
                className="gap-2"
                onClick={() => {
                  setDraft(resource);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="default"
                  className="gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving || isStatusUpdating}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {resource.approvalStatus === "pending" && onStatusChange && (
          <div className="flex items-center gap-2">
            <Button
              size="default"
              className="gap-2"
              onClick={() => handleStatusChange("approved")}
              disabled={isStatusUpdating || isSaving || isDeleting}
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="default"
              variant="destructive"
              className="gap-2"
              onClick={() => handleStatusChange("rejected")}
              disabled={isStatusUpdating || isSaving || isDeleting}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
