import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Info } from 'lucide-react';
import type { AnswerState, PracticeQuestion } from '../types';
import { RightPanel } from './RightPanel';

interface PracticeSidebarProps {
  currentQuestion?: PracticeQuestion;
  currentAnswer?: AnswerState | null;
  answeredCount: number;
  totalQuestions: number;
  progress: number;
  stats: { correct: number; wrong: number };
  onClickImage: (src: string) => void;
  onFinish: () => void;
}

export function PracticeSidebar({
  currentQuestion,
  currentAnswer,
  answeredCount,
  totalQuestions,
  progress,
  stats,
  onClickImage,
  onFinish,
}: PracticeSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4 sticky top-24">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Tiến độ</p>
            <span className="text-lg font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 mb-3" />
          <p className="text-sm text-muted-foreground">
            {answeredCount} / {totalQuestions} câu đã trả lời
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Kết quả</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
              <div className="text-xs text-muted-foreground">Câu đúng</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
              <div className="text-xs text-muted-foreground">Câu sai</div>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Đáp án & Giải thích
          </p>
          <RightPanel
            question={currentQuestion}
            answer={currentAnswer}
            onClickImage={onClickImage}
          />
        </div>
        <div className="bg-muted/50 border rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Bạn có thể quay lại bất kỳ câu hỏi nào bằng bảng điều hướng bên trái.
            </p>
          </div>
        </div>
        <Button
          onClick={onFinish}
          className="w-full h-12 text-base"
          size="lg"
          disabled={answeredCount === 0}
        >
          <Trophy className="w-5 h-5 mr-2" /> Xem kết quả
        </Button>
      </div>
    </aside>
  );
}
