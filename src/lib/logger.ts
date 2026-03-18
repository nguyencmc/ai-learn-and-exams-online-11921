import { captureException, captureMessage } from "@/lib/observability";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

/**
 * Centralized logging utility.
 *
 * In development, logs are written to the console.
 * In production, console output is suppressed (can be extended
 * to send logs to an external service like Sentry or LogRocket).
 */
const isDev = import.meta.env.DEV;

function formatEntry(entry: LogEntry): string {
  const prefix = entry.context ? `[${entry.context}]` : "";
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown
): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
}

function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  const entry = createEntry(level, message, context, data);

  if (level === "error") {
    const errorPayload = data instanceof Error ? data : new Error(message);
    captureException(errorPayload, {
      source: context,
      extra: { data },
    });
  }

  if (level === "warn") {
    captureMessage(message, "warning", {
      source: context,
      extra: { data },
    });
  }

  if (!isDev) {
    // In production, only surface errors and warnings to console.
    // Extend here to push entries to an external observability service.
    if (level === "error" || level === "warn") {
      console[level](formatEntry(entry), data ?? "");
    }
    return;
  }

  // Development: verbose output
  const formatted = formatEntry(entry);
  switch (level) {
    case "debug":
      console.debug(formatted, data ?? "");
      break;
    case "info":
      console.info(formatted, data ?? "");
      break;
    case "warn":
      console.warn(formatted, data ?? "");
      break;
    case "error":
      console.error(formatted, data ?? "");
      break;
  }
}

/**
 * Create a scoped logger for a specific module / feature.
 *
 * ```ts
 * const log = logger("AuthContext");
 * log.error("Sign-in failed", error);
 * ```
 */
export function logger(context: string) {
  return {
    debug: (message: string, data?: unknown) => log("debug", message, context, data),
    info: (message: string, data?: unknown) => log("info", message, context, data),
    warn: (message: string, data?: unknown) => log("warn", message, context, data),
    error: (message: string, data?: unknown) => log("error", message, context, data),
  };
}

export default logger;
