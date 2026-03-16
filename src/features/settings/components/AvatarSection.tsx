import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Upload, Trash2 } from "lucide-react";

interface AvatarSectionProps {
  avatarUrl: string;
  uploading: boolean;
  fallbackChar: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export function AvatarSection({ avatarUrl, uploading, fallbackChar, onUpload, onRemove }: AvatarSectionProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-muted">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {fallbackChar}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Ảnh đại diện
        </Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Tải ảnh lên
          </Button>
          {avatarUrl && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa ảnh
            </Button>
          )}
        </div>
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={onUpload}
        />
        <p className="text-xs text-muted-foreground">
          Chấp nhận JPG, PNG, GIF, WebP. Tối đa 2MB.
        </p>
      </div>
    </div>
  );
}
