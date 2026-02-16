import { apiGet, apiPost } from '@/lib/http';
import type { User, UserCreate, DisplayNameResponse } from '@/lib/types';

// Register a new user or return existing user profile
export const registerUser = async (userData: UserCreate): Promise<User> => {
  return await apiPost<User>('/users/register', userData);
};

// Get the currently authenticated user's profile
export const getCurrentUser = async (): Promise<User> => {
  return await apiGet<User>('/users/me');
};

export const getUserDisplayName = async (uid: string): Promise<string> => {
  const response = await apiGet<DisplayNameResponse>(`/users/${uid}/display_name`);
  return response.display_name;
};
