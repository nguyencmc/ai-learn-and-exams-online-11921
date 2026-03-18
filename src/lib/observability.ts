type Severity = "debug" | "info" | "warning" | "error" | "fatal";

interface EventContext {
  source?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

declare global {
  interface Window {
    Sentry?: {
      captureException?: (error: unknown, context?: unknown) => void;
      captureMessage?: (message: string, context?: unknown) => void;
      setTag?: (key: string, value: string) => void;
    };
  }
}

const isDev = import.meta.env.DEV;
const endpoint = import.meta.env.VITE_ERROR_LOG_ENDPOINT as string | undefined;

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function sendToEndpoint(payload: Record<string, unknown>): void {
  if (!endpoint || typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return;
  }

  const body = safeSerialize(payload);
  const blob = new Blob([body], { type: "application/json" });
  navigator.sendBeacon(endpoint, blob);
}

export function captureException(error: unknown, context?: EventContext): void {
  const errorObject = error instanceof Error ? error : new Error(String(error));

  window.Sentry?.captureException?.(errorObject, {
    tags: context?.tags,
    extra: context?.extra,
  });

  sendToEndpoint({
    type: "exception",
    message: errorObject.message,
    stack: errorObject.stack,
    source: context?.source,
    tags: context?.tags,
    extra: context?.extra,
    timestamp: new Date().toISOString(),
  });

  if (isDev) {
    console.error("[observability] exception", errorObject, context ?? "");
  }
}

export function captureMessage(message: string, level: Severity = "info", context?: EventContext): void {
  window.Sentry?.captureMessage?.(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });

  sendToEndpoint({
    type: "message",
    message,
    level,
    source: context?.source,
    tags: context?.tags,
    extra: context?.extra,
    timestamp: new Date().toISOString(),
  });

  if (isDev && (level === "warning" || level === "error" || level === "fatal")) {
    console.warn("[observability] message", level, message, context ?? "");
  }
}

export function initObservability(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    captureException(event.error ?? event.message, {
      source: "window.onerror",
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    captureException(event.reason, {
      source: "window.unhandledrejection",
    });
  });
}
