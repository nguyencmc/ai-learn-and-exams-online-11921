import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileAudio,
  ImageIcon,
  Loader2,
  X,
  Trash2,
  Music,
} from 'lucide-react';
import type { PodcastMediaContentProps } from '@/features/podcastEditor/types';

export function PodcastMediaContent({
  audioUrl,
  thumbnailUrl,
  uploadingAudio,
  uploadingThumbnail,
  uploadProgress,
  audioInputRef,
  thumbnailInputRef,
  onAudioUpload,
  onThumbnailUpload,
  onAudioUrlChange,
  onThumbnailUrlChange,
}: PodcastMediaContentProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Media & Nội dung
        </CardTitle>
        <CardDescription>
          Upload file audio hoặc nhập URL trực tiếp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Upload */}
        <div className="space-y-3">
          <Label>File Audio *</Label>

          {/* Upload area */}
          <div
            onClick={() => !uploadingAudio && audioInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${uploadingAudio ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
            `}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              onChange={onAudioUpload}
              className="hidden"
            />

            {uploadingAudio ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang upload...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <FileAudio className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click để upload file audio</p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP3, WAV, OGG, M4A, AAC (tối đa 100MB)
                </p>
              </>
            )}
          </div>

          {/* Current audio preview */}
          {audioUrl && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Audio đã upload</p>
                <audio controls className="w-full mt-2 h-8">
                  <source src={audioUrl} />
                </audio>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAudioUrlChange('')}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Or use URL */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">hoặc nhập URL</span>
            </div>
          </div>

          <Input
            value={audioUrl}
            onChange={(e) => onAudioUrlChange(e.target.value)}
            placeholder="https://example.com/audio.mp3"
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-3">
          <Label>Thumbnail</Label>

          <div className="flex gap-4">
            {/* Thumbnail preview */}
            <div
              onClick={() => !uploadingThumbnail && thumbnailInputRef.current?.click()}
              className={`
                w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors overflow-hidden
                ${uploadingThumbnail ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={onThumbnailUpload}
                className="hidden"
              />

              {uploadingThumbnail ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">Upload</p>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <Input
                value={thumbnailUrl}
                onChange={(e) => onThumbnailUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Ảnh thumbnail hiển thị cho podcast (khuyến nghị 400x400px)
              </p>
              {thumbnailUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onThumbnailUrlChange('')}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Xóa thumbnail
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
