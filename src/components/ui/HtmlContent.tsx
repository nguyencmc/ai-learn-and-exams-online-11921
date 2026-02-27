import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html: string | null | undefined;
  className?: string;
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

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

/**
 * Renders HTML content safely with proper image, prose, and code block styling.
 * Code blocks get a dark theme with a copy button.
 */
export const HtmlContent = ({ html, className }: HtmlContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) injectCopyButtons(ref.current);
  }, [html]);

  if (!html) return null;

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2",
          "[&_a]:text-primary [&_a]:underline",
          "[&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1",
          "[&_pre]:bg-[#1e1e2e] [&_pre]:text-[#cdd6f4] [&_pre]:p-4 [&_pre]:pt-8 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:relative",
          "[&_code]:bg-transparent [&_code]:text-inherit [&_code]:p-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
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
