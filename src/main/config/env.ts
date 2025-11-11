import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Firebase Admin
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(20),
  FIREBASE_STORAGE_BUCKET: z.string().min(3).optional(),

  // JWT
  JWT_SECRET: z.string().min(10),

  // Optional Firebase client vars (not required on backend)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  REFRESH_TOKEN_TTL_DAYS: z.string().optional(),
});

let cached: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const missing = Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.some((msg) => msg.toLowerCase().includes('required')))
      .map(([key]) => key)
      .join(', ');
    throw new Error(
      `Environment validation failed. Missing or invalid variables: ${missing || 'see details'}\n` +
        JSON.stringify(parsed.error.format(), null, 2),
    );
  }
  cached = parsed.data;
  return cached;
}
