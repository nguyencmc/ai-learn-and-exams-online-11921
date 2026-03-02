import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, Target,
  BrainCircuit, CheckCircle2, XCircle, Sparkles, Loader2, RefreshCw, Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { ChoiceItem } from '../components/ChoiceItem';
import { createAttempt } from '../api';
import type { AnswerState, PracticeQuestion } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { HtmlContent } from '@/components/ui/HtmlContent';

const EXPLAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-answer`;
const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function stripHtml(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function getChoices(q: PracticeQuestion) {
  const raw = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.option_f];
  return raw
    .map((text, i) => (text ? { id: CHOICE_LABELS[i], text } : null))
    .filter(Boolean) as { id: string; text: string }[];
}

// ── Right panel ──────────────────────────────────────────────────────────────
function RightPanel({
  question,
  answer,
}: {
  question?: PracticeQuestion;
  answer?: AnswerState | null;
}) {
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
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
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
  const optMap: Record<string, string | null | undefined> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
    E: question.option_e,
    F: question.option_f,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
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
          <div className="space-y-1.5">
            {correctLetters.map((letter) => (
              <div
                key={letter}
                className="flex items-start gap-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-2.5"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {letter}
                </span>
                <HtmlContent
                  html={optMap[letter] ?? ''}
                  className="text-sm leading-relaxed text-green-900 dark:text-green-100 flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Giải thích tĩnh */}
        {question.explanation && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              💡 Giải thích
            </p>
            <div className="rounded-lg bg-muted/40 border px-3 py-3">
              <HtmlContent
                html={question.explanation}
                className="text-sm leading-relaxed text-foreground/80"
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
    </ScrollArea>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PracticeRunner() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const count = parseInt(searchParams.get('count') || '10', 10);
  const difficulty = (searchParams.get('difficulty') || 'all') as
    | 'all'
    | 'easy'
    | 'medium'
    | 'hard';
  const shuffle = searchParams.get('shuffle') !== '0';

  const { data: questions, isLoading, error } = usePracticeQuestions({
    setId: setId!,
    limit: count,
    difficulty,
    shuffle,
    enabled: !!setId,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  const currentQuestion = questions?.[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = questions ? currentIndex === questions.length - 1 : false;
  const answeredCount = Object.values(answers).filter((a) => a?.isChecked).length;

  const handleSelectAnswer = useCallback(
    (choiceId: string) => {
      if (!currentQuestion || currentAnswer?.isChecked) return;
      const isMultiSelect = isMultiSelectQuestion(currentQuestion.correct_answer);
      setAnswers((prev) => {
        const newSelected = isMultiSelect
          ? toggleMultiSelect(prev[currentQuestion.id]?.selected, choiceId)
          : choiceId;
        return {
          ...prev,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            selected: newSelected || null,
            isChecked: false,
            isCorrect: null,
            timeSpent: 0,
          },
        };
      });
    },
    [currentQuestion, currentAnswer]
  );

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || !currentAnswer?.selected || currentAnswer.isChecked) return;
    setIsChecking(true);
    const isCorrect = checkAnswerCorrect(
      currentAnswer.selected,
      currentQuestion.correct_answer
    );
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        isChecked: true,
        isCorrect,
      },
    }));
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
    if (user) {
      try {
        await createAttempt({
          user_id: user.id,
          question_id: currentQuestion.id,
          mode: 'practice',
          selected: currentAnswer.selected,
          is_correct: isCorrect,
          time_spent_sec: 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  const handleNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1)
      setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setStats({ correct: 0, wrong: 0 });
    setIsFinished(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b flex items-center px-6 gap-4">
          <Skeleton className="h-5 w-64" />
          <div className="flex-1" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[200px] border-r p-3 space-y-2">
            <Skeleton className="h-4 w-24 mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-full w-full max-w-2xl mx-auto rounded-xl" />
          </div>
          <div className="w-[260px] border-l p-4">
            <Skeleton className="h-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center px-4 space-y-3">
          <p className="text-muted-foreground">
            {questions?.length === 0
              ? 'Không có câu hỏi phù hợp'
              : 'Có lỗi xảy ra khi tải câu hỏi'}
          </p>
          <Button onClick={() => navigate(`/practice/setup/${setId}`)}>
            Quay lại thiết lập
          </Button>
        </div>
      </div>
    );
  }

  // ── Finished ─────────────────────────────────────────────────────────────
  if (isFinished) {
    const total = questions.length;
    const pct = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                pct >= 70 ? 'bg-green-500/15' : 'bg-orange-500/15'
              }`}
            >
              {pct >= 70 ? (
                <Trophy className="h-10 w-10 text-green-500" />
              ) : (
                <Target className="h-10 w-10 text-orange-500" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {pct >= 90 ? '🎉' : pct >= 70 ? '👏' : pct >= 50 ? '👍' : '💪'} Kết quả luyện tập
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {questions.length} câu · Chế độ luyện tập
              </p>
            </div>
            <div>
              <div
                className={`text-5xl font-bold mb-2 ${
                  pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}
              >
                {pct}%
              </div>
              <Progress value={pct} className="h-2 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                  <div className="text-sm text-muted-foreground">Câu đúng</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
                  <div className="text-sm text-muted-foreground">Câu sai</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {stats.wrong > 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/practice/review')}
                  className="w-full gap-2"
                >
                  <BrainCircuit className="h-4 w-4" />
                  Ôn lại {stats.wrong} câu sai
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm lại
                </Button>
                <Button className="flex-1" onClick={() => navigate('/practice')}>
                  Xong
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render vars ───────────────────────────────────────────────────────────
  const choices = currentQuestion ? getChoices(currentQuestion) : [];
  const isMultiSelect = currentQuestion
    ? isMultiSelectQuestion(currentQuestion.correct_answer)
    : false;
  const selectedAnswers =
    currentAnswer?.selected?.split(',').map((s) => s.trim().toUpperCase()) ?? [];

  const getDifficultyLabel = (d: string | null) => {
    if (d === 'easy')
      return {
        label: 'Dễ',
        cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      };
    if (d === 'hard')
      return {
        label: 'Khó',
        cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      };
    return {
      label: 'Trung bình',
      cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    };
  };
  const diff = getDifficultyLabel(currentQuestion?.difficulty ?? null);

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 h-14 border-b bg-background flex items-center px-4 gap-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0 -ml-1"
          onClick={() => navigate(`/practice/setup/${setId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm truncate max-w-[180px] sm:max-w-sm">
          Luyện tập
        </span>

        <div className="flex-1 flex justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            Câu <strong className="text-foreground">{currentIndex + 1}</strong> /{' '}
            {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground hidden sm:inline">Đúng:</span>
            <strong className="text-green-600">{stats.correct}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground hidden sm:inline">Sai:</span>
            <strong className="text-red-600">{stats.wrong}</strong>
          </span>
        </div>
      </div>

      {/* ══ 3-COLUMN BODY ════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Question navigator ─────────────────────────────────────── */}
        <div className="w-[200px] shrink-0 border-r flex flex-col bg-background">
          <div className="px-4 pt-4 pb-2.5">
            <h3 className="font-semibold text-sm text-foreground">Điều hướng câu hỏi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Nhấn vào câu để chuyển</p>
          </div>

          <div className="px-4 pb-3 space-y-2 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
              Đã trả lời (
              {Object.values(answers).filter((a) => a.isChecked && a.isCorrect).length})
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full border-2 border-red-400 bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <Flag className="w-2 h-2 text-red-500" />
              </span>
              Trả lời sai (
              {Object.values(answers).filter((a) => a.isChecked && !a.isCorrect).length})
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              Chưa làm ({questions.length - answeredCount})
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const a = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isRight = a?.isChecked && a.isCorrect;
                const isWrong = a?.isChecked && !a.isCorrect;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={[
                      'aspect-square rounded text-xs font-medium flex items-center justify-center transition-all',
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30'
                        : isRight
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 ring-1 ring-green-400/40'
                        : isWrong
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-1 ring-red-400/40'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── CENTER: Question content ──────────────────────────────────────── */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto px-8 py-7">
            {currentQuestion && (
              <>
                {/* Badges */}
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff.cls}`}
                  >
                    {diff.label}
                  </span>
                  {isMultiSelect ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                      Nhiều đáp án
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      Một đáp án
                    </span>
                  )}
                </div>

                {/* Heading */}
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Câu {currentIndex + 1}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {isMultiSelect
                    ? 'Chọn tất cả đáp án đúng từ các lựa chọn bên dưới.'
                    : 'Chọn đáp án đúng nhất từ các lựa chọn bên dưới.'}
                </p>

                {/* Question image */}
                {currentQuestion.question_image && (
                  <div className="mb-5 flex justify-center">
                    <img
                      src={currentQuestion.question_image}
                      alt="Question"
                      className="max-w-full max-h-64 rounded-lg object-contain"
                    />
                  </div>
                )}

                {/* Question text */}
                <HtmlContent
                  html={currentQuestion.question_text}
                  className="text-base text-foreground leading-relaxed mb-6"
                />

                {/* Choices */}
                <div className="space-y-2.5">
                  {choices.map((choice, index) => (
                    <ChoiceItem
                      key={choice.id}
                      id={choice.id}
                      text={choice.text}
                      label={CHOICE_LABELS[index]}
                      isSelected={selectedAnswers.includes(choice.id.toUpperCase())}
                      isCorrect={currentAnswer?.isCorrect ?? null}
                      showResult={currentAnswer?.isChecked || false}
                      correctAnswer={currentQuestion.correct_answer}
                      disabled={currentAnswer?.isChecked || false}
                      isMultiSelect={isMultiSelect}
                      onSelect={handleSelectAnswer}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Câu trước
                  </Button>

                  <div className="flex gap-2">
                    {!currentAnswer?.isChecked ? (
                      <Button
                        onClick={handleCheck}
                        disabled={!currentAnswer?.selected || isChecking}
                        className="px-8 gap-2"
                      >
                        <Check className="h-4 w-4" /> Kiểm tra
                      </Button>
                    ) : isLastQuestion ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRestart} className="gap-2">
                          <RotateCcw className="h-4 w-4" /> Làm lại
                        </Button>
                        <Button onClick={() => setIsFinished(true)}>Xem kết quả</Button>
                      </div>
                    ) : (
                      <Button onClick={handleNext} className="px-8 gap-2">
                        Câu tiếp <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className="gap-2"
                  >
                    Câu sau <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* ── RIGHT: Answer & Explanation ───────────────────────────────────── */}
        <div className="w-[260px] shrink-0 border-l flex flex-col bg-muted/5">
          <div className="h-14 flex items-center px-4 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đáp án &amp; Giải thích
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <RightPanel question={currentQuestion} answer={currentAnswer} />
          </div>
        </div>

      </div>

      {/* ══ BOTTOM PROGRESS ══════════════════════════════════════════════════ */}
      <div className="shrink-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

    </div>
  );
}
