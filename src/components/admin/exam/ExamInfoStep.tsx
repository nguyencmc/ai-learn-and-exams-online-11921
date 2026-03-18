import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SmartEditor } from '@/components/editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Clock, BarChart3, FolderOpen, ImagePlus, X, Upload, Loader2 } from 'lucide-react';

interface ExamCategory {
  id: string;
  name: string;
}

interface ExamInfoStepProps {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  difficulty: string;
  durationMinutes: number;
  thumbnailUrl: string;
  categories: ExamCategory[];
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onThumbnailUpload: (file: File) => Promise<string>;
  onThumbnailRemove: () => void;
}

export const ExamInfoStep = ({
  title,
  slug,
  description,
  categoryId,
  difficulty,
  durationMinutes,
  thumbnailUrl,
  categories,
  isEditing,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onCategoryChange,
  onDifficultyChange,
  onDurationChange,
  onThumbnailUpload,
  onThumbnailRemove,
}: ExamInfoStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    onTitleChange(value);
    if (!isEditing) {
      onSlugChange(generateSlug(value));
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setUploading(true);
    try {
      await onThumbnailUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Thông tin đề thi</CardTitle>
          <CardDescription>
            Nhập các thông tin cơ bản về đề thi của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              Ảnh bìa đề thi
            </Label>
            {thumbnailUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-border">
                <img
                  src={thumbnailUrl}
                  alt="Ảnh bìa đề thi"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onThumbnailRemove}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }
                `}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Đang tải lên...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Kéo thả ảnh hoặc click để chọn</p>
                      <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP (tối đa 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Title & Slug */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tiêu đề *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="VD: Đề thi Toán lớp 12 - Chương 1"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                Đường dẫn (slug) *
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="de-thi-toan-lop-12"
                className="h-11 font-mono text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <SmartEditor
              content={description}
              onChange={onDescriptionChange}
              placeholder="Mô tả ngắn về nội dung và mục đích của đề thi..."
              miniMinHeight="100px"
              fullMinHeight="200px"
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Danh mục
              </Label>
              <Select value={categoryId} onValueChange={onCategoryChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Độ khó
              </Label>
              <Select value={difficulty} onValueChange={onDifficultyChange}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <span className="flex items-center gap-2">
                      🟢 Dễ
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      🟡 Trung bình
                    </span>
                  </SelectItem>
                  <SelectItem value="hard">
                    <span className="flex items-center gap-2">
                      🔴 Khó
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Thời gian làm bài (phút)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => onDurationChange(parseInt(e.target.value) || 60)}
                min={1}
                max={300}
                className="w-32 h-11"
              />
              <div className="flex gap-2">
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onDurationChange(mins)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${durationMinutes === mins
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted hover:bg-muted/80 border-border'
                      }`}
                  >
                    {mins}p
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
