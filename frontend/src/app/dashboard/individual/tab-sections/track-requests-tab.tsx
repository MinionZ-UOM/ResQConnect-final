"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter as FilterIcon, RotateCcw, X, Search } from "lucide-react";

import RequestCard from "../components/request-card";
import type { HelpRequest, TaskPriority, TaskStatus } from "@/lib/types";
import { getMockHelpRequests } from "@/lib/mock-data";

type Props = {
  requests?: HelpRequest[];
  onStatusChange?: (
    requestId: string,
    newStatus: TaskStatus
  ) => Promise<void> | void;
};

export default function TrackRequestTab({
  requests,
  onStatusChange,
}: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [priorityFilter, setPriorityFilter] = useState<
    "All" | TaskPriority
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | TaskStatus
  >("All");

  const [rows, setRows] = useState<HelpRequest[]>([]);

  useEffect(() => {
    setRows(requests ?? getMockHelpRequests());
  }, [requests]);

  const resetFilters = () => {
    setQuery("");
    setPriorityFilter("All");
    setStatusFilter("All");
  };

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.location?.address ?? "").toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === "All" || r.priority === priorityFilter;
      const matchesStatus =
        statusFilter === "All" || r.status === statusFilter;

      return matchesQuery && matchesPriority && matchesStatus;
    });
  }, [rows, deferredQuery, priorityFilter, statusFilter]);

  async function updateStatus(requestId: string, newStatus: TaskStatus) {
    const prev = rows;
    setRows((cur) =>
      cur.map((r) =>
        r.id === requestId ? { ...r, status: newStatus } : r
      )
    );
    try {
      await onStatusChange?.(requestId, newStatus);
    } catch {
      setRows(prev); 
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Track Requests</CardTitle>
            <CardDescription>
              Search, filter, and monitor the status of all help requests.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Filters */}
        <Card className="border">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <CardTitle className="text-lg font-semibold">
                  Filters
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
                aria-label="Reset filters"
              >
                <RotateCcw className="h-4 w-6" /> Reset
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label
                  className="text-lg font-semibold"
                  htmlFor="request-search"
                >
                  Search
                </Label>
                <div className="relative bg-background">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="request-search"
                    placeholder="Search by title or location…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pr-9 pl-9 h-12"
                    aria-label="Search requests"
                  />
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Priority</Label>
                <Select
                  value={priorityFilter}
                  onValueChange={(v) =>
                    setPriorityFilter(v as any)
                  }
                >
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

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as any)
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request cards */}
        <div className="grid gap-4 grid-cols-1">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No requests match your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
