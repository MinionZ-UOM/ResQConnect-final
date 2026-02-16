export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type WorkflowTaskApiResponse = {
  id: string;
  step: string;
  priority: string;
  approval_status: ApprovalStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowTask = {
  id: string;
  step: string;
  priority: string;
  approvalStatus: ApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowTaskCreatePayload = {
  id: string;
  step: string;
  priority: string;
  approval_status?: ApprovalStatus;
};

export type WorkflowTaskUpdatePayload = {
  step?: string;
  priority?: string;
  approval_status?: ApprovalStatus;
};

export type ResourceQuantityBreakdownApiResponse = {
  task_id: string;
  quantity: number;
};

export type ResourceQuantityBreakdown = {
  taskId: string;
  quantity: number;
};

export type WorkflowResourceApiResponse = {
  id?: string;
  resource_id?: string;
  type: string;
  total_quantity: number;
  breakdown?: ResourceQuantityBreakdownApiResponse[] | null;
  substitution_for?: string | null;
  quantity?: string | null;
  approval_status: ApprovalStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowResource = {
  id: string;
  type: string;
  totalQuantity: number;
  breakdown: ResourceQuantityBreakdown[];
  substitutionFor?: string;
  quantity?: string;
  approvalStatus: ApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowResourceCreatePayload = {
  id?: string;
  type: string;
  total_quantity: number;
  breakdown?: ResourceQuantityBreakdownApiResponse[];
  substitution_for?: string | null;
  quantity?: string | null;
  approval_status?: ApprovalStatus;
};

export type WorkflowResourceUpdatePayload = {
  type?: string;
  total_quantity?: number;
  breakdown?: ResourceQuantityBreakdownApiResponse[];
  substitution_for?: string | null;
  quantity?: string | null;
  approval_status?: ApprovalStatus;
};

export type ManpowerBreakdownApiResponse = {
  task_id: string;
  volunteers: number;
};

export type ManpowerBreakdown = {
  taskId: string;
  volunteers: number;
};

export type WorkflowManpowerApiResponse = {
  total_volunteers?: number | null;
  breakdown?: ManpowerBreakdownApiResponse[] | null;
  notes?: string | null;
};

export type WorkflowManpower = {
  totalVolunteers?: number;
  breakdown: ManpowerBreakdown[];
  notes?: string;
};

export type WorkflowOutputApiResponse = {
  workflow_run_id: string;
  request_id: string;
  tasks?: WorkflowTaskApiResponse[] | null;
  resource_suggestions?: WorkflowResourceApiResponse[] | null;
  manpower?: WorkflowManpowerApiResponse | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowOutput = {
  workflowId: string;
  requestId: string;
  tasks: WorkflowTask[];
  resourceSuggestions: WorkflowResource[];
  manpower?: WorkflowManpower;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowOutputCreatePayload = {
  workflow_run_id: string;
  request_id: string;
  tasks?: WorkflowTaskCreatePayload[];
  resource_suggestions?: WorkflowResourceCreatePayload[];
  manpower?: WorkflowManpowerApiResponse;
};
