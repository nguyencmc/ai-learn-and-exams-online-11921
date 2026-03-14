import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Trash2, GripVertical } from 'lucide-react';
import type { Chapter } from '@/features/bookEditor/types';

interface BookChaptersProps {
  chapters: Chapter[];
  onAddChapter: () => void;
  onUpdateChapter: (index: number, field: keyof Chapter, value: string | number) => void;
  onRemoveChapter: (index: number) => void;
}

export function BookChapters({
  chapters,
  onAddChapter,
  onUpdateChapter,
  onRemoveChapter,
}: BookChaptersProps) {
  return (
    <Card className="border-border/50 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mục lục (Chapters)</CardTitle>
            <CardDescription>
              Thêm các chương để giúp người đọc điều hướng dễ dàng hơn
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onAddChapter} className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm chương
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có chương nào</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddChapter}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm chương đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div key={index} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16">
                      <Label className="text-xs">Thứ tự</Label>
                      <Input
                        type="number"
                        value={chapter.chapter_order}
                        onChange={(e) => onUpdateChapter(index, 'chapter_order', parseInt(e.target.value) || 1)}
                        min={1}
                        className="text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Tên chương</Label>
                      <Input
                        value={chapter.title}
                        onChange={(e) => onUpdateChapter(index, 'title', e.target.value)}
                        placeholder="Tên chương"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Nội dung chương (tùy chọn)</Label>
                    <Textarea
                      value={chapter.content}
                      onChange={(e) => onUpdateChapter(index, 'content', e.target.value)}
                      placeholder="Nội dung chương..."
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveChapter(index)}
                  className="text-destructive flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
