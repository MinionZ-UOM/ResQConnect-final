"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter as FilterIcon, RotateCcw } from "lucide-react";

import TaskCard from "../../components/task-card";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { getMockVolunteerTasks, mockDisasters } from "@/lib/mock-data";

type Props = {
  tasks?: Task[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => Promise<void> | void;
  onAvailabilityChange?: (available: boolean) => Promise<void> | void;
};

export default function MyTasksTab({ tasks, onStatusChange, onAvailabilityChange }: Props) {
  const [available, setAvailable] = useState(true);

  const [disasterFilter, setDisasterFilter] = useState<"All" | string>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TaskPriority>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | TaskStatus>("All");

  const [rows, setRows] = useState<Task[]>([]); // local (optimistic)

  useEffect(() => {
    setRows(tasks ?? getMockVolunteerTasks());
  }, [tasks]);

  const resetFilters = () => {
    setDisasterFilter("All");
    setPriorityFilter("All");
    setStatusFilter("All");
  };

  const filtered = useMemo(() => {
    return rows.filter((t) => {
      const allowedStatuses: TaskStatus[] = ["Assigned", "In Progress", "Completed"];
      if (!allowedStatuses.includes(t.status)) return false;

      const matchesDisaster = disasterFilter === "All" || t.disasterId === disasterFilter;
      const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;

      return matchesDisaster && matchesPriority && matchesStatus;
    });
  }, [rows, disasterFilter, priorityFilter, statusFilter]);

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    const prev = rows;
    setRows((cur) => cur.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await onStatusChange?.(taskId, newStatus);
    } catch {
      setRows(prev); // revert on failure
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Search, filter, and update the status of your assigned tasks.</CardDescription>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                available
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-slate-500/10 text-slate-700 border-slate-500/30"
              }
              aria-label={available ? "Available" : "Unavailable"}
            >
              {available ? "Available for new tasks" : "Unavailable"}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Availability</span>
              <Switch
                checked={available}
                onCheckedChange={async (v) => {
                  setAvailable(v);
                  await onAvailabilityChange?.(v);
                }}
                aria-label="Toggle availability"
              />
            </div>
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
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2" aria-label="Reset filters">
                <RotateCcw className="h-4 w-6" /> Reset
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Disaster */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Disaster</Label>
                <Select value={disasterFilter} onValueChange={setDisasterFilter}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {mockDisasters.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Priority</Label>
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
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
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task cards (cards-only UI) */}
        <div className="grid gap-4 grid-cols-1">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} footer={<VolunteerFooter task={t} onUpdateStatus={updateStatus} />} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No tasks match your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VolunteerFooter({ task, onUpdateStatus }: {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() => task.status !== "In Progress" && onUpdateStatus(task.id, "In Progress")}
        disabled={task.status === "In Progress"}
      >
        Mark In Progress
      </Button>
      <Button
        onClick={() => task.status !== "Completed" && onUpdateStatus(task.id, "Completed")}
        disabled={task.status === "Completed"}
      >
        Mark Completed
      </Button>
    </div>
  );
}
