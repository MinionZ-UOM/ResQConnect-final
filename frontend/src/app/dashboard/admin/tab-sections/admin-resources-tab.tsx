"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter as FilterIcon, RotateCcw } from "lucide-react";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";
import { useToast } from "@/components/ui/use-toast";
import { normalizeApiError } from "@/lib/normalize-api-error";
import {
  ADMIN_SUGGESTIONS_QUERY_KEY,
  fetchAdminSuggestions,
} from "@/services/adminSuggestionsService";
import { ResourceSuggestionCard } from "../components/resource-suggestion-card";
import { AdminKpiStrip } from "../components/admin-kpi-strip";
import { AdminDistributionToolbar } from "../components/admin-distribution-toolbar";
import { AdminSupplySnapshot } from "../components/admin-supply-snapshot";
import { AdminRequestDetailsDialog } from "../components/admin-request-details-dialog";
import { updateWorkflowResource, deleteWorkflowResource } from "@/services/workflowOutputService";
import type { AdminSuggestionsData } from "@/services/adminSuggestionsService";
import type { ApprovalStatus, WorkflowResource, WorkflowResourceUpdatePayload } from "@/lib/types/workflow";
import type { Request } from "@/lib/types/request";

type ResourceRow = {
  requestId: string;
  resource: WorkflowResource;
};

