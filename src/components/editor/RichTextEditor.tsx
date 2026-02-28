import React, { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Unlink,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
  Subscript,
  Superscript,
  Highlighter,
  Palette,
  Upload,
  Loader2,
  X,
  ImagePlus,
  GalleryHorizontalEnd,
} from "lucide-react";
import { ImageLibraryPicker } from "./ImageLibraryPicker";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  content?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
  /** Supabase Storage bucket name để hiển thị thư viện ảnh đã upload.
   *  Ví dụ: "question-images" | "public-assets"
   *  Nếu không truyền, tab Thư viện sẽ bị ẩn. */
  imageBucket?: string;
  /** Prefix (thư mục con) trong bucket cần list, mặc định "" (root) */
  imageBucketPrefix?: string;
}

const FONT_SIZES = [
  { value: "1", label: "10px" },
  { value: "2", label: "13px" },
  { value: "3", label: "16px" },
  { value: "4", label: "18px" },
  { value: "5", label: "24px" },
  { value: "6", label: "32px" },
  { value: "7", label: "48px" },
];

const HEADING_OPTIONS = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
];

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000", "#0000ff", "#ff9900", "#9900ff",
];

const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
  }
>(({ icon, tooltip, onClick, active, disabled }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0",
          active && "bg-accent text-accent-foreground"
        )}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
));
ToolbarButton.displayName = "ToolbarButton";

// ─── Image resize helper ────────────────────────────────────────────────────
// GIF và WEBP động không resize qua Canvas (sẽ mất animation)
const PASSTHROUGH_TYPES = ["image/gif", "image/webp", "image/svg+xml"];

const resizeImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string; originalSize: number }> =>
  new Promise((resolve, reject) => {
    const originalSize = file.size;

    // GIF/WEBP/SVG: trả thẳng blob gốc, không resize
    if (PASSTHROUGH_TYPES.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({ blob: file, dataUrl: e.target!.result as string, originalSize });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({ blob, dataUrl: e.target!.result as string, originalSize });
          reader.readAsDataURL(blob);
        },
        file.type === "image/png" ? "image/png" : "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
// ────────────────────────────────────────────────────────────────────────────

export const RichTextEditor = ({
  content,
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  minHeight = "300px",
  onImageUpload,
  imageBucket,
  imageBucketPrefix = "",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadDimensions, setUploadDimensions] = useState<{ w: number; h: number } | null>(null);
  const [uploadOriginalSize, setUploadOriginalSize] = useState<number | null>(null);
  // Track whether the last change came from user typing (not external prop update)
  const isInternalChange = useRef(false);
  // ── Lưu selection trước khi Popover mở (focus sẽ bị mất khi click toolbar) ──
  const savedRangeRef = useRef<Range | null>(null);

  const htmlValue = content ?? value ?? "";

  // ── Inject copy buttons into every <pre> block inside the editor ──────────
  const injectCopyButtons = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".rte-copy-btn")) return; // already injected
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.className = "rte-copy-btn";
      btn.type = "button";
      btn.title = "Copy code";
      btn.setAttribute("contenteditable", "false");
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Get text excluding the button itself
        const clone = pre.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".rte-copy-btn").forEach(b => b.remove());
        const code = clone.querySelector("code")?.innerText ?? clone.innerText;
        navigator.clipboard.writeText(code).then(() => {
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.classList.add("rte-copy-btn--copied");
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
            btn.classList.remove("rte-copy-btn--copied");
          }, 1500);
        });
      });
      pre.appendChild(btn);
    });
  }, []);

  // ── Get clean HTML without injected copy buttons (for saving) ────────────
  const getCleanHtml = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return "";
    // Clone DOM, strip all copy buttons, return clean HTML
    const clone = editor.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".rte-copy-btn").forEach(btn => btn.remove());
    // Also remove inline position:relative style added to <pre>
    clone.querySelectorAll("pre").forEach(pre => {
      (pre as HTMLElement).style.removeProperty("position");
    });
    return clone.innerHTML;
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  // ── Fix: only update DOM when value changes externally (not from typing) ──
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editor.innerHTML !== htmlValue) {
      editor.innerHTML = htmlValue;
    }
    injectCopyButtons();
  }, [htmlValue, injectCopyButtons]);
  // ──────────────────────────────────────────────────────────────────────────

  const execCommand = useCallback((command: string, cmdValue?: string) => {
    document.execCommand(command, false, cmdValue);
    editorRef.current?.focus();
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(getCleanHtml());
    }
    injectCopyButtons();
  }, [onChange, injectCopyButtons, getCleanHtml]);

  // ── Save / restore cursor selection (mất khi click Popover) ──────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Chỉ lưu nếu selection nằm trong editor
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    if (!editor || !range) {
      // Không có selection đã lưu → focus và đặt cursor cuối
      editor?.focus();
      return;
    }
    editor.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const execCommandWithRestore = useCallback((command: string, cmdValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, cmdValue);
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(getCleanHtml());
    }
    injectCopyButtons();
  }, [restoreSelection, onChange, getCleanHtml, injectCopyButtons]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(getCleanHtml());
    }
    injectCopyButtons();
  }, [onChange, injectCopyButtons, getCleanHtml]);

  const formatBlock = useCallback((tag: string) => {
    execCommand("formatBlock", tag === "p" ? "p" : tag);
  }, [execCommand]);

  const insertLink = useCallback(() => {
    if (linkUrl) {
      execCommand("createLink", linkUrl);
      setLinkUrl("");
    }
  }, [linkUrl, execCommand]);

  const insertImage = useCallback(() => {
    if (imageUrl) {
      execCommandWithRestore("insertImage", imageUrl);
      setImageUrl("");
      setImagePopoverOpen(false);
    }
  }, [imageUrl, execCommandWithRestore]);

  // Handle file picked — resize then preview
  const handleUploadFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    try {
      const { blob, dataUrl, originalSize } = await resizeImageFile(file);
      // Wrap resized blob as a File so we can still pass it to onImageUpload
      const resized = new File([blob], file.name, { type: blob.type });
      setUploadFile(resized);
      setUploadPreview(dataUrl);
      setUploadOriginalSize(originalSize);
      // Get dimensions from canvas result
      const img = new window.Image();
      img.onload = () => setUploadDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
    } catch {
      // Fallback: use original file without resize
      setUploadFile(file);
      setUploadOriginalSize(file.size);
      setUploadDimensions(null);
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUploadFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUploadFileSelect(file);
    },
    [handleUploadFileSelect]
  );

  const handleUploadDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setUploadDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUploadFileSelect(file);
    },
    [handleUploadFileSelect]
  );

  // Upload to server (or embed base64 if no handler) then insert into editor
  const insertUploadedImage = useCallback(async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      let url: string;
      if (onImageUpload) {
        url = await onImageUpload(uploadFile);
      } else {
        url = uploadPreview!;
      }
      execCommandWithRestore("insertImage", url);
      setUploadFile(null);
      setUploadPreview(null);
      setImagePopoverOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    }
  }, [uploadFile, uploadPreview, onImageUpload, execCommandWithRestore]);

  const clearUploadPreview = useCallback(() => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadDimensions(null);
    setUploadOriginalSize(null);
    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
  }, []);

  // ── Insert image chosen from library ─────────────────────────────────────
  const insertLibraryImage = useCallback((url: string) => {
    execCommandWithRestore("insertImage", url);
    setImagePopoverOpen(false);
  }, [execCommandWithRestore]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleContentChange();
    },
    [handleContentChange]
  );

  // ── Handle keyboard shortcuts inside editor ────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      // ── Tab inside <pre>: insert 2 spaces instead of moving focus ──────
      const anchorNode = sel.anchorNode;
      const preEl = (anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement)?.closest("pre");

      if (preEl && e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "  ");
        handleContentChange();
        return;
      }

      // ── Enter inside <pre>: exit block on double-Enter (blank last line) ──
      // Strategy: Shift+Enter always exits; plain Enter on a trailing blank line exits.
      if (preEl) {
        if (e.key === "Enter" && e.shiftKey) {
          // Shift+Enter → insert <p> after <pre> and move cursor there
          e.preventDefault();
          const editor = editorRef.current!;

          // Create a new paragraph after the <pre>
          const p = document.createElement("p");
          p.innerHTML = "<br>";
          preEl.insertAdjacentElement("afterend", p);

          // Move cursor into the new paragraph
          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          editor.focus();
          handleContentChange();
          return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
          // Check if cursor is at the very end of <pre> content on a blank last line
          const range = sel.getRangeAt(0);
          if (!range.collapsed) return; // has selection — let browser handle

          // Get text of <pre> (without copy button text)
          const clonePre = preEl.cloneNode(true) as HTMLElement;
          clonePre.querySelectorAll(".rte-copy-btn").forEach(b => b.remove());
          const preText = clonePre.innerText;

          // If the last two chars are newlines (blank trailing line) → exit
          if (preText.endsWith("\n\n") || preText.endsWith("\n\n ")) {
            e.preventDefault();
            const editor = editorRef.current!;

            // Remove the trailing blank line inside <pre> then insert <p> after
            document.execCommand("delete"); // removes the blank line char

            const p = document.createElement("p");
            p.innerHTML = "<br>";
            preEl.insertAdjacentElement("afterend", p);

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            editor.focus();
            handleContentChange();
          }
        }
      }
    },
    [handleContentChange]
  );
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
        {/* Hidden file input for image upload */}
        <input
          type="file"
          ref={uploadFileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleUploadFileInputChange}
        />

        {/* Toolbar */}
        <div className="border-b bg-muted/30 p-1 flex flex-wrap items-center gap-0.5">
          <ToolbarButton icon={<Undo className="h-4 w-4" />} tooltip="Hoàn tác (Ctrl+Z)" onClick={() => execCommand("undo")} />
          <ToolbarButton icon={<Redo className="h-4 w-4" />} tooltip="Làm lại (Ctrl+Y)" onClick={() => execCommand("redo")} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Select onValueChange={formatBlock} defaultValue="p">
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Định dạng" />
            </SelectTrigger>
            <SelectContent>
              {HEADING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => execCommand("fontSize", v)} defaultValue="3">
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue placeholder="Cỡ chữ" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value} className="text-xs">
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton icon={<Bold className="h-4 w-4" />} tooltip="Đậm (Ctrl+B)" onClick={() => execCommand("bold")} />
          <ToolbarButton icon={<Italic className="h-4 w-4" />} tooltip="Nghiêng (Ctrl+I)" onClick={() => execCommand("italic")} />
          <ToolbarButton icon={<Underline className="h-4 w-4" />} tooltip="Gạch chân (Ctrl+U)" onClick={() => execCommand("underline")} />
          <ToolbarButton icon={<Strikethrough className="h-4 w-4" />} tooltip="Gạch ngang" onClick={() => execCommand("strikeThrough")} />
          <ToolbarButton icon={<Subscript className="h-4 w-4" />} tooltip="Chỉ số dưới" onClick={() => execCommand("subscript")} />
          <ToolbarButton icon={<Superscript className="h-4 w-4" />} tooltip="Chỉ số trên" onClick={() => execCommand("superscript")} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-10 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => execCommand("foreColor", color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-8 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => execCommand("hiliteColor", color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton icon={<AlignLeft className="h-4 w-4" />} tooltip="Căn trái" onClick={() => execCommand("justifyLeft")} />
          <ToolbarButton icon={<AlignCenter className="h-4 w-4" />} tooltip="Căn giữa" onClick={() => execCommand("justifyCenter")} />
          <ToolbarButton icon={<AlignRight className="h-4 w-4" />} tooltip="Căn phải" onClick={() => execCommand("justifyRight")} />
          <ToolbarButton icon={<AlignJustify className="h-4 w-4" />} tooltip="Căn đều" onClick={() => execCommand("justifyFull")} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton icon={<List className="h-4 w-4" />} tooltip="Danh sách không thứ tự" onClick={() => execCommand("insertUnorderedList")} />
          <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} tooltip="Danh sách có thứ tự" onClick={() => execCommand("insertOrderedList")} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton icon={<Quote className="h-4 w-4" />} tooltip="Trích dẫn" onClick={() => formatBlock("blockquote")} />
          <ToolbarButton icon={<Code className="h-4 w-4" />} tooltip="Code" onClick={() => formatBlock("pre")} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chèn liên kết</label>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertLink()}
                />
                <Button size="sm" onClick={insertLink} className="w-full">
                  Chèn
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarButton icon={<Unlink className="h-4 w-4" />} tooltip="Xoá liên kết" onClick={() => execCommand("unlink")} />

          {/* Image – Upload + URL tabs */}
          <Popover
            open={imagePopoverOpen}
            onOpenChange={(open) => {
              setImagePopoverOpen(open);
              if (!open) {
                setUploadFile(null);
                setUploadPreview(null);
                setImageUrl("");
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={saveSelection}
              >
                <Image className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-3", imageBucket ? "w-96" : "w-80")} align="start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Chèn hình ảnh</span>
                </div>

                <Tabs defaultValue="upload">
                  <TabsList className={cn("grid w-full h-8", imageBucket ? "grid-cols-3" : "grid-cols-2")}>
                    <TabsTrigger value="upload" className="text-xs gap-1">
                      <Upload className="h-3 w-3" />
                      Tải lên
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs gap-1">
                      <Link className="h-3 w-3" />
                      URL ảnh
                    </TabsTrigger>
                    {imageBucket && (
                      <TabsTrigger value="library" className="text-xs gap-1">
                        <GalleryHorizontalEnd className="h-3 w-3" />
                        Thư viện
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* ── Upload Tab ── */}
                  <TabsContent value="upload" className="mt-3 space-y-3">
                    {uploadPreview ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                          <img
                            src={uploadPreview}
                            alt="Preview"
                            className="w-full max-h-40 object-contain"
                          />
                          <button
                            type="button"
                            onClick={clearUploadPreview}
                            className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {uploadFile?.name}{" "}
                          <span className="opacity-60">
                            ({uploadDimensions ? `${uploadDimensions.w}×${uploadDimensions.h}px · ` : ""}
                            {uploadFile ? (uploadFile.size / 1024).toFixed(0) : 0} KB
                            {uploadOriginalSize && uploadFile && uploadOriginalSize > uploadFile.size ? (
                              <span className="text-green-500 ml-1">
                                ↓ từ {(uploadOriginalSize / 1024).toFixed(0)} KB
                              </span>
                            ) : null})
                          </span>
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={insertUploadedImage}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang tải lên...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {onImageUpload ? "Tải lên & chèn ảnh" : "Chèn ảnh"}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Drag-and-drop zone */
                      <div
                        onDrop={handleUploadDrop}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setUploadDragOver(true);
                        }}
                        onDragLeave={() => setUploadDragOver(false)}
                        onClick={() => uploadFileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all select-none",
                          uploadDragOver
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Kéo thả hoặc click để chọn ảnh
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              PNG, JPG, GIF, WEBP (tối đa 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── URL Tab ── */}
                  <TabsContent value="url" className="mt-3 space-y-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && insertImage()}
                      className="text-sm"
                    />
                    {imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full max-h-32 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={insertImage}
                      className="w-full"
                      disabled={!imageUrl.trim()}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Chèn ảnh
                    </Button>
                  </TabsContent>

                  {/* ── Library Tab ── */}
                  {imageBucket && (
                    <TabsContent value="library" className="mt-3">
                      <ImageLibraryPicker
                        bucket={imageBucket}
                        prefix={imageBucketPrefix}
                        onSelect={insertLibraryImage}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton
            icon={<RemoveFormatting className="h-4 w-4" />}
            tooltip="Xoá định dạng"
            onClick={() => execCommand("removeFormat")}
          />
        </div>

        {/* Editor Content — dùng ref thay vì dangerouslySetInnerHTML để tránh reset cursor */}
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            "p-4 outline-none overflow-auto prose prose-sm max-w-none dark:prose-invert",
            "focus:ring-0 focus:outline-none",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic",
            "[&_pre]:bg-[#1e1e2e] [&_pre]:text-[#cdd6f4] [&_pre]:p-4 [&_pre]:pt-8 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:relative",
            "[&_code]:bg-transparent [&_code]:text-inherit [&_code]:p-0",
            "[&_a]:text-primary [&_a]:underline",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
          )}
          style={{ minHeight }}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />

        <style>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: hsl(var(--muted-foreground));
            pointer-events: none;
          }

          /* ── Code block copy button ── */
          .rte-copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid rgba(205, 214, 244, 0.2);
            background: rgba(205, 214, 244, 0.08);
            color: #a6adc8;
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
            z-index: 10;
          }
          .rte-copy-btn:hover {
            background: rgba(205, 214, 244, 0.18);
            color: #cdd6f4;
            border-color: rgba(205, 214, 244, 0.4);
          }
          .rte-copy-btn--copied {
            background: rgba(166, 227, 161, 0.18) !important;
            color: #a6e3a1 !important;
            border-color: rgba(166, 227, 161, 0.4) !important;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};

export default RichTextEditor;
