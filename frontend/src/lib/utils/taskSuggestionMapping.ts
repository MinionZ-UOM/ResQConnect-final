import type { Task, TaskPriority, TaskStatus, Requirements, RequirementResource } from '@/lib/types';
import type { Request } from '@/lib/types/request';
import type {
  ApprovalStatus,
  WorkflowOutput,
  WorkflowTask,
} from '@/lib/types/workflow';

const PRIORITY_MAP: Record<string, TaskPriority> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const STATUS_MAP: Record<ApprovalStatus, TaskStatus> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_REVERSE_MAP: Record<TaskStatus, ApprovalStatus | undefined> = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Assigned: undefined,
  'In Progress': undefined,
  Completed: undefined,
};

export const mapApprovalStatusToTaskStatus = (status: ApprovalStatus): TaskStatus =>
  STATUS_MAP[status] ?? 'Pending';

export const mapTaskStatusToApprovalStatus = (status: TaskStatus): ApprovalStatus | undefined =>
  STATUS_REVERSE_MAP[status];

export const mapPriorityToTaskPriority = (priority: string): TaskPriority =>
  PRIORITY_MAP[priority.toLowerCase()] ?? 'Medium';

export const mapTaskPriorityToApi = (priority: TaskPriority): string => priority.toLowerCase();

const buildRequirements = (
  output: WorkflowOutput,
  task: WorkflowTask
): Requirements | undefined => {
  const resourceRequirements: RequirementResource[] = [];

  for (const resource of output.resourceSuggestions) {
    const breakdownEntry = resource.breakdown.find((entry) => entry.taskId === task.id);
    if (!breakdownEntry) continue;

    resourceRequirements.push({
      resourceId: resource.id,
      type: resource.type,
      quantity: breakdownEntry.quantity,
      unit: resource.quantity ?? undefined,
    });
  }

  const manpowerEntry = output.manpower?.breakdown.find((entry) => entry.taskId === task.id);

  if (!resourceRequirements.length && !manpowerEntry) {
    return undefined;
  }

  return {
    manpower: manpowerEntry
      ? {
          total_volunteers: manpowerEntry.volunteers,
          notes: output.manpower?.notes ?? undefined,
        }
      : undefined,
    resources: resourceRequirements.length ? resourceRequirements : undefined,
  };
};

const normalizeLocation = (request: Request | undefined): Task['location'] => {
  const lat = request?.location?.lat ?? undefined;
  const lng = request?.location?.lng ?? undefined;
  const address = request?.location?.address ?? undefined;

  if (lat == null && lng == null && !address) {
    return undefined;
  }

  return {
    lat,
    lng,
    address,
  };
};

export const mapWorkflowTaskToTask = (
  workflowTask: WorkflowTask,
  output: WorkflowOutput,
  request: Request | undefined
): Task => ({
  id: workflowTask.id,
  requestId: output.requestId,
  description: workflowTask.step,
  priority: mapPriorityToTaskPriority(workflowTask.priority),
  status: mapApprovalStatusToTaskStatus(workflowTask.approvalStatus),
  disasterId: request?.disasterId,
  location: normalizeLocation(request),
  requirements: buildRequirements(output, workflowTask),
  createdAt: workflowTask.createdAt,
  updatedAt: workflowTask.updatedAt,
});

export const buildTaskSuggestions = (
  outputs: WorkflowOutput[],
  requests: Map<string, Request>
): Task[] => {
  const tasks: Task[] = [];

  for (const output of outputs) {
    const request = requests.get(output.requestId);
    for (const workflowTask of output.tasks) {
      tasks.push(mapWorkflowTaskToTask(workflowTask, output, request));
    }
  }

  return tasks;
};
