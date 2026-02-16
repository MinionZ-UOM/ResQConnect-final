'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApi';
import { getUser, updateUser, type UserUpdate } from '@/services/userService';

export const useUser = (id: string) =>
  useApiQuery(['user', id], () => getUser(id), {
    enabled: Boolean(id),
  });

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, payload }: { id: string; payload: UserUpdate }) => updateUser(id, payload),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['user', id] });
      },
    }
  );
};
