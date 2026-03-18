import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, Trash2 } from 'lucide-react';

interface BookCoverUploadProps {
  coverUrl: string;
  uploadingCover: boolean;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onCoverUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverUrlChange: (value: string) => void;
}

export function BookCoverUpload({
  coverUrl,
  uploadingCover,
  coverInputRef,
  onCoverUpload,
  onCoverUrlChange,
}: BookCoverUploadProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Ảnh bìa
        </CardTitle>
        <CardDescription>
          Upload ảnh bìa sách (khuyến nghị 600x900px)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {/* Cover preview */}
          <div
            onClick={() => !uploadingCover && coverInputRef.current?.click()}
            className={`
              w-40 h-56 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors overflow-hidden
              ${uploadingCover ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={onCoverUpload}
              className="hidden"
            />

            {uploadingCover ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : coverUrl ? (
              <img src={coverUrl} alt="Ảnh bìa sách xem trước" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-2">Click để upload</p>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <Input
              value={coverUrl}
              onChange={(e) => onCoverUrlChange(e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Hoặc nhập URL ảnh bìa trực tiếp
            </p>
            {coverUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCoverUrlChange('')}
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Xóa ảnh bìa
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
