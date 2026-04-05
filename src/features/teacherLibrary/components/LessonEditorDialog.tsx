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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, X, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import type { TeacherLesson, ContentVisibility } from '../types';

interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: TeacherLesson | null;
  teacherId: string;
  onSave: (data: Partial<TeacherLesson>) => Promise<void>;
}

export function LessonEditorDialog({
  open,
  onOpenChange,
  lesson,
  teacherId,
  onSave,
}: LessonEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<ContentVisibility>('private');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(lesson?.title ?? '');
    setContent(lesson?.content ?? '');
    setVisibility(lesson?.visibility ?? 'private');
    setTags(lesson?.tags ?? []);
    setTagInput('');
    const path = lesson?.cover_image ?? null;
    setCoverImage(path);
    if (path) {
      supabase.storage
        .from('class-materials')
        .createSignedUrl(path, 3600)
        .then(({ data }) => setCoverPreview(data?.signedUrl ?? null))
        .catch(() => setCoverPreview(null));
    } else {
      setCoverPreview(null);
    }
  }, [open, lesson]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `${teacherId}/covers/${safeName}`;
      const { error } = await supabase.storage
        .from('class-materials')
        .upload(filePath, file, { upsert: false });
      if (error) throw error;
      const { data: signedUrlData } = await supabase.storage
        .from('class-materials')
        .createSignedUrl(filePath, 3600);
      setCoverImage(filePath);
      setCoverPreview(signedUrlData?.signedUrl ?? null);
    } catch (err) {
      console.error('Cover upload failed', err);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

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

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), content, cover_image: coverImage, visibility, tags });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            {lesson ? 'Chỉnh sửa bài giảng' : 'Tạo bài giảng mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Cover image */}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          <div className="space-y-1.5">
            <Label>Ảnh bìa (tuỳ chọn)</Label>
            {coverPreview ? (
              <div className="relative group rounded-lg overflow-hidden border border-border/50 h-32">
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đổi ảnh'}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => { setCoverImage(null); setCoverPreview(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-muted-foreground text-sm"
              >
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {uploadingCover ? 'Đang tải ảnh bìa...' : 'Thêm ảnh bìa'}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Tiêu đề *</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài giảng..."
              className="text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-1.5">
            <Label>Nội dung</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              imageBucket="class-materials"
              imageBucketPrefix="lessons/"
              minHeight="300px"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? 'Đang lưu...' : lesson ? 'Cập nhật' : 'Tạo bài giảng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
