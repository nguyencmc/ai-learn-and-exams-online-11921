import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { AIExplainButton } from '../components/AIExplainButton';
import {
  Trophy,
  Target,
  Clock,
  RotateCcw,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchExamSessionById, fetchQuestionSetById, fetchAttemptsForSession, fetchQuestionsByIds } from '../api';
import type { PracticeQuestion, PracticeAttempt } from '../types';

// ── Per-question review row ────────────────────────────────────────────────
function ReviewRow({
  question,
  attempt,
  index,
}: {
  question: PracticeQuestion;
  attempt: PracticeAttempt | undefined;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const isCorrect = attempt?.is_correct ?? false;
  const selected = attempt?.selected ?? null;

  const options: Record<string, string | null | undefined> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
    E: question.option_e,
    F: question.option_f,
  };

  const correctLetters = question.correct_answer.split(',').map((s) => s.trim().toUpperCase());
  const selectedLetters = selected?.split(',').map((s) => s.trim().toUpperCase()) ?? [];

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isCorrect ? 'border-green-500/25 bg-green-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
      {/* Row header */}
      <button
        type="button"
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-black/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={`mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-full ${isCorrect ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
          {isCorrect
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <XCircle className="h-4 w-4 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-muted-foreground">Câu {index + 1}</span>
            {!attempt && (
              <Badge variant="outline" className="text-xs h-4">Chưa trả lời</Badge>
            )}
          </div>
          <HtmlContent
            html={question.question_text}
            className="text-sm font-medium line-clamp-2"
          />
        </div>
        <div className="shrink-0 mt-0.5">
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
          {/* Options */}
          <div className="mt-3 space-y-1.5">
            {Object.entries(options).filter(([, v]) => v).map(([letter, text]) => {
              const isCorrectOpt = correctLetters.includes(letter);
              const isSelectedOpt = selectedLetters.includes(letter);
              return (
                <div
                  key={letter}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isCorrectOpt
                      ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                      : isSelectedOpt && !isCorrectOpt
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className={`shrink-0 font-semibold w-4 ${isCorrectOpt ? 'text-green-600 dark:text-green-400' : isSelectedOpt ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {letter}.
                  </span>
                  <HtmlContent html={text ?? ''} className="flex-1" />
                  {isCorrectOpt && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                  {isSelectedOpt && !isCorrectOpt && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                </div>
              );
            })}
          </div>

          {/* Static explanation */}
          {question.explanation && (
            <div className="rounded-lg bg-muted/50 border px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">💡 Giải thích</p>
              <HtmlContent html={question.explanation} className="text-sm text-muted-foreground" />
            </div>
          )}

          {/* AI Explain */}
          <AIExplainButton question={question} userAnswer={selected} />
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ExamResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['exam-session', sessionId],
    queryFn: () => fetchExamSessionById(sessionId!),
    enabled: !!sessionId,
  });

  const { data: questionSet, isLoading: setLoading } = useQuery({
    queryKey: ['question-set', session?.set_id],
    queryFn: () => fetchQuestionSetById(session!.set_id!),
    enabled: !!session?.set_id,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['session-attempts', sessionId],
    queryFn: () => fetchAttemptsForSession(sessionId!),
    enabled: !!sessionId,
  });

  const questionIds = attempts.map((a) => a.question_id);
  const { data: questions = [] } = useQuery({
    queryKey: ['session-questions', questionIds],
    queryFn: () => fetchQuestionsByIds(questionIds),
    enabled: questionIds.length > 0,
  });

  const isLoading = sessionLoading || setLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full" />
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg mb-4">Không tìm thấy kết quả thi</p>
          <Button onClick={() => navigate('/practice')}>Quay lại</Button>
        </main>
      </div>
    );
  }

  const total = session.total_questions || 0;
  const correct = session.correct_count || 0;
  const wrong = total - correct;
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPassed = scorePercent >= 50;

  const timeSpent =
    session.ended_at && session.started_at
      ? Math.floor(
          (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
        )
      : 0;
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m} phút ${sec} giây` : `${sec} giây`;
  };

  const getEmoji = () => {
    if (scorePercent >= 90) return '🎉';
    if (scorePercent >= 70) return '👏';
    if (scorePercent >= 50) return '👍';
    return '💪';
  };
  const getMessage = () => {
    if (scorePercent >= 90) return 'Xuất sắc!';
    if (scorePercent >= 80) return 'Tốt lắm!';
    if (scorePercent >= 70) return 'Khá tốt!';
    if (scorePercent >= 50) return 'Đạt yêu cầu';
    return 'Cần cố gắng thêm';
  };

  const attemptMap = new Map(attempts.map((a) => [a.question_id, a]));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/practice')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {/* Result card */}
        <Card className="mb-5 shadow-md overflow-hidden">
          <CardContent className="p-0">
            {/* Top band */}
            <div className={`px-8 pt-8 pb-6 text-center ${isPassed ? 'bg-green-500/5' : 'bg-orange-500/5'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPassed ? 'bg-green-500/15' : 'bg-orange-500/15'}`}>
                {isPassed
                  ? <Trophy className="h-10 w-10 text-green-500" />
                  : <Target className="h-10 w-10 text-orange-500" />}
              </div>
              <h2 className="text-2xl font-bold">
                {getMessage()} {getEmoji()}
              </h2>
              {questionSet && (
                <p className="text-muted-foreground mt-1 text-sm">{questionSet.title}</p>
              )}
            </div>

            {/* Score */}
            <div className="px-8 py-6 space-y-4">
              <div className="text-center">
                <div
                  className={`text-6xl font-bold mb-2 ${
                    scorePercent >= 80
                      ? 'text-green-500'
                      : scorePercent >= 50
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                >
                  {scorePercent}%
                </div>
                <p className="text-sm text-muted-foreground">{correct}/{total} câu đúng</p>
              </div>

              <Progress value={scorePercent} className="h-2.5" />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{correct}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Đúng</div>
                </div>
                <div className="rounded-xl bg-red-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{wrong}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sai</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{formatDuration(timeSpent)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Thời gian</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-6">
          {wrong > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => navigate('/practice/review')}
            >
              <BrainCircuit className="h-4 w-4" />
              Ôn lại {wrong} câu sai
            </Button>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/practice/exam-setup/${session.set_id}`)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Thi lại
            </Button>
            <Button className="flex-1" onClick={() => navigate('/practice')}>
              Xong
            </Button>
          </div>
        </div>

        {/* Review toggle */}
        {questions.length > 0 && (
          <div>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 h-auto rounded-xl border border-border/60 hover:bg-muted/50 mb-3"
              onClick={() => setShowReview((v) => !v)}
            >
              <span className="font-medium text-sm">Xem lại chi tiết từng câu</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{questions.length} câu</Badge>
                {showReview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </Button>

            {showReview && (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <ReviewRow
                    key={q.id}
                    question={q}
                    attempt={attemptMap.get(q.id)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
