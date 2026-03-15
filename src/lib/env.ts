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

/**
 * Show a visible error page in the browser when env vars are misconfigured.
 * This prevents a blank white page and helps developers diagnose the issue.
 */
function showEnvError(formatted: string): void {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = "";
    const container = document.createElement("div");
    container.style.cssText =
      "max-width:600px;margin:80px auto;padding:32px;font-family:system-ui,sans-serif;color:#1a1a1a;background:#fff3f3;border:2px solid #dc2626;border-radius:12px;";
    container.innerHTML = `
      <h1 style="margin:0 0 16px;color:#dc2626;">⚠️ Configuration Error</h1>
      <p style="margin:0 0 12px;">Required environment variables are missing or invalid:</p>
      <pre style="background:#fef2f2;padding:16px;border-radius:8px;overflow-x:auto;font-size:14px;white-space:pre-wrap;">${formatted}</pre>
      <h3 style="margin:24px 0 8px;">How to fix:</h3>
      <ul style="padding-left:20px;line-height:1.8;">
        <li><strong>Local development:</strong> Copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase credentials.</li>
        <li><strong>DigitalOcean:</strong> Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> as <em>BUILD_TIME</em> secrets in the App Platform dashboard, then redeploy.</li>
        <li><strong>Docker:</strong> Pass <code>--build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...</code> when building.</li>
      </ul>
    `;
    root.appendChild(container);
  }
}

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

    // Show helpful error in browser instead of crashing with blank page
    if (typeof document !== "undefined") {
      // Wait for DOM to be ready, then show the error
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          showEnvError(formatted)
        );
      } else {
        showEnvError(formatted);
      }
    }

    throw new Error(
      `❌ Invalid environment variables:\n${formatted}\n\nCheck your .env file or hosting environment.`
    );
  }

  return result.data;
}

export const env = getEnv();
