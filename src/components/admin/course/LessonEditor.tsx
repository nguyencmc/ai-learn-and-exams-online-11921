import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('LessonEditor');
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  GripVertical, 
  Trash2, 
  Eye, 
  Upload, 
  Video, 
  FileText, 
  ClipboardList,
  ChevronDown,
  File,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export interface LessonAttachment {
  id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  display_order: number;
}

export interface CourseLesson {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  lesson_order: number;
  is_preview: boolean;
  content_type: 'video' | 'document' | 'test';
  attachments?: LessonAttachment[];
}

interface LessonEditorProps {
  lesson: CourseLesson;
  sectionIndex: number;
  lessonIndex: number;
  onUpdate: (data: Partial<CourseLesson>) => void;
  onRemove: () => void;
}

export const LessonEditor = ({ 
  lesson, 
  _sectionIndex, 
  lessonIndex, 
  onUpdate, 
  onRemove 
}: LessonEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'test': return <ClipboardList className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'video': return <Badge variant="default" className="bg-blue-500">Video</Badge>;
      case 'document': return <Badge variant="default" className="bg-green-500">Tài liệu</Badge>;
      case 'test': return <Badge variant="default" className="bg-purple-500">Bài test</Badge>;
      default: return <Badge>Video</Badge>;
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File video không được vượt quá 500MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const date = new Date();
      const filePath = `videos/${date.getFullYear()}/${date.getMonth() + 1}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(data.path);

      onUpdate({ video_url: urlData.publicUrl });
      
      toast({
        title: "Thành công",
        description: "Đã tải lên video",
      });
    } catch (error: unknown) {
      log.error('Upload error', error);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: LessonAttachment[] = [...(lesson.attachments || [])];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (max 100MB per file)
        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "Cảnh báo",
            description: `File ${file.name} vượt quá 100MB và bị bỏ qua`,
            variant: "destructive",
          });
          continue;
        }

        const date = new Date();
        const filePath = `documents/${date.getFullYear()}/${date.getMonth() + 1}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(data.path);

        newAttachments.push({
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          display_order: newAttachments.length,
        });
      }

      onUpdate({ attachments: newAttachments });
      
      toast({
        title: "Thành công",
        description: `Đã tải lên ${files.length} tài liệu`,
      });
    } catch (error: unknown) {
      log.error('Upload error', error);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (docInputRef.current) {
        docInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = (lesson.attachments || []).filter((_, i) => i !== index);
    onUpdate({ attachments: newAttachments });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-muted/50 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex-1 flex items-center gap-2">
            {getContentTypeIcon(lesson.content_type || 'video')}
            <span className="font-medium truncate">{lesson.title || `Bài ${lessonIndex + 1}`}</span>
            {getContentTypeBadge(lesson.content_type || 'video')}
            {lesson.is_preview && <Badge variant="outline" className="text-xs">Xem trước</Badge>}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <CollapsibleContent className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label>Tên bài học</Label>
            <Input
              value={lesson.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Tên bài học"
            />
          </div>

          {/* Content Type & Preview */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Loại nội dung</Label>
              <Select 
                value={lesson.content_type || 'video'}
                onValueChange={(value: 'video' | 'document' | 'test') => onUpdate({ content_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Tài liệu
                    </div>
                  </SelectItem>
                  <SelectItem value="test">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Bài test
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label>Thời lượng (phút)</Label>
                <Input
                  type="number"
                  value={lesson.duration_minutes}
                  onChange={(e) => onUpdate({ duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={lesson.is_preview}
                  onCheckedChange={(checked) => onUpdate({ is_preview: checked })}
                />
                <Label className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  Xem trước
                </Label>
              </div>
            </div>
          </div>

          {/* Video Upload (only for video type) */}
          {(lesson.content_type === 'video' || !lesson.content_type) && (
            <div className="space-y-2">
              <Label>Video bài học</Label>
              <div className="flex gap-2">
                <Input
                  value={lesson.video_url}
                  onChange={(e) => onUpdate({ video_url: e.target.value })}
                  placeholder="URL video hoặc upload file"
                  className="flex-1"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {lesson.video_url && (
                <p className="text-xs text-muted-foreground truncate">
                  {lesson.video_url}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={lesson.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Mô tả ngắn về bài học..."
              rows={2}
            />
          </div>

          {/* Attachments (Documents) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tài liệu đính kèm</Label>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => docInputRef.current?.click()}
                disabled={uploading}
                className="gap-1"
              >
                {uploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Tải lên
              </Button>
            </div>
            
            {(lesson.attachments?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {lesson.attachments?.map((attachment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-background p-2 rounded border"
                  >
                    <File className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test info (only for test type) */}
          {lesson.content_type === 'test' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                💡 Sau khi lưu khóa học, bạn có thể thêm câu hỏi cho bài test này trong phần quản lý bài test.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
