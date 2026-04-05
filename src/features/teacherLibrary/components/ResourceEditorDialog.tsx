import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, X, Plus, Upload, Loader2, FileIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { TeacherResource, ContentVisibility, ResourceType } from '../types';

interface ResourceEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: TeacherResource | null;
  teacherId: string;
  onSave: (data: Partial<TeacherResource>) => Promise<void>;
  prefillFile?: File | null;
}

export function ResourceEditorDialog({
  open,
  onOpenChange,
  resource,
  teacherId,
  onSave,
  prefillFile,
}: ResourceEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('link');
  const [url, setUrl] = useState('');
  const [visibility, setVisibility] = useState<ContentVisibility>('private');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(resource?.title ?? '');
      setDescription(resource?.description ?? '');
      setType(resource?.type ?? (prefillFile ? 'document' : 'link'));
      setUrl(resource?.url ?? '');
      setVisibility(resource?.visibility ?? 'private');
      setTags(resource?.tags ?? []);
      setTagInput('');
      setUploadedFilePath(resource?.file_path ?? null);
      setUploadedFileName(resource?.file_path ? resource.file_path.split('/').pop() ?? null : null);
      setUploadedFileSize(resource?.file_size ?? null);
      setUploadedMimeType(resource?.mime_type ?? null);
    }
  }, [open, resource, prefillFile]);

  // Auto-upload prefillFile when dialog opens with it
  useEffect(() => {
    if (open && prefillFile && teacherId && !uploadedFilePath) {
      (async () => {
        setType('document');
        if (!title) setTitle(prefillFile.name.replace(/\.[^.]+$/, ''));
        setUploading(true);
        try {
          const safeName = `${Date.now()}_${prefillFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const filePath = `${teacherId}/resources/${safeName}`;
          const ext = prefillFile.name.split('.').pop() || '';
          const { error } = await supabase.storage
            .from('class-materials')
            .upload(filePath, prefillFile, { upsert: false });
          if (error) throw error;
          setUploadedFilePath(filePath);
          setUploadedFileName(prefillFile.name);
          setUploadedFileSize(prefillFile.size);
          setUploadedMimeType(prefillFile.type || `application/${ext}`);
        } catch (err) {
          console.error('Auto-upload failed', err);
        } finally {
          setUploading(false);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillFile]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || '';
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `${teacherId}/resources/${safeName}`;
      const { error } = await supabase.storage
        .from('class-materials')
        .upload(filePath, file, { upsert: false });
      if (error) throw error;
      setUploadedFilePath(filePath);
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      setUploadedMimeType(file.type || `application/${ext}`);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        type,
        url: url.trim() || null,
        file_path: uploadedFilePath,
        file_size: uploadedFileSize,
        mime_type: uploadedMimeType,
        visibility,
        tags,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const typeLabel: Record<ResourceType, string> = {
    link:     'Đường dẫn',
    document: 'Tài liệu / File',
    video:    'Video',
  };

  const showFileUpload = type === 'document';
  const showUrlInput = type === 'link' || type === 'video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            {resource ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="resource-title">Tiêu đề *</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên tài liệu..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về tài liệu..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Loại tài liệu</Label>
              <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabel) as ResourceType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Hiển thị</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as ContentVisibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Riêng tư</SelectItem>
                  <SelectItem value="public">Công khai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showUrlInput && (
            <div className="space-y-1.5">
              <Label htmlFor="resource-url">
                {type === 'video' ? 'URL Video' : 'Đường dẫn URL'}
              </Label>
              <Input
                id="resource-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {showFileUpload && (
            <div className="space-y-1.5">
              <Label>File tài liệu</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadedFilePath && uploadedFileName ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <FileIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                    {uploadedFileSize && (
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFileSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFilePath(null);
                      setUploadedFileName(null);
                      setUploadedFileSize(null);
                      setUploadedMimeType(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    'w-full flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed transition-all',
                    uploading
                      ? 'border-border/30 opacity-60 cursor-wait'
                      : 'border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer'
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Nhấn để chọn file (max 50MB)
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Thẻ tag</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Thêm tag, nhấn Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="rounded-full hover:bg-destructive/20 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving || uploading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : resource ? 'Cập nhật' : 'Thêm tài liệu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
