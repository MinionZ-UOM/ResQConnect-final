import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/types';

const defaultError: ApiError = {
  message: 'Something went wrong. Please try again.',
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('API request failed', error);
  }

  if (!error) {
    return defaultError;
  }

  const axiosError = error as AxiosError<{ message?: string; detail?: string } | undefined>;
  if (axiosError?.isAxiosError) {
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;
    const message = responseData?.message || responseData?.detail || axiosError.message;

    return {
      message,
      status,
      data: responseData,
    } satisfies ApiError;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    } satisfies ApiError;
  }

  return defaultError;
};
