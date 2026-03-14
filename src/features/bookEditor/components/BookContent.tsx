import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface BookContentProps {
  content: string;
  onContentChange: (value: string) => void;
}

export function BookContent({ content, onContentChange }: BookContentProps) {
  const estimatedPages = (() => {
    const PAGE_BREAK_REGEX = /(?:^|\n)(?:---|<!--\s*page\s*-->)\s*(?:\n|$)/gi;
    const hasMarkers = PAGE_BREAK_REGEX.test(content);
    PAGE_BREAK_REGEX.lastIndex = 0;

    if (hasMarkers) {
      return content.split(PAGE_BREAK_REGEX).filter(p => p.trim()).length;
    }
    return Math.ceil(content.length / 2000);
  })();

  return (
    <Card className="border-border/50 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Nội dung sách</CardTitle>
            <CardDescription>
              Nhập nội dung đầy đủ của sách. Hỗ trợ markdown (# ## ### cho tiêu đề).
            </CardDescription>
          </div>
          {content && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {estimatedPages}
              </div>
              <div className="text-xs text-muted-foreground">trang (ước tính)</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pagination Guide */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            📖 Hướng dẫn chia trang
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Tự động:</strong> Nếu không có markers, sách sẽ tự chia ~2000 ký tự/trang</p>
            <p>• <strong>Thủ công:</strong> Dùng <code className="bg-muted px-1 py-0.5 rounded">---</code> hoặc <code className="bg-muted px-1 py-0.5 rounded">&lt;!-- page --&gt;</code> để ngắt trang</p>
          </div>
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
            <div className="text-muted-foreground"># Chương 1</div>
            <div className="text-muted-foreground">Nội dung trang 1...</div>
            <div className="text-primary font-bold">---</div>
            <div className="text-muted-foreground"># Chương 2</div>
            <div className="text-muted-foreground">Nội dung trang 2...</div>
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="# Tên sách&#10;&#10;## Lời giới thiệu&#10;&#10;Nội dung trang 1 ở đây...&#10;&#10;---&#10;&#10;## Chương 1&#10;&#10;Nội dung trang 2..."
          rows={15}
          className="font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
