import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  LayoutGrid,
} from 'lucide-react';
import type { AnswerState, PracticeQuestion } from '../types';
import { RightPanel } from './RightPanel';

interface PracticeMobileBarProps {
  questions: PracticeQuestion[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  currentQuestion?: PracticeQuestion;
  currentAnswer: AnswerState | null;
  isChecking: boolean;
  isLastQuestion: boolean;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  mobileTab: 'question' | 'explanation' | 'nav';
  onSetMobileTab: (tab: 'question' | 'explanation' | 'nav') => void;
  onSetCurrentIndex: (index: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onFinish: () => void;
  onClickImage: (src: string) => void;
}

export function PracticeMobileTabBar({
  mobileTab,
  currentAnswer,
  onSetMobileTab,
}: Pick<PracticeMobileBarProps, 'mobileTab' | 'currentAnswer' | 'onSetMobileTab'>) {
  return (
    <div className="lg:hidden flex rounded-xl bg-muted p-1 mb-4 gap-1">
      <button
        onClick={() => onSetMobileTab('question')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          mobileTab === 'question'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
        Câu hỏi
      </button>
      <button
        onClick={() => onSetMobileTab('explanation')}
        disabled={!currentAnswer?.isChecked}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
          mobileTab === 'explanation'
            ? 'bg-card text-foreground shadow-sm'
            : currentAnswer?.isChecked
              ? 'text-muted-foreground'
              : 'text-muted-foreground/40 cursor-not-allowed'
        }`}
      >
        <Lightbulb className="w-3.5 h-3.5" />
        Giải thích
        {currentAnswer?.isChecked && mobileTab !== 'explanation' && (
          <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>
      <button
        onClick={() => onSetMobileTab('nav')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          mobileTab === 'nav'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Điều hướng
      </button>
    </div>
  );
}

export function PracticeMobileNavPanel({
  questions,
  answers,
  currentIndex,
  correctCount,
  wrongCount,
  unansweredCount,
  answeredCount,
  onSetCurrentIndex,
  onSetMobileTab,
  onFinish,
}: Pick<
  PracticeMobileBarProps,
  | 'questions'
  | 'answers'
  | 'currentIndex'
  | 'correctCount'
  | 'wrongCount'
  | 'unansweredCount'
  | 'answeredCount'
  | 'onSetCurrentIndex'
  | 'onSetMobileTab'
  | 'onFinish'
>) {
  return (
    <div className="lg:hidden bg-card border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">Câu hỏi</h3>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {correctCount} đúng
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {wrongCount} sai
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
            {unansweredCount} chưa
          </span>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {questions.map((q, idx) => {
          const a = answers[q.id];
          const isCurrent = idx === currentIndex;
          const isRight = a?.isChecked && a.isCorrect;
          const isWrong = a?.isChecked && !a.isCorrect;
          return (
            <button
              key={q.id}
              onClick={() => {
                onSetCurrentIndex(idx);
                onSetMobileTab('question');
              }}
              className={`aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                    : isRight
                      ? 'bg-green-500/20 text-green-700 border border-green-400/40'
                      : isWrong
                        ? 'bg-red-500/20 text-red-700 border border-red-400/40'
                        : 'bg-muted text-muted-foreground border border-border'
                }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {answeredCount} / {questions.length} câu đã trả lời
        </span>
        <Button
          size="sm"
          onClick={onFinish}
          disabled={answeredCount === 0}
          className="gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5" />
          Kết quả
        </Button>
      </div>
    </div>
  );
}

export function PracticeMobileExplanationPanel({
  currentQuestion,
  currentAnswer,
  onClickImage,
}: Pick<PracticeMobileBarProps, 'currentQuestion' | 'currentAnswer' | 'onClickImage'>) {
  return (
    <div className="lg:hidden bg-card border rounded-xl p-4 mb-4">
      <RightPanel question={currentQuestion} answer={currentAnswer} onClickImage={onClickImage} />
    </div>
  );
}

export function PracticeMobileBottomBar({
  currentQuestion,
  currentAnswer,
  currentIndex,
  isChecking,
  isLastQuestion,
  onCheck,
  onNext,
  onPrev,
  onRestart,
  onFinish,
}: Pick<
  PracticeMobileBarProps,
  | 'currentQuestion'
  | 'currentAnswer'
  | 'currentIndex'
  | 'isChecking'
  | 'isLastQuestion'
  | 'onCheck'
  | 'onNext'
  | 'onPrev'
  | 'onRestart'
  | 'onFinish'
>) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t safe-area-bottom">
      {/* Result banner after check */}
      {currentAnswer?.isChecked && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b ${
            currentAnswer.isCorrect
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 text-red-700 dark:text-red-400'
          }`}
        >
          {currentAnswer.isCorrect ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Chính xác! · Đáp án:{' '}
              <strong>{currentQuestion?.correct_answer}</strong>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 shrink-0" /> Chưa đúng · Đáp án:{' '}
              <strong>{currentQuestion?.correct_answer}</strong>
            </>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Prev */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="h-10 w-10 p-0 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Main action */}
        <div className="flex-1">
          {!currentAnswer?.isChecked ? (
            <Button
              onClick={onCheck}
              disabled={!currentAnswer?.selected || isChecking}
              className="w-full h-10 gap-2 text-sm"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Kiểm tra
            </Button>
          ) : isLastQuestion ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
                className="flex-1 h-10 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Làm lại
              </Button>
              <Button
                size="sm"
                onClick={onFinish}
                className="flex-1 h-10 gap-1.5"
              >
                <Trophy className="h-3.5 w-3.5" /> Kết quả
              </Button>
            </div>
          ) : (
            <Button onClick={onNext} className="w-full h-10 gap-2 text-sm">
              Câu tiếp <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={isLastQuestion}
          className="h-10 w-10 p-0 shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
