import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/http';
import type {
  Request,
  RequestApiResponse,
  RequestCreatePayload,
  RequestStatusUpdatePayload,
} from '@/lib/types/request';
import { mapRequest } from '@/lib/utils/mapRequest';

export const MY_REQUESTS_QUERY_KEY = ['my-requests'] as const;

export const createRequest = async (payload: RequestCreatePayload): Promise<Request> => {
  const response = await apiPost<RequestApiResponse>('/requests', payload);
  return mapRequest(response);
};

export const getMyRequests = async (): Promise<Request[]> => {
  const response = await apiGet<RequestApiResponse[]>('/requests/me');
  return response.map(mapRequest);
};

export const getAllRequests = async (): Promise<Request[]> => {
  const response = await apiGet<RequestApiResponse[]>('/requests');
  return response.map(mapRequest);
};

export const getRequestById = async (requestId: string): Promise<Request> => {
  const response = await apiGet<RequestApiResponse>(`/requests/${requestId}`);
  return mapRequest(response);
};

export const updateRequestStatus = async (
  requestId: string,
  payload: RequestStatusUpdatePayload
): Promise<Request> => {
  const response = await apiPatch<RequestApiResponse>(`/requests/${requestId}/status`, payload);
  return mapRequest(response);
};

export const getRequestsByDisaster = async (disasterId: string): Promise<Request[]> => {
  const response = await apiGet<RequestApiResponse[]>(`/requests/disaster/${disasterId}`);
  return response.map(mapRequest);
};

export const deleteRequest = async (requestId: string): Promise<void> => {
  await apiDelete<void>(`/requests/${requestId}`);
};
