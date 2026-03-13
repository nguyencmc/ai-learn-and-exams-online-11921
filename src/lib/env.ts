import { z } from "zod";

/**
 * Runtime validation for environment variables.
 *
 * Vite exposes env vars via `import.meta.env`.  This schema ensures the
 * required values are present and well-formed before the app boots,
 * providing a clear error message instead of silent undefined behaviour.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string({ required_error: "VITE_SUPABASE_URL is required" })
    .url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z
    .string({ required_error: "VITE_SUPABASE_ANON_KEY is required" })
    .min(1, "VITE_SUPABASE_ANON_KEY must not be empty"),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  // Vite exposes env vars both as VITE_* and sometimes with different key names.
  // Handle the alias VITE_SUPABASE_PUBLISHABLE_KEY → VITE_SUPABASE_ANON_KEY.
  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    VITE_SUPABASE_ANON_KEY:
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined),
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    throw new Error(
      `❌ Invalid environment variables:\n${formatted}\n\nCheck your .env file or hosting environment.`
    );
  }

  return result.data;
}

export const env = getEnv();
