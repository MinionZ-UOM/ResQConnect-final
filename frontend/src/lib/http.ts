import type { AxiosRequestConfig } from 'axios';
import apiClient from '@/lib/apiClient';
import { normalizeApiError } from '@/lib/normalize-api-error';
import type { ApiError } from '@/lib/types';

export type ApiRequestConfig = AxiosRequestConfig;

export const apiRequest = async <T>(config: ApiRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const apiGet = async <T>(url: string, config?: ApiRequestConfig): Promise<T> =>
  apiRequest<T>({ ...config, method: 'GET', url });

export const apiPost = async <T>(
  url: string,
  data?: ApiRequestConfig['data'],
  config?: ApiRequestConfig
): Promise<T> =>
  apiRequest<T>({ ...config, method: 'POST', url, data });

export const apiPut = async <T>(
  url: string,
  data?: ApiRequestConfig['data'],
  config?: ApiRequestConfig
): Promise<T> =>
  apiRequest<T>({ ...config, method: 'PUT', url, data });

export const apiPatch = async <T>(
  url: string,
  data?: ApiRequestConfig['data'],
  config?: ApiRequestConfig
): Promise<T> =>
  apiRequest<T>({ ...config, method: 'PATCH', url, data });

export const apiDelete = async <T>(url: string, config?: ApiRequestConfig): Promise<T> =>
  apiRequest<T>({ ...config, method: 'DELETE', url });

export type ApiResponse<T> = T;
export type ApiErrorResponse = ApiError;
