import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, Target,
  BrainCircuit, CheckCircle2, XCircle, Sparkles, Loader2, RefreshCw,
  Shield, Info, CheckCircle, Circle, ChevronLeft, ChevronRight,
  LayoutGrid, FileText, Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { ChoiceItem } from '../components/ChoiceItem';
import { createAttempt } from '../api';
import type { AnswerState, PracticeQuestion } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { logger } from '@/lib/logger';

const log = logger('PracticeRunner');

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

// ── Right panel (Answer & Explanation) ──────────────────────────────────────
function RightPanel({
  question,
  answer,
  onClickImage,
}: {
  question?: PracticeQuestion;
  answer?: AnswerState | null;
  onClickImage?: (src: string) => void;
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
        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${answer.isCorrect
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

      {/* Đáp án đúng — chỉ hiện chữ cái, không hiện nội dung */}
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'question' | 'explanation' | 'nav'>('question');

  const currentQuestion = questions?.[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = questions ? currentIndex === questions.length - 1 : false;
  const answeredCount = Object.values(answers).filter((a) => a?.isChecked).length;
  const progress = questions ? (answeredCount / questions.length) * 100 : 0;

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
        log.error('Error occurred', e);
      }
    }
    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  const handleNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setMobileTab('question');
    }
  }, [currentIndex, questions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setMobileTab('question');
    }
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
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <div className="h-16 border-b bg-card flex items-center px-4 gap-4">
          <Skeleton className="h-5 w-64" />
          <div className="flex-1" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[200px_1fr_280px] gap-6">
            <div className="hidden lg:block">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
            <Skeleton className="h-[600px] w-full rounded-xl" />
            <div className="hidden lg:block">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${pct >= 70 ? 'bg-green-500/15' : 'bg-orange-500/15'
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
                className={`text-5xl font-bold mb-2 ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
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

  const correctCount = Object.values(answers).filter((a) => a.isChecked && a.isCorrect).length;
  const wrongCount = Object.values(answers).filter((a) => a.isChecked && !a.isCorrect).length;
  const unansweredCount = questions.length - answeredCount;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">

      {/* Global Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* ══ TOP HEADER ══════════════════════════════════════════════════════ */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1 h-9 w-9 p-0 sm:w-auto sm:px-3"
                onClick={() => navigate(`/practice/setup/${setId}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-foreground hidden sm:block truncate max-w-[160px] lg:max-w-none text-sm">
                Luyện tập
              </h1>
            </div>

            {/* Center: counter + progress */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {currentIndex + 1} <span className="text-muted-foreground font-normal">/ {questions.length}</span>
              </span>
              {/* mini progress bar on mobile */}
              <div className="w-24 h-1 rounded-full bg-muted overflow-hidden lg:hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <strong className="text-green-600">{stats.correct}</strong>
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <strong className="text-red-600">{stats.wrong}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ 3-COLUMN BODY (desktop) ══════════════════════════════════════════ */}
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-40 lg:pb-6">
        <div className="grid lg:grid-cols-[200px_1fr_280px] gap-6">

          {/* ── LEFT SIDEBAR (desktop only) ──────────────────────────────── */}
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
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                        ${isCurrent
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

          {/* ── CENTER: Question Content ──────────────────────────────────── */}
          <main className="min-w-0">

            {/* ── MOBILE TAB BAR ─────────────────────────────────────────── */}
            <div className="lg:hidden flex rounded-xl bg-muted p-1 mb-4 gap-1">
              <button
                onClick={() => setMobileTab('question')}
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
                onClick={() => setMobileTab('explanation')}
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
                onClick={() => setMobileTab('nav')}
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

            {/* ── MOBILE: Nav tab ────────────────────────────────────────── */}
            {mobileTab === 'nav' && (
              <div className="lg:hidden bg-card border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">Câu hỏi</h3>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{correctCount} đúng</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{wrongCount} sai</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />{unansweredCount} chưa</span>
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
                        onClick={() => { setCurrentIndex(idx); setMobileTab('question'); }}
                        className={`aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                          ${isCurrent
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
                  <span className="text-xs text-muted-foreground">{answeredCount} / {questions.length} câu đã trả lời</span>
                  <Button
                    size="sm"
                    onClick={() => setIsFinished(true)}
                    disabled={answeredCount === 0}
                    className="gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Kết quả
                  </Button>
                </div>
              </div>
            )}

            {/* ── MOBILE: Explanation tab ────────────────────────────────── */}
            {mobileTab === 'explanation' && (
              <div className="lg:hidden bg-card border rounded-xl p-4 mb-4">
                <RightPanel question={currentQuestion} answer={currentAnswer} onClickImage={setLightboxSrc} />
              </div>
            )}

            {/* ── Question Card (desktop always, mobile only on 'question' tab) */}
            <div className={mobileTab !== 'question' ? 'hidden lg:block' : ''}>
              <div className="bg-card border rounded-xl overflow-hidden">
                {/* Question Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center gap-2">
                  <Badge variant="outline" className={`uppercase text-xs font-semibold ${diff.cls} border-0`}>
                    {diff.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {isMultiSelect ? 'Nhiều đáp án' : 'Một đáp án'}
                  </Badge>
                </div>

                {/* Question Content */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg sm:text-2xl font-bold">Câu {currentIndex + 1}</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {isMultiSelect
                      ? 'Chọn tất cả đáp án đúng từ các lựa chọn bên dưới.'
                      : 'Chọn đáp án đúng nhất từ các lựa chọn bên dưới.'}
                  </p>

                  {/* Question image */}
                  {currentQuestion?.question_image && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={currentQuestion.question_image}
                        alt="Question"
                        className="max-w-full max-h-52 sm:max-h-64 rounded-lg object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxSrc(currentQuestion.question_image!)}
                      />
                    </div>
                  )}

                  {/* Question Text */}
                  {currentQuestion && (
                    <div className="bg-muted/50 rounded-xl px-4 py-4 sm:p-6 mb-5">
                      <HtmlContent
                        html={currentQuestion.question_text}
                        className="text-base sm:text-lg prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:cursor-zoom-in [&_img]:hover:opacity-80 [&_img]:transition-opacity"
                        onClickImage={setLightboxSrc}
                      />
                    </div>
                  )}

                  {/* Answer Options */}
                  {currentQuestion && (
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
                          onClickImage={setLightboxSrc}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Navigation Footer */}
                <div className="hidden lg:flex px-6 py-4 border-t bg-muted/30 items-center justify-between">
                  <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Câu trước
                  </Button>
                  <div className="flex gap-2">
                    {!currentAnswer?.isChecked ? (
                      <Button onClick={handleCheck} disabled={!currentAnswer?.selected || isChecking} className="px-8 gap-2">
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
                  <Button variant="outline" onClick={handleNext} disabled={isLastQuestion}>
                    Câu sau <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </main>

          {/* ── RIGHT SIDEBAR (desktop only) ────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="space-y-4 sticky top-24">
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tiến độ</p>
                  <span className="text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {answeredCount} / {questions.length} câu đã trả lời
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
                <RightPanel question={currentQuestion} answer={currentAnswer} onClickImage={setLightboxSrc} />
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
                onClick={() => setIsFinished(true)}
                className="w-full h-12 text-base"
                size="lg"
                disabled={answeredCount === 0}
              >
                <Trophy className="w-5 h-5 mr-2" /> Xem kết quả
              </Button>
            </div>
          </aside>

        </div>
      </div>

      {/* ══ MOBILE FIXED BOTTOM ACTION BAR ══════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t safe-area-bottom">
        {/* Result banner after check */}
        {currentAnswer?.isChecked && (
          <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b ${
            currentAnswer.isCorrect
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 text-red-700 dark:text-red-400'
          }`}>
            {currentAnswer.isCorrect
              ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Chính xác! · Đáp án: <strong>{currentQuestion?.correct_answer}</strong></>
              : <><XCircle className="h-4 w-4 shrink-0" /> Chưa đúng · Đáp án: <strong>{currentQuestion?.correct_answer}</strong></>
            }
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Prev */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-10 w-10 p-0 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Main action */}
          <div className="flex-1">
            {!currentAnswer?.isChecked ? (
              <Button
                onClick={handleCheck}
                disabled={!currentAnswer?.selected || isChecking}
                className="w-full h-10 gap-2 text-sm"
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Kiểm tra
              </Button>
            ) : isLastQuestion ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRestart} className="flex-1 h-10 gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Làm lại
                </Button>
                <Button size="sm" onClick={() => setIsFinished(true)} className="flex-1 h-10 gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> Kết quả
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => { handleNext(); }}
                className="w-full h-10 gap-2 text-sm"
              >
                Câu tiếp <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={isLastQuestion}
            className="h-10 w-10 p-0 shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  );
}
