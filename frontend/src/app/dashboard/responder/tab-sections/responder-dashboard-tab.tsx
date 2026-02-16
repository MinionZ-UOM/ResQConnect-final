"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, assignTask, getVolunteers } from "@/lib/mock-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardCheck, ClipboardList, UserPlus } from "lucide-react";
import TaskCard from "../../components/task-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatCard from "../../components/stat-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { useState } from "react";

export default function ResponderDashboardTab() {
  const queryClient = useQueryClient();

  // queries
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
  const { data: volunteers = [] } = useQuery({ queryKey: ["volunteers"], queryFn: getVolunteers });

  // mutation
  const assignMutation = useMutation({
    mutationFn: ({ taskId, volunteerId }: { taskId: string; volunteerId: string }) =>
      assignTask(taskId, volunteerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // refresh list
    },
  });

  const approvedTasks = tasks.filter((t) => t.status === "Approved");
  const assignedTasks = tasks.filter((t) => t.status === "Assigned");

  const stats = {
    approved: approvedTasks.length,
    assigned: assignedTasks.length,
    activeVols: new Set(
      assignedTasks
        .filter((t) => t.status !== "Completed" && t.status !== "Rejected")
        .map((t) => t.assignedTo?.id)
        .filter(Boolean)
    ).size,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>First Responder Dashboard</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Approved Tasks" value={stats.approved} description="Tasks pending assignment" icon={ClipboardList} />
          <StatCard title="Assigned Tasks" value={stats.assigned} description="Tasks currently assigned to volunteers" icon={ClipboardCheck} />
          <StatCard title="Active Volunteers" value={stats.activeVols} description="Volunteers with assigned tasks" icon={Users} />
        </div>
      </CardContent>

      <CardHeader>
        <CardTitle>Task Board</CardTitle>
        <CardDescription>Change status or assign volunteers directly</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approved column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Approved (Unassigned)</CardTitle>
              <CardDescription>Tasks ready to assign to a volunteer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvedTasks.length === 0 && (
                <div className="text-sm text-muted-foreground py-10 text-center">No approved tasks pending assignment.</div>
              )}
              <div className="grid gap-4">
              {approvedTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  variant="responder"
                  footer={
                    <AssignFooter
                      volunteers={volunteers}
                      onAssign={(volId) => assignMutation.mutate({ taskId: t.id, volunteerId: volId })}
                    />
                  }
                />
              ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Assigned</CardTitle>
              <CardDescription>Tasks currently in progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedTasks.length === 0 && (
                <div className="text-sm text-muted-foreground py-10 text-center">No tasks assigned yet.</div>
              )}
              <div className="grid gap-4">
              {assignedTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  variant="responder"
                  footer={
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={t.assignedTo?.avatar} />
                        <AvatarFallback>{t.assignedTo?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{t.assignedTo?.name}</span>
                    </div>
                  }
                />
              ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignFooter({ volunteers, onAssign }: { volunteers: User[]; onAssign: (volunteerId: string) => void }) {
  const [selected, setSelected] = useState<string>("");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
      <div className="space-y-1">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger id="assign-vol" className="h-10 w-full">
            <SelectValue placeholder="Assign a volunteer" />
          </SelectTrigger>
          <SelectContent>
            {volunteers.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button className="w-full sm:w-auto" disabled={!selected} onClick={() => selected && onAssign(selected)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign
        </Button>
      </div>
    </div>
  );
}