export default function AdminResourcesTab() {
  const [disasterFilter, setDisasterFilter] = useState<"All" | string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ApprovalStatus>("All");
  const [savingResourceId, setSavingResourceId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [isAutoPlan, setIsAutoPlan] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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

  const taskNamesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const output of outputs) {
      for (const task of output.tasks) {
        map.set(task.id, task.step);
      }
    }
    return map;
  }, [outputs]);

  const resourceRows = useMemo<ResourceRow[]>(
    () =>
      outputs.flatMap((output) =>
        output.resourceSuggestions.map((resource) => ({ requestId: output.requestId, resource }))
      ),
    [outputs]
  );

  const filteredResources = useMemo(() => {
    return resourceRows.filter(({ requestId, resource }) => {
      const request = requestById.get(requestId);
      const disasterMatches = disasterFilter === "All" || request?.disasterId === disasterFilter;
      const statusMatches = statusFilter === "All" || resource.approvalStatus === statusFilter;
      return disasterMatches && statusMatches;
    });
  }, [resourceRows, requestById, disasterFilter, statusFilter]);

  const groupedResources = useMemo(() => {
    const map = new Map<string, WorkflowResource[]>();
    for (const { requestId, resource } of filteredResources) {
      const list = map.get(requestId) ?? [];
      list.push(resource);
      map.set(requestId, list);
    }
    return map;
  }, [filteredResources]);

  const kpis = useMemo(() => {
    const totalRequests = requests.length;
    const totalSuggestedResources = resourceRows.length;
    const pendingResources = resourceRows.filter((r) => r.resource.approvalStatus === "pending").length;
    const approvedResources = resourceRows.filter((r) => r.resource.approvalStatus === "approved").length;
    const rejectedResources = resourceRows.filter((r) => r.resource.approvalStatus === "rejected").length;

    const requestsWithPending = new Set(
      resourceRows.filter((r) => r.resource.approvalStatus === "pending").map((r) => r.requestId)
    ).size;

    const filteredResults = filteredResources.length;

    return {
      totalRequests,
      totalSuggestedResources,
      pendingResources,
      approvedResources,
      rejectedResources,
      requestsWithPending,
      filteredResults,
    };
  }, [requests.length, resourceRows, filteredResources.length]);

  const resetFilters = () => {
    setDisasterFilter("All");
    setStatusFilter("All");
  };

  const handleAutoPlanToggle = (checked: boolean) => {
    setIsAutoPlan(checked);
    toast({
      title: "Activated",
      description: "Automatic Planning Activated",
    });
  };

  type UpdateResourceVariables = {
    requestId: string;
    resourceId: string;
    payload: WorkflowResourceUpdatePayload;
    successMessage?: string;
  };

  const updateResourceMutation = useMutation({
    mutationFn: ({ requestId, resourceId, payload }: UpdateResourceVariables) =>
      updateWorkflowResource(requestId, resourceId, payload),
    onSuccess: (updatedResource, { requestId, successMessage }) => {
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
                resourceSuggestions: output.resourceSuggestions.map((resource) =>
                  resource.id === updatedResource.id ? updatedResource : resource
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
        title: "Failed to update resource",
        description: normalizeApiError(err).message,
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: ({ requestId, resourceId }: { requestId: string; resourceId: string }) =>
      deleteWorkflowResource(requestId, resourceId),
    onSuccess: (_, { requestId, resourceId }) => {
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
                resourceSuggestions: output.resourceSuggestions.filter(
                  (resource) => resource.id !== resourceId
                ),
              };
            }),
          } satisfies AdminSuggestionsData;
        }
      );

      toast({ title: "Resource deleted" });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete resource",
        description: normalizeApiError(err).message,
        variant: "destructive",
      });
    },
  });

  async function handleResourceSave(
    requestId: string,
    resourceId: string,
    payload: WorkflowResourceUpdatePayload
  ) {
    if (!Object.keys(payload).length) return;

    setSavingResourceId(resourceId);
    try {
      await updateResourceMutation.mutateAsync({
        requestId,
        resourceId,
        payload,
        successMessage: "Resource updated",
      });
    } catch {
      // handled via onError
    } finally {
      setSavingResourceId(null);
    }
  }

  async function handleResourceStatusChange(
    requestId: string,
    resourceId: string,
    status: ApprovalStatus
  ) {
    setStatusUpdatingId(resourceId);
    try {
      await updateResourceMutation.mutateAsync({
        requestId,
        resourceId,
        payload: { approval_status: status },
        successMessage: status === "approved" ? "Resource approved" : "Resource rejected",
      });
    } catch {
      // handled via onError
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleResourceDelete(requestId: string, resourceId: string) {
    setDeletingResourceId(resourceId);
    try {
      await deleteResourceMutation.mutateAsync({ requestId, resourceId });
    } catch {
      // handled via onError
    } finally {
      setDeletingResourceId(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Management</CardTitle>
          <CardDescription>Loading resource suggestions…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">Fetching resources…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Management</CardTitle>
          <CardDescription>Unable to load resource suggestions.</CardDescription>
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
            <CardTitle>Resource Management</CardTitle>
            <CardDescription>Review, update, and approve AI-suggested resources.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* KPI Strip & Distribution Planning Toolbar */}
        <div className="flex flex-col gap-4">
          <AdminKpiStrip kpis={kpis} />
          <AdminDistributionToolbar isAutoPlan={isAutoPlan} onAutoPlanToggle={handleAutoPlanToggle} />
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label className="text-lg font-semibold">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus | "All")}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <AdminSupplySnapshot isOpen={isSnapshotOpen} onOpenChange={setIsSnapshotOpen} />

        {[...groupedResources.entries()].map(([requestId, rows]) => {
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

          const hasPending = rows.some((r) => r.approvalStatus === "pending");
          const allApproved = rows.every((r) => r.approvalStatus === "approved");
          const allRejected = rows.every((r) => r.approvalStatus === "rejected");

          let planStatus = "Mixed";
          let badgeColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50";

          if (hasPending) {
            planStatus = "Needs Review";
            badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50";
          } else if (allApproved) {
            planStatus = "Ready";
            badgeColor = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50";
          } else if (allRejected) {
            planStatus = "Rejected";
            badgeColor = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50";
          }

          return (
            <Card key={requestId} className="border overflow-hidden rounded-xl shadow-sm">
              <div className="h-1 w-full bg-violet-400" />
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedRequestId(requestId)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{request.title}</CardTitle>
                      <Badge variant="secondary" className={`pointer-events-none ${badgeColor}`}>
                        {planStatus}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      {disasterName} · {locationText}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4">
                  {rows.map((resource) => (
                    <ResourceSuggestionCard
                      key={resource.id}
                      resource={resource}
                      taskNames={taskNamesById}
                      onSave={(payload) => handleResourceSave(requestId, resource.id, payload)}
                      onStatusChange={(status) => handleResourceStatusChange(requestId, resource.id, status)}
                      onDelete={() => handleResourceDelete(requestId, resource.id)}
                      isSaving={savingResourceId === resource.id}
                      isStatusUpdating={statusUpdatingId === resource.id}
                      isDeleting={deletingResourceId === resource.id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {groupedResources.size === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No resources match your filters.
          </div>
        )}
      </CardContent>

      {(() => {
        const selectedRequest = selectedRequestId ? requestById.get(selectedRequestId) ?? null : null;
        const selectedRows = selectedRequestId ? groupedResources.get(selectedRequestId) ?? [] : [];

        const selectedDisasterName = selectedRequest?.disasterId
          ? disasterNames.get(selectedRequest.disasterId) ?? selectedRequest.disasterId
          : "—";
        const selectedLocationText = selectedRequest?.location?.address
          ? selectedRequest.location.address
          : selectedRequest?.location?.lat && selectedRequest?.location?.lng
            ? `(${selectedRequest.location.lat.toFixed(4)}, ${selectedRequest.location.lng.toFixed(4)})`
            : "—";

        return (
          <AdminRequestDetailsDialog
            isOpen={!!selectedRequestId}
            onOpenChange={(open) => !open && setSelectedRequestId(null)}
            request={selectedRequest}
            resources={selectedRows}
            disasterName={selectedDisasterName}
            locationText={selectedLocationText}
          />
        );
      })()}
    </Card>
  );
}
