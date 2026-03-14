import { CheckCircle, XCircle, Circle } from 'lucide-react';
import type { AnswerState, PracticeQuestion } from '../types';

interface PracticeNavigatorProps {
  questions: PracticeQuestion[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  onSelectQuestion: (index: number) => void;
}

export function PracticeNavigator({
  questions,
  answers,
  currentIndex,
  correctCount,
  wrongCount,
  unansweredCount,
  onSelectQuestion,
}: PracticeNavigatorProps) {
  return (
    <aside className="hidden lg:block">
      <div className="bg-card border rounded-xl p-4 sticky top-24">
        <h3 className="font-semibold text-foreground mb-2">Điều hướng câu hỏi</h3>
        <p className="text-xs text-muted-foreground mb-4">Nhấn vào câu để chuyển</p>
        <div className="flex flex-col gap-1 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">Đúng ({correctCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-muted-foreground">Sai ({wrongCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Chưa làm ({unansweredCount})</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const a = answers[q.id];
            const isCurrent = idx === currentIndex;
            const isRight = a?.isChecked && a.isCorrect;
            const isWrong = a?.isChecked && !a.isCorrect;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(idx)}
                className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                  ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : isRight
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : isWrong
                          ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                  }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
