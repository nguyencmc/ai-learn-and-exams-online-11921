import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, Target,
  BrainCircuit, CheckCircle2, XCircle, Sparkles, Loader2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { QuestionCard } from '../components/QuestionCard';
import { createAttempt } from '../api';
import type { AnswerState, PracticeQuestion } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { HtmlContent } from '@/components/ui/HtmlContent';

// ── Right panel: Đáp án đúng + Giải thích ───────────────────────────────────
const EXPLAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-answer`;

function stripHtml(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function RightPanel({
  question,
  answer,
}: {
  question: PracticeQuestion | undefined;
  answer: AnswerState | null | undefined;
}) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const prevQuestionId = useRef<string | null>(null);

  // Reset AI khi chuyển câu
  useEffect(() => {
    if (question?.id !== prevQuestionId.current) {
      setAiText(null);
      setAiError(null);
      setAiLoading(false);
      prevQuestionId.current = question?.id ?? null;
    }
  }, [question?.id]);

  const fetchAI = useCallback(async () => {
    if (!question) return;
    setAiLoading(true);
    setAiError(null);
    setAiText(null);
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

  // Chưa kiểm tra → hiển thị placeholder
  if (!answer?.isChecked || !question) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chọn đáp án và bấm<br /><strong>Kiểm tra</strong> để xem kết quả
        </p>
      </div>
    );
  }

  const correctLetters = question.correct_answer.split(',').map(s => s.trim().toUpperCase());

  // Map letter → text
  const optMap: Record<string, string | null | undefined> = {
    A: question.option_a, B: question.option_b, C: question.option_c,
    D: question.option_d, E: question.option_e, F: question.option_f,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">
        {/* Kết quả */}
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm ${
          answer.isCorrect
            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
            : 'bg-red-500/10 text-red-700 dark:text-red-400'
        }`}>
          {answer.isCorrect
            ? <><CheckCircle2 className="h-5 w-5 shrink-0" /> Chính xác! Bạn đã trả lời đúng.</>
            : <><XCircle className="h-5 w-5 shrink-0" /> Chưa đúng. Xem đáp án bên dưới.</>}
        </div>

        {/* Đáp án đúng */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Đáp án đúng
          </p>
          <div className="space-y-2">
            {correctLetters.map(letter => (
              <div key={letter} className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2.5">
                <span className="shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {letter}
                </span>
                <HtmlContent html={optMap[letter] ?? ''} className="text-sm leading-relaxed flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Giải thích tĩnh */}
        {question.explanation && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              💡 Giải thích
            </p>
            <div className="rounded-xl bg-muted/60 border px-4 py-3">
              <HtmlContent html={question.explanation} className="text-sm leading-relaxed text-foreground/80" />
            </div>
          </div>
        )}

        {/* AI Giải thích */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            ✨ AI giải thích
          </p>
          {!aiText && !aiLoading && !aiError && (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 border-violet-500/30 text-violet-600 hover:bg-violet-500/5"
              onClick={fetchAI}
            >
              <Sparkles className="h-4 w-4" />
              Giải thích bằng AI
            </Button>
          )}
          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang phân tích...
            </div>
          )}
          {aiError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between gap-2">
              <span>{aiError}</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={fetchAI}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {aiText && (
            <div className="rounded-xl bg-violet-500/5 border border-violet-500/15 px-4 py-3 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {aiText}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PracticeRunner() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const count = parseInt(searchParams.get('count') || '10', 10);
  const difficulty = (searchParams.get('difficulty') || 'all') as 'all' | 'easy' | 'medium' | 'hard';
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

  const handleSelectAnswer = useCallback((choiceId: string) => {
    if (!currentQuestion || currentAnswer?.isChecked) return;
    const isMultiSelect = isMultiSelectQuestion(currentQuestion.correct_answer);
    setAnswers((prev) => {
      const currentSelected = prev[currentQuestion.id]?.selected;
      const newSelected = isMultiSelect
        ? toggleMultiSelect(currentSelected, choiceId)
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
  }, [currentQuestion, currentAnswer]);

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || !currentAnswer?.selected || currentAnswer.isChecked) return;
    setIsChecking(true);
    const isCorrect = checkAnswerCorrect(currentAnswer.selected, currentQuestion.correct_answer);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], isChecked: true, isCorrect },
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
      } catch (e) { console.error('Failed to save attempt:', e); }
    }
    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  const handleNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, questions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setStats({ correct: 0, wrong: 0 });
    setIsFinished(false);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b px-6 py-3">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 border-r p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
          <div className="w-72 border-l p-4">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-destructive mb-4">
            {questions?.length === 0 ? 'Không có câu hỏi phù hợp' : 'Có lỗi xảy ra khi tải câu hỏi'}
          </p>
          <Button onClick={() => navigate(`/practice/setup/${setId}`)}>Quay lại thiết lập</Button>
        </div>
      </div>
    );
  }

  // ── Finished screen ──
  if (isFinished) {
    const total = questions.length;
    const scorePercent = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${scorePercent >= 70 ? 'bg-green-500/15' : 'bg-orange-500/15'}`}>
              {scorePercent >= 70
                ? <Trophy className="h-10 w-10 text-green-500" />
                : <Target className="h-10 w-10 text-orange-500" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {scorePercent >= 90 ? '🎉' : scorePercent >= 70 ? '👏' : scorePercent >= 50 ? '👍' : '💪'} Kết quả luyện tập
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">{questions.length} câu · Chế độ luyện tập</p>
            </div>
            <div>
              <div className={`text-5xl font-bold mb-2 ${scorePercent >= 80 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {scorePercent}%
              </div>
              <Progress value={scorePercent} className="h-2 mb-4" />
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
                <Button variant="outline" onClick={() => navigate('/practice/review')} className="w-full gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  Ôn lại {stats.wrong} câu sai
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />Làm lại
                </Button>
                <Button className="flex-1" onClick={() => navigate('/practice')}>Xong</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.isChecked).length;

  // ── Question status helper ──
  const getQuestionStatus = (q: PracticeQuestion, idx: number) => {
    const a = answers[q.id];
    if (!a?.isChecked) return idx === currentIndex ? 'current' : 'unanswered';
    return a.isCorrect ? 'correct' : 'wrong';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-4 px-4 py-2.5">
          {/* Title / back */}
          <Button
            variant="ghost"
            size="sm"
            className="-ml-1 shrink-0 gap-1.5"
            onClick={() => navigate(`/practice/setup/${setId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-3">
            <Progress
              value={((currentIndex + 1) / questions.length) * 100}
              className="h-2 flex-1"
            />
            <span className="text-xs text-muted-foreground shrink-0">
              Câu <strong className="text-foreground">{currentIndex + 1}</strong> / {questions.length}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-muted-foreground">Đúng:</span>
              <strong className="text-green-600">{stats.correct}</strong>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-muted-foreground">Sai:</span>
              <strong className="text-red-600">{stats.wrong}</strong>
            </span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">
              Đã trả lời: <strong className="text-foreground">{answeredCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Điều hướng câu hỏi ── */}
        <div className="w-52 shrink-0 border-r flex flex-col bg-muted/20">
          <div className="px-3 pt-3 pb-2 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Điều hướng câu hỏi</p>
            <p className="text-xs text-muted-foreground">Nhấn vào câu để chuyển</p>
          </div>
          <div className="px-3 py-2 border-b border-border/50 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </span>
              <span className="text-muted-foreground">Đã trả lời ({answers && Object.values(answers).filter(a => a.isChecked && a.isCorrect).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <XCircle className="h-3 w-3 text-red-600" />
              </span>
              <span className="text-muted-foreground">Trả lời sai ({answers && Object.values(answers).filter(a => a.isChecked && !a.isCorrect).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                –
              </span>
              <span className="text-muted-foreground">Chưa làm ({questions.length - answeredCount})</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q, idx);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-all border ${
                      status === 'current'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : status === 'correct'
                        ? 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400'
                        : status === 'wrong'
                        ? 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-muted'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── CENTER: Câu hỏi + Đáp án ── */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-2xl mx-auto">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                selectedAnswer={currentAnswer?.selected || null}
                showResult={currentAnswer?.isChecked || false}
                isCorrect={currentAnswer?.isCorrect || null}
                onSelectAnswer={handleSelectAnswer}
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-5 gap-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-28"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trước
              </Button>

              <div className="flex gap-2">
                {!currentAnswer?.isChecked ? (
                  <Button
                    onClick={handleCheck}
                    disabled={!currentAnswer?.selected || isChecking}
                    className="px-8"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Kiểm tra
                  </Button>
                ) : isLastQuestion ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRestart}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Làm lại
                    </Button>
                    <Button onClick={() => setIsFinished(true)}>
                      Xem kết quả
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleNext} className="px-8">
                    Tiếp theo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={isLastQuestion}
                className="w-28"
              >
                Tiếp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* ── RIGHT: Đáp án đúng + Giải thích ── */}
        <div className="w-80 shrink-0 border-l flex flex-col bg-muted/10">
          <div className="px-4 pt-3 pb-2.5 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Đáp án & Giải thích
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <RightPanel question={currentQuestion} answer={currentAnswer} />
          </div>
        </div>

      </div>
    </div>
  );
}
