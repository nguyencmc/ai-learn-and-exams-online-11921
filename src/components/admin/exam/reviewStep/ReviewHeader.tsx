import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, FolderOpen, ImageIcon } from 'lucide-react';
import { type ReviewHeaderProps } from './types';

export const ReviewHeader = ({
  title,
  description,
  categoryName,
  thumbnailUrl,
  onEditInfo,
}: ReviewHeaderProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Thông tin đề thi</CardTitle>
          <CardDescription>Kiểm tra lại các thông tin cơ bản</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onEditInfo}>
          <Edit className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {thumbnailUrl && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Ảnh bìa
            </p>
            <img
              src={thumbnailUrl}
              alt="Ảnh bìa đề thi"
              className="w-full max-w-md h-40 object-cover rounded-lg border"
            />
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tiêu đề</p>
            <p className="font-medium">{title || '(Chưa nhập)'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Danh mục</p>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium">{categoryName || '(Chưa chọn)'}</p>
            </div>
          </div>
        </div>
        {description && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
            <p className="text-sm">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
