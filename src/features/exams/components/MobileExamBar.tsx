import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { formatTime } from "../examUtils";

interface MobileExamBarProps {
  timeLeft: number;
  answeredCount: number;
  totalQuestions: number;
  progress: number;
  onSubmit: () => void;
}

export function MobileExamBar({
  timeLeft,
  answeredCount,
  totalQuestions,
  progress,
  onSubmit,
}: MobileExamBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4">
      <div className="flex items-center gap-3">
        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            timeLeft <= 60
              ? "bg-destructive/20 text-destructive"
              : "bg-muted"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
        </div>

        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {answeredCount}/{totalQuestions}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Submit */}
        <Button onClick={onSubmit}>Nộp bài</Button>
      </div>
    </div>
  );
}
