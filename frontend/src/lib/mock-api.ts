// mock-api.ts
import { mockVolunteers, mockVolunteerTasks } from "./mock-data";
import type { User, Task } from "./types";

// ✅ Fetch all volunteer tasks
export function fetchTasks(): Task[] {
  // return a copy so UI updates don’t mutate source directly
  return mockVolunteerTasks.map(t => ({
    ...t,
    location: { ...t.location },
    assignedTo: t.assignedTo ? { ...t.assignedTo } : undefined,
  }));
}

// ✅ Fetch all volunteers
export function getVolunteers(): User[] {
  return mockVolunteers.map(v => ({ ...v }));
}

// ✅ (Alias, if other code still calls fetchVolunteers)
export const fetchVolunteers = getVolunteers;

// ✅ Assign a task to the selected volunteer
export function assignTask(taskId: string, volunteerId: string): Task | undefined {
  const task = mockVolunteerTasks.find(t => t.id === taskId);
  const volunteer = mockVolunteers.find(v => v.id === volunteerId);

  if (task && volunteer) {
    task.status = "Assigned";
    task.assignedTo = { ...volunteer }; // assign the selected volunteer
  }

  return task;
}