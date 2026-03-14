import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stripHtml } from '@/lib/sanitize';
import type { PracticeQuestion } from '../types';

interface AIExplainButtonProps {
  question: PracticeQuestion;
  userAnswer: string | null;
  className?: string;
}

const EXPLAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-answer`;

export function AIExplainButton({ question, userAnswer, className }: AIExplainButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const options: Record<string, string> = {};
      if (question.option_a) options.a = stripHtml(question.option_a);
      if (question.option_b) options.b = stripHtml(question.option_b);
      if (question.option_c) options.c = stripHtml(question.option_c);
      if (question.option_d) options.d = stripHtml(question.option_d);
      if (question.option_e) options.e = stripHtml(question.option_e);
      if (question.option_f) options.f = stripHtml(question.option_f);

      const res = await fetch(EXPLAIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          question: stripHtml(question.question_text),
          options,
          correctAnswer: question.correct_answer,
          userAnswer: userAnswer ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi ${res.status}`);
      }

      const data = await res.json();
      setExplanation(data.explanation ?? 'Không có nội dung giải thích.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối AI, thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [question, userAnswer]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!explanation && !isLoading) {
        fetchExplanation();
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchExplanation();
  };

  return (
    <div className={cn('rounded-xl border border-violet-500/25 overflow-hidden', className)}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-violet-500/10 hover:bg-violet-500/15 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
            Giải thích bằng AI
          </span>
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {explanation && !isLoading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-violet-500"
              onClick={handleRetry}
              title="Tạo lại giải thích"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 py-3 bg-violet-500/5 border-t border-violet-500/15">
          {isLoading && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-muted-foreground">AI đang phân tích câu hỏi...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={handleRetry} className="shrink-0 h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Thử lại
              </Button>
            </div>
          )}

          {explanation && !isLoading && (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
