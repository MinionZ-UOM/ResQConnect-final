"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter as FilterIcon, RotateCcw, X, Check } from "lucide-react";
import TaskCard from "../../components/task-card";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import type { Request } from "@/lib/types/request";
import type { WorkflowResourceUpdatePayload, WorkflowTaskUpdatePayload } from "@/lib/types/workflow";
import { cn } from "@/lib/utils";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";
import { useToast } from "@/components/ui/use-toast";
import { normalizeApiError } from "@/lib/normalize-api-error";
import {
  ADMIN_SUGGESTIONS_QUERY_KEY,
  fetchAdminSuggestions,
} from "@/services/adminSuggestionsService";
import {
  buildTaskSuggestions,
  mapTaskPriorityToApi,
  mapTaskStatusToApprovalStatus,
} from "@/lib/utils/taskSuggestionMapping";
import {
  createWorkflowResource,
  deleteWorkflowResource,
  deleteWorkflowTask,
  updateWorkflowResource,
  updateWorkflowTask,
} from "@/services/workflowOutputService";
import type { AdminSuggestionsData } from "@/services/adminSuggestionsService";

export default function AdminTasksTab() {
  const [disasterFilter, setDisasterFilter] = useState<"All" | string>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TaskPriority>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | TaskStatus>("All");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const { disasters } = useDashboardDisasters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ADMIN_SUGGESTIONS_QUERY_KEY,
    queryFn: fetchAdminSuggestions,
  });

  const outputs = data?.outputs ?? [];
  const requests = data?.requests ?? [];

  const requestById = useMemo(() => {
    const map = new Map<string, Request>();
    for (const request of requests) {
      map.set(request.id, request);
    }
    return map;
  }, [requests]);

  const disasterNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const disaster of disasters) {
      map.set(disaster.id, disaster.name);
    }
    return map;
  }, [disasters]);

  const taskToRequestId = useMemo(() => {
    const map = new Map<string, string>();
    for (const output of outputs) {
      for (const task of output.tasks) {
        map.set(task.id, output.requestId);
      }
    }
    return map;
  }, [outputs]);

  const tasks = useMemo(
    () => buildTaskSuggestions(outputs, requestById),
    [outputs, requestById]
  );

  const filteredGrouped = useMemo(() => {
    const groups = new Map<string, Task[]>();

    for (const task of tasks) {
      const request = requestById.get(task.requestId);
      const disasterId = task.disasterId ?? request?.disasterId;

      const matchesDisaster = disasterFilter === "All" || disasterId === disasterFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;

      const allowedStatuses: TaskStatus[] = ["Pending", "Approved", "Rejected"];
      if (!allowedStatuses.includes(task.status)) continue;

      if (matchesDisaster && matchesPriority && matchesStatus) {
        if (!groups.has(task.requestId)) {
          groups.set(task.requestId, []);
        }
        groups.get(task.requestId)!.push(task);
      }
    }

    for (const [key, arr] of groups) {
      arr.sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return 0;
      });
      groups.set(key, arr);
    }

    return groups;
  }, [tasks, requestById, disasterFilter, priorityFilter, statusFilter]);

  const resetFilters = () => {
    setDisasterFilter("All");
    setPriorityFilter("All");
    setStatusFilter("All");
  };

  type UpdateTaskVariables = {
    requestId: string;
    taskId: string;
    payload: WorkflowTaskUpdatePayload;
    successMessage?: string;
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({ requestId, taskId, payload }: UpdateTaskVariables) =>
      updateWorkflowTask(requestId, taskId, payload),
    onSuccess: (updatedTask, { requestId, successMessage }) => {
      queryClient.setQueryData(
        ADMIN_SUGGESTIONS_QUERY_KEY,
        (current: AdminSuggestionsData | undefined) => {
          if (!current) return current;

          return {
            ...current,
            outputs: current.outputs.map((output) => {
              if (output.requestId !== requestId) return output;
              return {
                ...output,
                tasks: output.tasks.map((task) =>
                  task.id === updatedTask.id ? updatedTask : task
                ),
              };
            }),
          } satisfies AdminSuggestionsData;
        }
      );

      if (successMessage) {
        toast({ title: successMessage });
      }
    },
    onError: (err) => {
      toast({
        title: "Failed to update task",
        description: normalizeApiError(err).message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: ({ requestId, taskId }: { requestId: string; taskId: string }) =>
      deleteWorkflowTask(requestId, taskId),
    onSuccess: (_, { requestId, taskId }) => {
      queryClient.setQueryData(
        ADMIN_SUGGESTIONS_QUERY_KEY,
        (current: AdminSuggestionsData | undefined) => {
          if (!current) return current;

          return {
            ...current,
            outputs: current.outputs.map((output) => {
              if (output.requestId !== requestId) return output;
              return {
                ...output,
                tasks: output.tasks.filter((task) => task.id !== taskId),
                resourceSuggestions: output.resourceSuggestions.map((resource) => ({
                  ...resource,
                  breakdown: (resource.breakdown ?? []).filter(
                    (entry) => entry.taskId !== taskId
                  ),
                })),
                manpower: output.manpower
                  ? {
                      ...output.manpower,
                      breakdown: (output.manpower.breakdown ?? []).filter(
                        (entry) => entry.taskId !== taskId
                      ),
                    }
                  : undefined,
              };
            }),
          } satisfies AdminSuggestionsData;
        }
      );

      toast({ title: "Task deleted" });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete task",
        description: normalizeApiError(err).message,
        variant: "destructive",
      });
    },
  });

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    const approvalStatus = mapTaskStatusToApprovalStatus(newStatus);
    const requestId = taskToRequestId.get(taskId);
    if (!approvalStatus || !requestId) return;

    setStatusUpdatingId(taskId);
    try {
      await updateTaskMutation.mutateAsync({
        requestId,
        taskId,
        payload: { approval_status: approvalStatus },
        successMessage:
          newStatus === "Approved"
            ? "Task approved"
            : newStatus === "Rejected"
              ? "Task rejected"
              : "Task updated",
      });
    } catch {
      // error handled via onError
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleSaveTask(updatedTask: Task) {
    const requestId = taskToRequestId.get(updatedTask.id) ?? updatedTask.requestId;
    if (!requestId) return;

    const payload: WorkflowTaskUpdatePayload = {};

    const currentOutput = outputs.find((output) => output.requestId === requestId);
    const currentTask = currentOutput?.tasks.find((task) => task.id === updatedTask.id);
    const currentResources = currentOutput?.resourceSuggestions ?? [];

    if (typeof updatedTask.description === "string" && updatedTask.description !== currentTask?.step) {
      payload.step = updatedTask.description;
    }

    if (updatedTask.priority) {
      const normalizedPriority = mapTaskPriorityToApi(updatedTask.priority);
      if (!currentTask || normalizedPriority !== currentTask.priority) {
        payload.priority = normalizedPriority;
      }
    }

    type SanitizedResource = {
      resourceId?: string;
      type: string;
      quantity: number;
      unit?: string;
    };

    const sanitizedResources: SanitizedResource[] = (updatedTask.requirements?.resources ?? [])
      .map((resource) => {
        const parsedQuantity = Number(resource.quantity);
        const normalizedQuantity = Number.isFinite(parsedQuantity)
          ? Math.max(0, Math.round(parsedQuantity))
          : Number.NaN;
        return {
          resourceId: resource.resourceId,
          type: resource.type.trim(),
          quantity: normalizedQuantity,
          unit: resource.unit?.trim(),
        } satisfies SanitizedResource;
      })
      .filter((resource) => resource.type.length > 0 && Number.isFinite(resource.quantity) && resource.quantity > 0);

    const resourcesById = new Map<string, SanitizedResource>();
    const resourcesToCreate: SanitizedResource[] = [];

    for (const resource of sanitizedResources) {
      if (resource.resourceId) {
        resourcesById.set(resource.resourceId, resource);
      } else {
        resourcesToCreate.push(resource);
      }
    }

    const resourceOperations: Array<() => Promise<void>> = [];

    for (const resource of currentResources) {
      const breakdownEntry = resource.breakdown.find((entry) => entry.taskId === updatedTask.id);
      if (!breakdownEntry) continue;

      const match = resourcesById.get(resource.id);
      if (!match) {
        const remainingBreakdown = resource.breakdown.filter((entry) => entry.taskId !== updatedTask.id);

        if (remainingBreakdown.length === 0) {
          resourceOperations.push(() => deleteWorkflowResource(requestId, resource.id));
        } else {
          const totalQuantity = remainingBreakdown.reduce((sum, entry) => sum + entry.quantity, 0);
          resourceOperations.push(() =>
            updateWorkflowResource(requestId, resource.id, {
              breakdown: remainingBreakdown.map((entry) => ({
                task_id: entry.taskId,
                quantity: entry.quantity,
              })),
              total_quantity: totalQuantity,
            })
          );
        }
        continue;
      }

      resourcesById.delete(resource.id);

      const normalizedUnit = match.unit && match.unit.length ? match.unit : undefined;
      const existingUnit = resource.quantity ?? undefined;
      const quantityChanged = match.quantity !== breakdownEntry.quantity;
      const typeChanged = match.type !== resource.type;
      const unitChanged = normalizedUnit !== existingUnit;

      if (!quantityChanged && !typeChanged && !unitChanged) {
        continue;
      }

      const updatedBreakdown = resource.breakdown.map((entry) =>
        entry.taskId === updatedTask.id
          ? { taskId: entry.taskId, quantity: match.quantity }
          : entry
      );

      const payloadUpdates: WorkflowResourceUpdatePayload = {};

      if (typeChanged) {
        payloadUpdates.type = match.type;
      }

      if (unitChanged) {
        payloadUpdates.quantity = normalizedUnit ?? null;
      }

      if (quantityChanged) {
        payloadUpdates.breakdown = updatedBreakdown.map((entry) => ({
          task_id: entry.taskId,
          quantity: entry.quantity,
        }));
        payloadUpdates.total_quantity = updatedBreakdown.reduce((sum, entry) => sum + entry.quantity, 0);
      }

      resourceOperations.push(() => updateWorkflowResource(requestId, resource.id, payloadUpdates));
    }

    if (resourcesById.size > 0) {
      for (const leftover of resourcesById.values()) {
        resourcesToCreate.push(leftover);
      }
    }

    for (const resource of resourcesToCreate) {
      resourceOperations.push(() =>
        createWorkflowResource(requestId, {
          type: resource.type,
          total_quantity: resource.quantity,
          breakdown: [
            {
              task_id: updatedTask.id,
              quantity: resource.quantity,
            },
          ],
          quantity: resource.unit && resource.unit.length ? resource.unit : null,
        })
      );
    }

    const hasTaskChanges = Object.keys(payload).length > 0;
    const hasResourceChanges = resourceOperations.length > 0;

    if (!hasTaskChanges && !hasResourceChanges) {
      return;
    }

    if (hasTaskChanges) {
      await updateTaskMutation.mutateAsync({
        requestId,
        taskId: updatedTask.id,
        payload,
        successMessage: hasResourceChanges ? undefined : "Task updated",
      });
    }

    if (hasResourceChanges) {
      try {
        for (const operation of resourceOperations) {
          await operation();
        }

        await queryClient.invalidateQueries({ queryKey: ADMIN_SUGGESTIONS_QUERY_KEY });

        toast({ title: hasTaskChanges ? "Task updated" : "Resources updated" });
      } catch (error) {
        toast({
          title: "Failed to update resources",
          description: normalizeApiError(error).message,
          variant: "destructive",
        });
        throw error;
      }
    }
  }

  async function handleDeleteTask(task: Task) {
    const requestId = taskToRequestId.get(task.id) ?? task.requestId;
    if (!requestId) return;

    setDeletingTaskId(task.id);
    try {
      await deleteTaskMutation.mutateAsync({ requestId, taskId: task.id });
    } catch {
      // error handled via onError
    } finally {
      setDeletingTaskId(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Tasks</CardTitle>
          <CardDescription>Loading task suggestions…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">Fetching tasks…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Tasks</CardTitle>
          <CardDescription>Unable to load task suggestions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-destructive">
            {normalizeApiError(error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Admin Tasks</CardTitle>
            <CardDescription>Search, filter, and approve or reject tasks.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <Card className="border">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2" aria-label="Reset filters">
                <RotateCcw className="h-4 w-6" /> Reset
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Disaster</Label>
                <Select value={disasterFilter} onValueChange={setDisasterFilter}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {disasters.map((disaster) => (
                      <SelectItem key={disaster.id} value={disaster.id}>
                        {disaster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold">Priority</Label>
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "All")}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "All")}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {[...filteredGrouped.entries()].map(([requestId, tasksInRequest]) => {
          const request = requestById.get(requestId);
          if (!request) return null;

          const locationText = request.location?.address
            ? request.location.address
            : request.location?.lat && request.location?.lng
              ? `(${request.location.lat.toFixed(4)}, ${request.location.lng.toFixed(4)})`
              : "—";

          const disasterName = request.disasterId
            ? disasterNames.get(request.disasterId) ?? request.disasterId
            : "—";

          return (
            <Card
              key={requestId}
              className={cn(
                "border overflow-hidden rounded-xl shadow-sm group",
                "border-sky-200",
                "bg-sky-50/60"
              )}
            >
              <div className={cn("h-1 w-full", "bg-sky-400")} />
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {disasterName} · {locationText}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 grid-cols-1">
                  {tasksInRequest.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onSave={handleSaveTask}
                      onDelete={() => handleDeleteTask(task)}
                      footer={
                        <AdminFooter
                          task={task}
                          onUpdateStatus={updateStatus}
                          isUpdating={statusUpdatingId === task.id}
                          isDeleting={deletingTaskId === task.id}
                        />
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredGrouped.size === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No tasks match your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminFooter({
  task,
  onUpdateStatus,
  isUpdating,
  isDeleting,
}: {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  if (task.status !== "Pending") {
    return <div />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Button
        className="gap-2"
        onClick={() => onUpdateStatus(task.id, "Approved")}
        disabled={isUpdating || isDeleting}
      >
        <Check className="h-4 w-4" />
        Approve
      </Button>
      <Button
        variant="destructive"
        className="gap-2"
        onClick={() => onUpdateStatus(task.id, "Rejected")}
        disabled={isUpdating || isDeleting}
      >
        <X className="h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}
