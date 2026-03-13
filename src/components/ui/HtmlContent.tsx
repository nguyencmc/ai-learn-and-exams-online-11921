import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface HtmlContentProps {
  html: string | null | undefined;
  className?: string;
  onClickImage?: (src: string) => void;
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// Placeholder SVG khi ảnh lỗi
const ERROR_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'%3EKhông tải được ảnh%3C/text%3E%3C/svg%3E`;

/**
 * Append Supabase image transform params nếu URL là Supabase Storage.
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 * NOTE: Image Transform chỉ có trên Pro plan. Với free plan sẽ trả 400/404.
 * → Dùng onerror fallback về URL gốc trong optimizeImages().
 */
function getOptimizedImageUrl(src: string, width = 1200): string {
  if (!src || src.startsWith("data:")) return src;
  try {
    const url = new URL(src);
    // Supabase Storage URL pattern: .../storage/v1/object/public/...
    if (url.pathname.includes("/storage/v1/object/public/")) {
      // Dùng render endpoint thay vì object endpoint
      const renderUrl = src.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      const u = new URL(renderUrl);
      if (!u.searchParams.has("width")) u.searchParams.set("width", String(width));
      if (!u.searchParams.has("quality")) u.searchParams.set("quality", "80");
      return u.toString();
    }
  } catch {
    // không phải URL hợp lệ — trả nguyên
  }
  return src;
}

function injectCopyButtons(container: HTMLElement) {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".hc-copy-btn")) return;
    (pre as HTMLElement).style.position = "relative";
    const btn = document.createElement("button");
    btn.className = "hc-copy-btn";
    btn.type = "button";
    btn.title = "Copy code";
    btn.innerHTML = COPY_ICON;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const code = pre.querySelector("code")?.innerText ?? (pre as HTMLElement).innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = CHECK_ICON;
        btn.classList.add("hc-copy-btn--copied");
        setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove("hc-copy-btn--copied");
        }, 1500);
      });
    });
    pre.appendChild(btn);
  });
}

/** Inject lazy loading, decoding, onerror và Supabase transform vào tất cả <img> */
function optimizeImages(container: HTMLElement, onClickImage?: (src: string) => void) {
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    // Lazy load
    if (!img.hasAttribute("loading")) img.loading = "lazy";
    // Async decoding — không block main thread
    if (!img.hasAttribute("decoding")) img.decoding = "async";

    // Click to zoom
    if (onClickImage && !img.dataset.zoomAttached) {
      img.dataset.zoomAttached = "1";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        // Lấy src gốc (trước khi transform) nếu có, ưu tiên naturalSrc
        const src = img.dataset.originalSrc || img.src;
        if (src && !src.startsWith("data:")) onClickImage(src);
      });
    }

    if (!img.dataset.errorHandled) {
      img.dataset.errorHandled = "1";
      const originalSrc = img.src;
      // Lưu lại src gốc để click zoom dùng
      img.dataset.originalSrc = originalSrc;

      // Supabase image transform (chỉ áp dụng nếu chưa có render URL)
      const optimized = getOptimizedImageUrl(img.src);
      if (optimized !== img.src) img.src = optimized;

      img.addEventListener("error", () => {
        if (img.src !== originalSrc && originalSrc) {
          // Lần 1: transform thất bại → fallback về URL gốc
          img.src = originalSrc;
        } else {
          // Lần 2: URL gốc cũng lỗi → hiện placeholder
          img.src = ERROR_PLACEHOLDER;
          img.alt = "Không tải được ảnh";
          img.style.opacity = "0.6";
        }
      });
    }
  });
}

/**
 * Renders HTML content safely with proper image, prose, and code block styling.
 * - Code blocks: dark theme + copy button
 * - Images: lazy load, decoding async, error fallback, Supabase transform
 */
export const HtmlContent = ({ html, className, onClickImage }: HtmlContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    injectCopyButtons(ref.current);
    optimizeImages(ref.current, onClickImage);
  }, [html, onClickImage]);

  if (!html) return null;

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md",
          "[&_a]:text-primary [&_a]:underline",
          "[&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1",
          "[&_pre]:bg-[#1e1e2e] [&_pre]:text-[#cdd6f4] [&_pre]:p-4 [&_pre]:pt-8 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:relative",
          "[&_code]:bg-transparent [&_code]:text-inherit [&_code]:p-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
      <style>{`
        /* ── Copy button ── */
        .hc-copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(205,214,244,0.2);
          background: rgba(205,214,244,0.08);
          color: #a6adc8;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          z-index: 10;
        }
        .hc-copy-btn:hover {
          background: rgba(205,214,244,0.18);
          color: #cdd6f4;
          border-color: rgba(205,214,244,0.4);
        }
        .hc-copy-btn--copied {
          background: rgba(166,227,161,0.18) !important;
          color: #a6e3a1 !important;
          border-color: rgba(166,227,161,0.4) !important;
        }
      `}</style>
    </>
  );
};

export default HtmlContent;
