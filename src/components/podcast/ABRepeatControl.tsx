import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Repeat, X } from "lucide-react";

interface ABRepeatControlProps {
  pointA: number | null;
  pointB: number | null;
  currentTime: number;
  duration: number;
  onSetPointA: () => void;
  onSetPointB: () => void;
  onClear: () => void;
  isActive: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const ABRepeatControl = ({
  pointA,
  pointB,
  currentTime: _currentTime,
  duration: _duration,
  onSetPointA,
  onSetPointB,
  onClear,
  isActive,
}: ABRepeatControlProps) => {
  const hasPointA = pointA !== null;
  const hasPointB = pointB !== null;

  return (
    <div className="flex items-center gap-2">
      {/* A-B Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!hasPointA) {
            onSetPointA();
          } else if (!hasPointB) {
            onSetPointB();
          } else {
            onClear();
          }
        }}
        className={cn(
          "text-white/70 hover:text-white hover:bg-white/10 gap-1 font-mono text-xs",
          isActive && "text-primary bg-primary/20"
        )}
      >
        <Repeat className="w-4 h-4" />
        {!hasPointA ? (
          "A-B"
        ) : !hasPointB ? (
          <span className="flex items-center gap-1">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">A {formatTime(pointA)}</Badge>
            <span className="text-muted-foreground">→ B?</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary">
              {formatTime(pointA)} - {formatTime(pointB)}
            </Badge>
          </span>
        )}
      </Button>

      {/* Clear button when active */}
      {isActive && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
