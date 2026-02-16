import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/http';
import type {
  WorkflowOutput,
  WorkflowOutputApiResponse,
  WorkflowOutputCreatePayload,
  WorkflowResource,
  WorkflowResourceApiResponse,
  WorkflowResourceCreatePayload,
  WorkflowResourceUpdatePayload,
  WorkflowTask,
  WorkflowTaskApiResponse,
  WorkflowTaskCreatePayload,
  WorkflowTaskUpdatePayload,
} from '@/lib/types/workflow';
import {
  mapWorkflowOutput,
  mapWorkflowResource,
  mapWorkflowTask,
} from '@/lib/utils/mapWorkflowOutput';

const WORKFLOW_OUTPUTS_BASE_URL = '/workflow-outputs';

export const upsertWorkflowOutput = async (
  payload: WorkflowOutputCreatePayload
): Promise<WorkflowOutput> => {
  const response = await apiPost<WorkflowOutputApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/`,
    payload
  );
  return mapWorkflowOutput(response);
};

export const listWorkflowOutputs = async (): Promise<WorkflowOutput[]> => {
  const response = await apiGet<WorkflowOutputApiResponse[]>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/`
  );
  return response.map(mapWorkflowOutput);
};

export const getWorkflowOutput = async (
  requestId: string
): Promise<WorkflowOutput> => {
  const response = await apiGet<WorkflowOutputApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}`
  );
  return mapWorkflowOutput(response);
};

export const deleteWorkflowOutput = async (requestId: string): Promise<void> => {
  await apiDelete(`${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}`);
};

export const listWorkflowResources = async (
  requestId: string
): Promise<WorkflowResource[]> => {
  const response = await apiGet<WorkflowResourceApiResponse[]>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/resources`
  );
  return response.map(mapWorkflowResource);
};

export const createWorkflowResource = async (
  requestId: string,
  payload: WorkflowResourceCreatePayload
): Promise<WorkflowResource> => {
  const response = await apiPost<WorkflowResourceApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/resources`,
    payload
  );
  return mapWorkflowResource(response);
};

export const updateWorkflowResource = async (
  requestId: string,
  resourceId: string,
  payload: WorkflowResourceUpdatePayload
): Promise<WorkflowResource> => {
  const response = await apiPatch<WorkflowResourceApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/resources/${resourceId}`,
    payload
  );
  return mapWorkflowResource(response);
};

export const deleteWorkflowResource = async (
  requestId: string,
  resourceId: string
): Promise<void> => {
  await apiDelete(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/resources/${resourceId}`
  );
};

export const listWorkflowTasks = async (
  requestId: string
): Promise<WorkflowTask[]> => {
  const response = await apiGet<WorkflowTaskApiResponse[]>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/tasks`
  );
  return response.map(mapWorkflowTask);
};

export const createWorkflowTask = async (
  requestId: string,
  payload: WorkflowTaskCreatePayload
): Promise<WorkflowTask> => {
  const response = await apiPost<WorkflowTaskApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/tasks`,
    payload
  );
  return mapWorkflowTask(response);
};

export const updateWorkflowTask = async (
  requestId: string,
  taskId: string,
  payload: WorkflowTaskUpdatePayload
): Promise<WorkflowTask> => {
  const response = await apiPatch<WorkflowTaskApiResponse>(
    `${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/tasks/${taskId}`,
    payload
  );
  return mapWorkflowTask(response);
};

export const deleteWorkflowTask = async (
  requestId: string,
  taskId: string
): Promise<void> => {
  await apiDelete(`${WORKFLOW_OUTPUTS_BASE_URL}/${requestId}/tasks/${taskId}`);
};
