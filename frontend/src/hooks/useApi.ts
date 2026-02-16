'use client';

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from '@tanstack/react-query';
import type { ApiError } from '@/lib/types';

export const useApiQuery = <TData, TQueryKey extends QueryKey>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, ApiError> =>
  useQuery({
    queryKey,
    queryFn,
    ...options,
  });

export const useApiMutation = <TData, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables, TContext>
): UseMutationResult<TData, ApiError, TVariables, TContext> =>
  useMutation({
    mutationFn,
    ...options,
  });
