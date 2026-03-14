import { PodcastBookmark } from "@/features/podcasts/hooks/usePodcastBookmarks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bookmark, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarksListProps {
  bookmarks: PodcastBookmark[];
  currentTime: number;
  onSeek: (time: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const BookmarksList = ({
  bookmarks,
  currentTime,
  onSeek,
  onRemove,
  onAdd,
}: BookmarksListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Bookmark className="w-4 h-4" />
          Bookmarks ({bookmarks.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-7 text-xs"
        >
          + Thêm tại {formatTime(currentTime)}
        </Button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Chưa có bookmark nào
        </p>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {bookmarks.map((bookmark) => {
              const isActive = Math.abs(currentTime - bookmark.time_seconds) < 2;
              return (
                <div
                  key={bookmark.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer group",
                    isActive
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-transparent hover:bg-muted/50"
                  )}
                  onClick={() => onSeek(bookmark.time_seconds)}
                >
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-sm text-primary">
                    {formatTime(bookmark.time_seconds)}
                  </span>
                  <span className="text-sm flex-1 truncate">
                    {bookmark.label || "Bookmark"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(bookmark.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
