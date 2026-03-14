import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CameraPreview } from "@/components/exam/CameraPreview";
import { Info, Send } from "lucide-react";
import { formatTime } from "../examUtils";

interface ProgressSidebarProps {
  timeLeft: number;
  durationSeconds: number;
  answeredCount: number;
  totalQuestions: number;
  flaggedCount: number;
  progress: number;
  proctoring: {
    cameraEnabled: boolean;
    cameraStream: MediaStream | null;
    violationCount: number;
    isProcessing: boolean;
    startCamera: () => void;
    stopCamera: () => void;
  };
  onSubmit: () => void;
}

export function ProgressSidebar({
  timeLeft,
  durationSeconds,
  answeredCount,
  totalQuestions,
  flaggedCount,
  progress,
  proctoring,
  onSubmit,
}: ProgressSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4 sticky top-24">
        {/* Timer Card */}
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Thời gian còn lại
          </p>
          <div
            className={`text-4xl font-mono font-bold text-center py-4 ${
              timeLeft <= 60
                ? "text-destructive"
                : timeLeft <= 300
                  ? "text-orange-500"
                  : "text-foreground"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <Progress
            value={(timeLeft / durationSeconds) * 100}
            className="h-2"
          />
        </div>

        {/* Progress Card */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Tiến độ
            </p>
            <span className="text-lg font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 mb-3" />
          <p className="text-sm text-muted-foreground">
            {answeredCount} / {totalQuestions} câu đã trả lời
          </p>
          {flaggedCount > 0 && (
            <p className="text-sm text-orange-500 mt-1">
              {flaggedCount} câu đánh dấu xem lại
            </p>
          )}
        </div>

        {/* Camera Card */}
        <CameraPreview
          cameraEnabled={proctoring.cameraEnabled}
          cameraStream={proctoring.cameraStream}
          violationCount={proctoring.violationCount}
          isProcessing={proctoring.isProcessing}
          onToggleCamera={
            proctoring.cameraEnabled
              ? proctoring.stopCamera
              : proctoring.startCamera
          }
        />

        {/* Info Card */}
        <div className="bg-muted/50 border rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Bạn có thể quay lại bất kỳ câu hỏi nào bằng cách sử dụng bảng
              điều hướng bên trái. Đáp án được tự động lưu.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          className="w-full h-12 text-base"
          size="lg"
        >
          <Send className="w-5 h-5 mr-2" />
          Nộp bài
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Bằng việc nộp bài, bạn xác nhận đã hoàn thành và sẵn sàng kết thúc
          bài thi.
        </p>
      </div>
    </aside>
  );
}
