import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { HtmlContent } from '@/components/ui/HtmlContent';
import type { AnswerState, PracticeQuestion } from '../types';
import { stripHtml, getChoices } from '../practiceUtils';

const EXPLAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-answer`;

interface RightPanelProps {
  question?: PracticeQuestion;
  answer?: AnswerState | null;
  onClickImage?: (src: string) => void;
}

export function RightPanel({ question, answer, onClickImage }: RightPanelProps) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (question?.id !== prevId.current) {
      setAiText(null);
      setAiError(null);
      setAiLoading(false);
      prevId.current = question?.id ?? null;
    }
  }, [question?.id]);

  const fetchAI = useCallback(async () => {
    if (!question) return;
    setAiLoading(true);
    setAiError(null);
    setAiText(null);
    try {
      const options: Record<string, string> = {};
      getChoices(question).forEach((c) => {
        options[c.id.toLowerCase()] = stripHtml(c.text);
      });
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
          userAnswer: answer?.selected ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
      setAiText(data.explanation ?? 'Không có nội dung.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Không thể kết nối AI.');
    } finally {
      setAiLoading(false);
    }
  }, [question, answer?.selected]);

  if (!answer?.isChecked || !question) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chọn đáp án và bấm{' '}
          <strong className="text-foreground">Kiểm tra</strong>
          <br />
          để xem kết quả
        </p>
      </div>
    );
  }

  const correctLetters = question.correct_answer
    .split(',')
    .map((s) => s.trim().toUpperCase());

  return (
    <div className="space-y-4">
      {/* Result banner */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
          answer.isCorrect
            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
        }`}
      >
        {answer.isCorrect ? (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Chính xác!
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 shrink-0" /> Chưa đúng
          </>
        )}
      </div>

      {/* Đáp án đúng */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Đáp án đúng
        </p>
        <div className="flex flex-wrap gap-2">
          {correctLetters.map((letter) => (
            <span
              key={letter}
              className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center"
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Giải thích tĩnh */}
      {question.explanation && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            💡 Giải thích
          </p>
          <div className="rounded-lg bg-muted/40 border px-3 py-3 overflow-hidden">
            <HtmlContent
              html={question.explanation}
              className="text-sm leading-relaxed text-foreground/80 [&_img]:max-w-full [&_img]:w-full [&_img]:h-auto [&_img]:cursor-zoom-in [&_img]:rounded-md [&_img]:transition-opacity [&_img]:hover:opacity-80 [&_table]:w-full [&_table]:overflow-x-auto [&_pre]:overflow-x-auto [&_p]:break-words"
              onClickImage={onClickImage}
            />
          </div>
        </div>
      )}

      {/* AI */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          ✨ AI giải thích
        </p>
        {!aiText && !aiLoading && !aiError && (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500/30 dark:hover:bg-violet-500/5"
            onClick={fetchAI}
          >
            <Sparkles className="h-3.5 w-3.5" /> Giải thích bằng AI
          </Button>
        )}
        {aiLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích...
          </div>
        )}
        {aiError && (
          <div className="rounded-lg bg-red-50 dark:bg-destructive/10 px-3 py-2 text-sm text-red-600 dark:text-destructive flex items-center justify-between gap-2">
            <span className="text-xs">{aiError}</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={fetchAI}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}
        {aiText && (
          <div className="rounded-lg bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/15 px-3 py-3 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {aiText}
          </div>
        )}
      </div>
    </div>
  );
}
