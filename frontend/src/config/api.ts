import { z } from 'zod';

const apiConfigSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url({ message: 'NEXT_PUBLIC_API_URL must be a valid URL' }),
  NEXT_PUBLIC_API_TIMEOUT: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .optional(),
});

const parsedConfig = apiConfigSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
});

if (!parsedConfig.success) {
  console.error('Invalid API configuration', parsedConfig.error.flatten().fieldErrors);
  throw new Error(
    `Failed to load API configuration: ${JSON.stringify(parsedConfig.error.flatten().fieldErrors)}`
  );
}

const { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_TIMEOUT } = parsedConfig.data;

export const API_CONFIG = {
  baseUrl: NEXT_PUBLIC_API_URL,
  timeout: NEXT_PUBLIC_API_TIMEOUT ?? 10000,
} as const;

export type ApiConfig = typeof API_CONFIG;
