import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  Plus,
  Info,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PodcastTranscriptProps } from '@/features/podcastEditor/types';

export function PodcastTranscript({
  transcript,
  audioUrl,
  durationMinutes,
  durationSeconds,
  generatingTranscript,
  onTranscriptChange,
  onGenerateTranscript,
}: PodcastTranscriptProps) {
  return (
    <Card className="border-border/50 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcript với Timestamps
            </CardTitle>
            <CardDescription className="mt-1">
              Nhập transcript với timestamps để đồng bộ hiển thị chữ theo audio
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-medium mb-2">Định dạng Transcript:</p>
              <p className="text-xs mb-2">Mỗi dòng có thể bắt đầu với timestamp:</p>
              <code className="text-xs bg-muted p-1 rounded block mb-1">[00:00] Xin chào các bạn</code>
              <code className="text-xs bg-muted p-1 rounded block mb-1">[00:05] Đây là bài học hôm nay</code>
              <code className="text-xs bg-muted p-1 rounded block">[01:30] Cảm ơn đã theo dõi</code>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Transcript Generation */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex-1">
            <p className="text-sm font-medium">🎤 Tạo Transcript AI</p>
            <p className="text-xs text-muted-foreground">
              AI sẽ phân tích audio và tạo transcript với timestamps tự động (kiểu karaoke)
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onGenerateTranscript}
            disabled={generatingTranscript || !audioUrl}
            className="gap-2"
          >
            {generatingTranscript ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo...
              </>
            ) : transcript ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Tạo lại
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Tạo Transcript
              </>
            )}
          </Button>
        </div>

        {/* Quick timestamp buttons */}
        <div className="flex flex-wrap gap-2 pb-2">
          <Badge variant="outline" className="text-xs">
            Định dạng: [MM:SS] Nội dung
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const mins = durationMinutes.toString().padStart(2, '0');
              const secs = durationSeconds.toString().padStart(2, '0');
              onTranscriptChange(transcript + (transcript ? '\n' : '') + `[${mins}:${secs}] `);
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Thêm timestamp cuối
          </Button>
        </div>

        {/* Transcript input */}
        <Textarea
          id="transcript"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={`[00:00] Xin chào các bạn, đây là podcast học tiếng Anh
[00:05] Hôm nay chúng ta sẽ học về chủ đề...
[00:15] Từ vựng đầu tiên là "vocabulary"
[00:30] Nghĩa là từ vựng trong tiếng Việt
[01:00] Hãy cùng luyện tập phát âm...`}
          className="min-h-[300px] font-mono text-sm"
        />

        {/* Transcript preview */}
        {transcript && (
          <div className="mt-4">
            <Label className="mb-2 block">Xem trước Transcript</Label>
            <div className="border rounded-lg p-4 bg-muted/50 max-h-[200px] overflow-y-auto">
              {transcript.split('\n').map((line, index) => {
                const timestampMatch = line.match(/^\[(\d{1,2}):(\d{2})\]/);
                if (timestampMatch) {
                  const time = timestampMatch[0];
                  const content = line.replace(timestampMatch[0], '').trim();
                  return (
                    <div key={index} className="flex gap-2 mb-2">
                      <Badge variant="secondary" className="shrink-0 font-mono">
                        <Clock className="w-3 h-3 mr-1" />
                        {time.replace('[', '').replace(']', '')}
                      </Badge>
                      <span className="text-sm">{content}</span>
                    </div>
                  );
                }
                return line.trim() ? (
                  <p key={index} className="text-sm text-muted-foreground mb-2">{line}</p>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{transcript.split('\n').filter(l => l.trim()).length} dòng</span>
          <span>{transcript.length} ký tự</span>
          <span>
            {transcript.match(/\[\d{1,2}:\d{2}\]/g)?.length || 0} timestamps
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
