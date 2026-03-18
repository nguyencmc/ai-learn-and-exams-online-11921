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
  VITE_ERROR_LOG_ENDPOINT: z.string().url("VITE_ERROR_LOG_ENDPOINT must be a valid URL").optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Show a visible error page in the browser when env vars are misconfigured.
 * This prevents a blank white page and helps developers diagnose the issue.
 */
function showEnvError(formatted: string): void {
  const root = document.getElementById("root") ?? document.body;

  // Clear any existing content
  if (root.id === "root") {
    root.innerHTML = "";
  }

  const container = document.createElement("div");
  Object.assign(container.style, {
    maxWidth: "600px",
    margin: "80px auto",
    padding: "32px",
    fontFamily: "system-ui, sans-serif",
    color: "#1a1a1a",
    background: "#fff3f3",
    border: "2px solid #dc2626",
    borderRadius: "12px",
  });

  const heading = document.createElement("h1");
  Object.assign(heading.style, { margin: "0 0 16px", color: "#dc2626" });
  heading.textContent = "⚠️ Configuration Error";

  const desc = document.createElement("p");
  desc.style.margin = "0 0 12px";
  desc.textContent =
    "Required environment variables are missing or invalid:";

  const pre = document.createElement("pre");
  Object.assign(pre.style, {
    background: "#fef2f2",
    padding: "16px",
    borderRadius: "8px",
    overflowX: "auto",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
  });
  pre.textContent = formatted;

  const howToFix = document.createElement("h3");
  howToFix.style.margin = "24px 0 8px";
  howToFix.textContent = "How to fix:";

  const list = document.createElement("ul");
  Object.assign(list.style, { paddingLeft: "20px", lineHeight: "1.8" });
  const steps = [
    "Local development: Copy .env.example to .env and fill in your Supabase credentials.",
    "DigitalOcean: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as BUILD_TIME secrets in the App Platform dashboard, then redeploy.",
    "Docker: Pass --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... when building.",
  ];
  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    list.appendChild(li);
  }

  container.append(heading, desc, pre, howToFix, list);
  root.appendChild(container);
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
