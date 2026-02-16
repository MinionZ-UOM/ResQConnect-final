import { getAllRequests } from '@/services/requestService';
import { listWorkflowOutputs } from '@/services/workflowOutputService';
import type { Request } from '@/lib/types/request';
import type { WorkflowOutput } from '@/lib/types/workflow';

export type AdminSuggestionsData = {
  outputs: WorkflowOutput[];
  requests: Request[];
};

export const ADMIN_SUGGESTIONS_QUERY_KEY = ['admin-suggestions'] as const;

export const fetchAdminSuggestions = async (): Promise<AdminSuggestionsData> => {
  const [outputs, requests] = await Promise.all([
    listWorkflowOutputs(),
    getAllRequests(),
  ]);

  return { outputs, requests };
};
