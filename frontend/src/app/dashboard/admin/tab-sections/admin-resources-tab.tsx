"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Filter as FilterIcon, RotateCcw, ChevronDown, Download, Play, Settings, Table as TableIcon } from "lucide-react";
import { useDashboardDisasters } from "@/context/dashboard-disaster-context";
import { useToast } from "@/components/ui/use-toast";
import { normalizeApiError } from "@/lib/normalize-api-error";
import {
  ADMIN_SUGGESTIONS_QUERY_KEY,
  fetchAdminSuggestions,
} from "@/services/adminSuggestionsService";
import { ResourceSuggestionCard } from "../components/resource-suggestion-card";
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
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
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
      title: "Not implemented",
      description: "Auto-plan toggle is UI-only for now.",
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
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 flex-grow">
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 leading-tight">Total Requests</div>
              <div className="text-xl font-bold">{kpis.totalRequests}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 leading-tight">Suggested Resources</div>
              <div className="text-xl font-bold">{kpis.totalSuggestedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-blue-200 dark:border-blue-900">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 leading-tight">Pending Resources</div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{kpis.pendingResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-green-200 dark:border-green-900">
              <div className="text-xs text-green-600 dark:text-green-400 mb-1 leading-tight">Approved Resources</div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300">{kpis.approvedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center border border-red-200 dark:border-red-900">
              <div className="text-xs text-red-600 dark:text-red-400 mb-1 leading-tight">Rejected Resources</div>
              <div className="text-xl font-bold text-red-700 dark:text-red-300">{kpis.rejectedResources}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 leading-tight">Requests w/ Pending</div>
              <div className="text-xl font-bold">{kpis.requestsWithPending}</div>
            </Card>
            <Card className="p-3 bg-muted/30 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-1 leading-tight">Filtered Results</div>
              <div className="text-xl font-bold">{kpis.filteredResults}</div>
            </Card>
          </div>

          <Card className="p-3 w-full xl:w-auto shrink-0 flex flex-col justify-center gap-3 border-dashed bg-muted/10">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" /> Distribution Planning
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 border-r pr-3 mr-1">
                <Switch checked={isAutoPlan} onCheckedChange={handleAutoPlanToggle} id="auto-plan" />
                <Label htmlFor="auto-plan" className="text-xs cursor-pointer">Auto-plan</Label>
              </div>
              <Button disabled variant="secondary" size="sm" title="Backend not connected yet">
                <Play className="h-3 w-3 mr-1" /> Run Allocation
              </Button>
              <Button disabled variant="outline" size="sm" title="Backend not connected yet">
                <Download className="h-3 w-3 mr-1" /> Export Plan
              </Button>
            </div>
          </Card>
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

        <Collapsible
          open={isSnapshotOpen}
          onOpenChange={setIsSnapshotOpen}
          className="border rounded-xl px-4 py-3 bg-muted/5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Supply Snapshot</h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSnapshotOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-4 pb-2">
            <div className="text-sm text-muted-foreground mb-4">
              This is the current Available Resources in the Depot
            </div>
            <div className="border rounded-md overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Depot / Location</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty Available</TableHead>
                    <TableHead>Vehicles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Central Depot</TableCell>
                    <TableCell>Water Bottles</TableCell>
                    <TableCell className="text-right">10,000</TableCell>
                    <TableCell>2 Trucks</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">North Base</TableCell>
                    <TableCell>Blankets</TableCell>
                    <TableCell className="text-right">2,500</TableCell>
                    <TableCell>1 Van</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">South Hub</TableCell>
                    <TableCell>First Aid Kits</TableCell>
                    <TableCell className="text-right">500</TableCell>
                    <TableCell>3 Trucks</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>

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

      <Dialog open={!!selectedRequestId} onOpenChange={(open) => !open && setSelectedRequestId(null)}>
        {(() => {
          const selectedRequest = selectedRequestId ? requestById.get(selectedRequestId) : null;
          const selectedRows = selectedRequestId ? groupedResources.get(selectedRequestId) ?? [] : [];

          const selectedDisasterName = selectedRequest?.disasterId
            ? disasterNames.get(selectedRequest.disasterId) ?? selectedRequest.disasterId
            : "—";
          const selectedLocationText = selectedRequest?.location?.address
            ? selectedRequest.location.address
            : selectedRequest?.location?.lat && selectedRequest?.location?.lng
              ? `(${selectedRequest.location.lat.toFixed(4)}, ${selectedRequest.location.lng.toFixed(4)})`
              : "—";

          const selectedCounts = {
            pending: selectedRows.filter((r) => r.approvalStatus === "pending").length,
            approved: selectedRows.filter((r) => r.approvalStatus === "approved").length,
            rejected: selectedRows.filter((r) => r.approvalStatus === "rejected").length,
          };

          return (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedRequest?.title}</DialogTitle>
                <DialogDescription>
                  {selectedDisasterName} · {selectedLocationText}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 py-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCounts.pending}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Pending</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center border border-green-100 dark:border-green-900">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedCounts.approved}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Approved</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg text-center border border-red-100 dark:border-red-900">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedCounts.rejected}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Rejected</div>
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <h3 className="text-sm font-semibold border-b pb-2">Resource Details</h3>
                <div className="border rounded-md overflow-hidden bg-muted/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="w-[100px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.resourceName || row.name || "Unknown"}</TableCell>
                          <TableCell className="text-right">
                            {row.quantity} {row.unit}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                row.approvalStatus === "approved"
                                  ? "default"
                                  : row.approvalStatus === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {row.approvalStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            No resources found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </Card>
  );
}
