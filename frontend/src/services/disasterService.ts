import { apiGet, apiPost, apiDelete } from '@/lib/http';
import type { Disaster, DisasterApiResponse, JoinedResponse } from '@/lib/types/disaster';
import { mapDisaster } from '@/lib/utils/mapDisaster';

// Get all disasters
export const getDisasters = async (): Promise<Disaster[]> => {
  const response = await apiGet<DisasterApiResponse[] | DisasterApiResponse>('/disasters');
  const disasters = Array.isArray(response) ? response : [response];
  return disasters.map(mapDisaster);
};

// Get a specific disaster by ID
export const getDisasterById = async (id: string): Promise<Disaster> => {
  const response = await apiGet<DisasterApiResponse>(`/disasters/${id}`);
  return mapDisaster(response);
};

// Delete a disaster (admin only)
export const deleteDisaster = async (id: string): Promise<void> => {
  await apiDelete(`/disasters/${id}`);
};

// Join a disaster
export const joinDisaster = async (
  id: string,
  role: 'volunteer' | 'first_responder' | 'affected_individual'
): Promise<Disaster> => {
  const response = await apiPost<DisasterApiResponse>(`/disasters/${id}/join`, { role });
  return mapDisaster(response);
};

// Leave a disaster
export const leaveDisaster = async (id: string): Promise<Disaster> => {
  const response = await apiDelete<DisasterApiResponse>(`/disasters/${id}/leave`);
  return mapDisaster(response);
};

// Check if the current user has joined a disaster
export const checkJoinedStatus = async (id: string): Promise<JoinedResponse> => {
  return await apiGet<JoinedResponse>(`/disasters/${id}/joined`);
};