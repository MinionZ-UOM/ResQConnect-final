import type {
  ManpowerBreakdownApiResponse,
  ManpowerBreakdown,
  ResourceQuantityBreakdownApiResponse,
  ResourceQuantityBreakdown,
  WorkflowManpowerApiResponse,
  WorkflowManpower,
  WorkflowOutputApiResponse,
  WorkflowOutput,
  WorkflowResourceApiResponse,
  WorkflowResource,
  WorkflowTaskApiResponse,
  WorkflowTask,
} from '@/lib/types/workflow';

const mapManpowerBreakdown = (
  breakdown: ManpowerBreakdownApiResponse
): ManpowerBreakdown => ({
  taskId: breakdown.task_id,
  volunteers: breakdown.volunteers,
});

const mapResourceBreakdown = (
  breakdown: ResourceQuantityBreakdownApiResponse
): ResourceQuantityBreakdown => ({
  taskId: breakdown.task_id,
  quantity: breakdown.quantity,
});

export const mapWorkflowTask = (task: WorkflowTaskApiResponse): WorkflowTask => ({
  id: task.id,
  step: task.step,
  priority: task.priority,
  approvalStatus: task.approval_status,
  createdAt: task.created_at ?? undefined,
  updatedAt: task.updated_at ?? undefined,
});

export const mapWorkflowResource = (
  resource: WorkflowResourceApiResponse
): WorkflowResource => ({
  id: resource.id ?? resource.resource_id ?? "",
  type: resource.type,
  totalQuantity: resource.total_quantity,
  breakdown: (resource.breakdown ?? []).map(mapResourceBreakdown),
  substitutionFor: resource.substitution_for ?? undefined,
  quantity: resource.quantity ?? undefined,
  approvalStatus: resource.approval_status,
  createdAt: resource.created_at ?? undefined,
  updatedAt: resource.updated_at ?? undefined,
});

export const mapWorkflowManpower = (
  manpower: WorkflowManpowerApiResponse
): WorkflowManpower => ({
  totalVolunteers: manpower.total_volunteers ?? undefined,
  breakdown: (manpower.breakdown ?? []).map(mapManpowerBreakdown),
  notes: manpower.notes ?? undefined,
});

export const mapWorkflowOutput = (
  output: WorkflowOutputApiResponse
): WorkflowOutput => ({
  workflowId: output.workflow_run_id,
  requestId: output.request_id,
  tasks: (output.tasks ?? []).map(mapWorkflowTask),
  resourceSuggestions: (output.resource_suggestions ?? []).map(mapWorkflowResource),
  manpower: output.manpower ? mapWorkflowManpower(output.manpower) : undefined,
  createdAt: output.created_at ?? undefined,
  updatedAt: output.updated_at ?? undefined,
});
