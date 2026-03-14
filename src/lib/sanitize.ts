import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe HTML tags for rich content rendering (headings, lists, images, code, etc.)
 * while stripping dangerous elements like scripts, iframes, and event handlers.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "loading", "decoding"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

/**
 * Safely strip all HTML tags and return plain text.
 * Sanitizes the input first to prevent XSS via innerHTML parsing.
 */
export function stripHtml(dirty: string): string {
  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  const tmp = document.createElement("div");
  tmp.innerHTML = sanitized;
  return tmp.textContent || tmp.innerText || "";
}
