import { useState } from 'react';
import { Video, Loader2, X, Play, ExternalLink, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClassResources, useRemoveClassResource } from '../hooks/useClassLibrary';

interface VideoTabProps {
  classId: string;
  isManager: boolean;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

interface VideoPlayerProps {
  url: string | null;
  filePath: string | null;
  title: string;
}

const VideoPlayer = ({ url, filePath, title }: VideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(url);
  const [loading, setLoading] = useState(false);

  const loadSignedUrl = async () => {
    if (!filePath) return;
    setLoading(true);
    const { data } = await supabase.storage
      .from('class-materials')
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) setVideoUrl(data.signedUrl);
    setLoading(false);
  };

  if (!url && !filePath) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
        <p className="text-sm text-muted-foreground">Không có nguồn video</p>
      </div>
    );
  }

  // YouTube embed
  if (url) {
    const ytId = getYouTubeId(url);
    if (ytId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    // Direct video URL
    if (isDirectVideo(url)) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video controls className="w-full h-full" title={title}>
            <source src={url} />
            Trình duyệt không hỗ trợ phát video.
          </video>
        </div>
      );
    }

    // Unknown URL - show open button
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3">
        <Video className="h-12 w-12 text-muted-foreground" />
        <a href={url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Mở video
          </Button>
        </a>
      </div>
    );
  }

  // File storage video
  if (filePath) {
    if (videoUrl && isDirectVideo(videoUrl)) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video controls className="w-full h-full" title={title}>
            <source src={videoUrl} />
            Trình duyệt không hỗ trợ phát video.
          </video>
        </div>
      );
    }
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3">
        <Play className="h-12 w-12 text-muted-foreground" />
        <Button
          size="sm"
          onClick={loadSignedUrl}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Phát video
        </Button>
      </div>
    );
  }

  return null;
};

const VideoTab = ({ classId, isManager }: VideoTabProps) => {
  const { data: resources, isLoading } = useClassResources(classId);
  const removeResource = useRemoveClassResource();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const videos = (resources ?? []).filter(r => r.resource?.type === 'video');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải video...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mb-5">
          <Video className="h-10 w-10 text-red-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Chưa có video nào</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isManager
            ? 'Vào Thư viện cá nhân, thêm tài liệu loại "Video" rồi gán vào lớp để hiển thị tại đây.'
            : 'Giáo viên chưa thêm video nào vào lớp học này.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Video className="h-4 w-4 text-red-500" />
        <h3 className="font-semibold text-sm">Video bài học</h3>
        <span className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full">
          {videos.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {videos.map((item) => {
          const res = item.resource;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all"
            >
              {/* Video player or thumbnail */}
              {isExpanded ? (
                <VideoPlayer
                  url={res?.url ?? null}
                  filePath={res?.file_path ?? null}
                  title={res?.title ?? 'Video'}
                />
              ) : (
                <button
                  className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hover:from-gray-700 hover:to-gray-800 transition-colors"
                  onClick={() => setExpandedId(item.id)}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-white fill-white ml-1" />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                </button>
              )}

              {/* Info row */}
              <div className="flex items-center justify-between p-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{res?.title ?? 'Video'}</p>
                  {res?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{res.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isExpanded ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpandedId(null)}
                      title="Thu gọn"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  {res?.url && (
                    <a href={res.url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Mở ngoài">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {res?.file_path && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Tải xuống"
                      onClick={async () => {
                        const { data } = await supabase.storage
                          .from('class-materials')
                          .createSignedUrl(res.file_path!, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeResource.mutate({ id: item.id, classId })}
                      disabled={removeResource.isPending}
                    >
                      {removeResource.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoTab;
