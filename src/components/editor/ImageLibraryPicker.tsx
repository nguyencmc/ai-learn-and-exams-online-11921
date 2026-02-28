/**
 * ImageLibraryPicker
 * ─────────────────────────────────────────────────────────────────────────────
 * Hiển thị lưới ảnh đã upload từ Supabase Storage bucket.
 * Cho phép tìm kiếm, chọn ảnh để chèn vào editor, hoặc xoá ảnh không dùng.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  ImageOff,
  FolderOpen,
} from "lucide-react";

interface StorageFile {
  name: string;
  path: string;         // full path inside bucket
  publicUrl: string;
  size: number;         // bytes
  createdAt: string;
}

interface ImageLibraryPickerProps {
  bucket: string;           // e.g. "question-images" | "public-assets"
  /** prefix inside bucket to list (e.g. "" = root, "article-images/" = subfolder) */
  prefix?: string;
  onSelect: (url: string) => void;
  className?: string;
}

// ── Supabase image transform helper ──────────────────────────────────────────
const thumbUrl = (url: string, w = 160) =>
  url
    .replace("/storage/v1/object/public/", "/storage/v1/render/image/public/")
    .replace(/\?.*$/, "") + `?width=${w}&quality=70`;

// ── Format bytes ──────────────────────────────────────────────────────────────
const fmtSize = (b: number) => {
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + " MB";
  if (b >= 1024) return (b / 1024).toFixed(0) + " KB";
  return b + " B";
};

// ── Recursively list all files in a bucket/prefix ────────────────────────────
async function listAll(bucket: string, prefix = ""): Promise<StorageFile[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

  if (error || !data) return [];

  const files: StorageFile[] = [];
  for (const item of data) {
    if (item.metadata) {
      // it's a file
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      files.push({
        name: item.name,
        path,
        publicUrl: urlData.publicUrl,
        size: item.metadata.size ?? 0,
        createdAt: item.created_at ?? "",
      });
    } else {
      // it's a folder — recurse
      const sub = prefix ? `${prefix}/${item.name}` : item.name;
      const children = await listAll(bucket, sub);
      files.push(...children);
    }
  }
  return files;
}

// ─────────────────────────────────────────────────────────────────────────────

export const ImageLibraryPicker: React.FC<ImageLibraryPickerProps> = ({
  bucket,
  prefix = "",
  onSelect,
  className,
}) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAll(bucket, prefix);
      setFiles(result);
    } finally {
      setLoading(false);
    }
  }, [bucket, prefix]);

  // Auto-load on mount (only once)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();
  }, [load]);

  const handleDelete = useCallback(
    async (file: StorageFile, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`Xoá ảnh "${file.name}"?\nThao tác này không thể hoàn tác.`)) return;
      setDeleting(file.path);
      const { error } = await supabase.storage.from(bucket).remove([file.path]);
      setDeleting(null);
      if (!error) {
        setFiles((prev) => prev.filter((f) => f.path !== file.path));
        if (selected === file.publicUrl) setSelected(null);
      }
    },
    [bucket, selected]
  );

  const filtered = files.filter(
    (f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.path.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (file: StorageFile) => {
    setSelected(file.publicUrl);
  };

  const handleConfirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Search + Refresh */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Tìm kiếm tên file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { fetchedRef.current = false; load(); }}
          disabled={loading}
          title="Tải lại"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Grid */}
      <div className="relative min-h-[160px] max-h-[300px] overflow-y-auto rounded-md border border-border bg-muted/20 p-1.5">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Đang tải thư viện...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {search ? (
              <>
                <Search className="h-6 w-6 opacity-40" />
                <span className="text-xs">Không tìm thấy ảnh phù hợp</span>
              </>
            ) : (
              <>
                <FolderOpen className="h-6 w-6 opacity-40" />
                <span className="text-xs">Chưa có ảnh nào trong thư viện</span>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map((file) => {
              const isSelected = selected === file.publicUrl;
              const hasError = imgErrors.has(file.path);
              const isBeingDeleted = deleting === file.path;

              return (
                <div
                  key={file.path}
                  onClick={() => handleSelect(file)}
                  className={cn(
                    "group relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-1"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {hasError ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/40">
                      <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  ) : (
                    <img
                      src={thumbUrl(file.publicUrl)}
                      alt={file.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImgErrors((prev) => new Set([...prev, file.path]))
                      }
                    />
                  )}

                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-1 left-1">
                      <CheckCircle2 className="h-4 w-4 text-primary drop-shadow" />
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(file, e)}
                    disabled={isBeingDeleted}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity hover:bg-destructive"
                    title="Xoá ảnh"
                  >
                    {isBeingDeleted ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-2.5 w-2.5" />
                    )}
                  </button>

                  {/* Hover overlay with filename */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-white leading-tight truncate">{file.name}</p>
                    <p className="text-[9px] text-white/70">{fmtSize(file.size)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: count + confirm */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {loading ? "Đang tải..." : `${filtered.length} ảnh${search ? " (đã lọc)" : ""}`}
        </span>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs px-3"
          disabled={!selected}
          onClick={handleConfirm}
        >
          Chèn ảnh đã chọn
        </Button>
      </div>
    </div>
  );
};

export default ImageLibraryPicker;
