import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookCategory } from '@/features/bookEditor/types';

interface BookBasicInfoProps {
  title: string;
  slug: string;
  authorName: string;
  description: string;
  categoryId: string;
  difficulty: string;
  pageCount: number;
  categories: BookCategory[];
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onPageCountChange: (value: number) => void;
}

export function BookBasicInfo({
  title,
  slug,
  authorName,
  description,
  categoryId,
  difficulty,
  pageCount,
  categories,
  onTitleChange,
  onSlugChange,
  onAuthorNameChange,
  onDescriptionChange,
  onCategoryIdChange,
  onDifficultyChange,
  onPageCountChange,
}: BookBasicInfoProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Nhập tiêu đề sách"
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="ten-sach"
          />
        </div>

        <div>
          <Label htmlFor="author">Tác giả</Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => onAuthorNameChange(e.target.value)}
            placeholder="Tên tác giả"
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Mô tả về sách"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Danh mục</Label>
            <Select value={categoryId} onValueChange={onCategoryIdChange}>
              <SelectTrigger>
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

          <div>
            <Label htmlFor="difficulty">Độ khó</Label>
            <Select value={difficulty} onValueChange={onDifficultyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Cơ bản</SelectItem>
                <SelectItem value="intermediate">Trung cấp</SelectItem>
                <SelectItem value="advanced">Nâng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="pageCount">Số trang</Label>
          <Input
            id="pageCount"
            type="number"
            value={pageCount}
            onChange={(e) => onPageCountChange(parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
      </CardContent>
    </Card>
  );
}
