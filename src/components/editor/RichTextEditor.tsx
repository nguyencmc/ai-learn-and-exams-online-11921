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
} from "lucide-react";
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
const resizeImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> =>
  new Promise((resolve, reject) => {
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
          reader.onload = (e) => resolve({ blob, dataUrl: e.target!.result as string });
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
  // Track whether the last change came from user typing (not external prop update)
  const isInternalChange = useRef(false);

  const htmlValue = content ?? value ?? "";

  // ── Fix: only update DOM when value changes externally (not from typing) ──
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // Skip if the change originated from within the editor itself
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    // Only update if content actually differs to avoid cursor reset
    if (editor.innerHTML !== htmlValue) {
      editor.innerHTML = htmlValue;
    }
  }, [htmlValue]);
  // ──────────────────────────────────────────────────────────────────────────

  const execCommand = useCallback((command: string, cmdValue?: string) => {
    document.execCommand(command, false, cmdValue);
    editorRef.current?.focus();
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

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
      execCommand("insertImage", imageUrl);
      setImageUrl("");
      setImagePopoverOpen(false);
    }
  }, [imageUrl, execCommand]);

  // Handle file picked — resize then preview
  const handleUploadFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    try {
      const { blob, dataUrl } = await resizeImageFile(file);
      // Wrap resized blob as a File so we can still pass it to onImageUpload
      const resized = new File([blob], file.name, { type: blob.type });
      setUploadFile(resized);
      setUploadPreview(dataUrl);
      // Get dimensions from canvas result
      const img = new window.Image();
      img.onload = () => setUploadDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
    } catch {
      // Fallback: use original file without resize
      setUploadFile(file);
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
        // Fallback: embed as base64 data URL
        url = uploadPreview!;
      }
      execCommand("insertImage", url);
      setUploadFile(null);
      setUploadPreview(null);
      setImagePopoverOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    }
  }, [uploadFile, uploadPreview, onImageUpload, execCommand]);

  const clearUploadPreview = useCallback(() => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadDimensions(null);
    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleContentChange();
    },
    [handleContentChange]
  );

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
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Image className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Chèn hình ảnh</span>
                </div>

                <Tabs defaultValue="upload">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="upload" className="text-xs gap-1">
                      <Upload className="h-3 w-3" />
                      Tải ảnh lên
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs gap-1">
                      <Link className="h-3 w-3" />
                      URL ảnh
                    </TabsTrigger>
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
                            ({uploadFile ? (uploadFile.size / 1024).toFixed(1) : 0} KB
                            {uploadDimensions ? ` · ${uploadDimensions.w}×${uploadDimensions.h}px` : ""})
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
            "[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-sm",
            "[&_a]:text-primary [&_a]:underline",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
          )}
          style={{ minHeight }}
          onInput={handleContentChange}
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
        `}</style>
      </div>
    </TooltipProvider>
  );
};

export default RichTextEditor;
