import { z } from "zod";

const schema = z.object({
  MY_VAR: z.string(),
  ENVIRONMENT: z.enum(["production", "development", "preview"] as const),
  SUPABASE_URI: z.string(),
  HONEYPOT_SECRET: z.string(),
  SESSION_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  MOCKS: z.string().transform((value) => value === "true"),
});

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv(env: Env) {
  const { MY_VAR } = schema.parse(env);
  return { MY_VAR };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  const ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
