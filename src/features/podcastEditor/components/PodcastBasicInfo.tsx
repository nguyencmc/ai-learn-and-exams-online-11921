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
import type { PodcastBasicInfoProps } from '@/features/podcastEditor/types';

export function PodcastBasicInfo({
  title,
  slug,
  description,
  categoryId,
  difficulty,
  hostName,
  episodeNumber,
  durationMinutes,
  durationSeconds,
  categories,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onCategoryIdChange,
  onDifficultyChange,
  onHostNameChange,
  onEpisodeNumberChange,
  onDurationMinutesChange,
  onDurationSecondsChange,
}: PodcastBasicInfoProps) {
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
            placeholder="Nhập tiêu đề podcast"
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="ten-podcast"
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Mô tả về podcast"
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
                <SelectItem value="beginner">Người mới</SelectItem>
                <SelectItem value="intermediate">Trung cấp</SelectItem>
                <SelectItem value="advanced">Nâng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={hostName}
              onChange={(e) => onHostNameChange(e.target.value)}
              placeholder="Tên host"
            />
          </div>

          <div>
            <Label htmlFor="episode">Số tập</Label>
            <Input
              id="episode"
              type="number"
              value={episodeNumber}
              onChange={(e) => onEpisodeNumberChange(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        </div>

        <div>
          <Label>Thời lượng</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => onDurationMinutesChange(parseInt(e.target.value) || 0)}
              min={0}
              className="w-20"
            />
            <span className="text-muted-foreground">phút</span>
            <Input
              type="number"
              value={durationSeconds}
              onChange={(e) => onDurationSecondsChange(parseInt(e.target.value) || 0)}
              min={0}
              max={59}
              className="w-20"
            />
            <span className="text-muted-foreground">giây</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
