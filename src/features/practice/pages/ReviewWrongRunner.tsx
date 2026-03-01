import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  AlertCircle,
  BrainCircuit,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewWrong } from '../hooks/useReviewWrong';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { createAttempt } from '../api';
import type { AnswerState } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { toast } from 'sonner';

export default function ReviewWrongRunner() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { questions, isLoading, error, wrongCount, markAsMastered } = useReviewWrong();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, mastered: 0 });
  // Track câu đã "mastered" để ẩn khỏi danh sách hiện tại
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  // Lọc câu chưa "mastered"
  const activeQuestions = useMemo(
    () => questions.filter((q) => !masteredIds.has(q.id)),
    [questions, masteredIds]
  );

  const currentQuestion = activeQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion =
    activeQuestions.length > 0 ? currentIndex === activeQuestions.length - 1 : false;

  const handleSelectAnswer = useCallback(
    (choiceId: string) => {
      if (!currentQuestion || currentAnswer?.isChecked) return;
      const isMultiSelect = isMultiSelectQuestion(currentQuestion.correct_answer);
      setAnswers((prev) => {
        const currentSelected = prev[currentQuestion.id]?.selected ?? null;
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
    },
    [currentQuestion, currentAnswer]
  );

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || !currentAnswer?.selected || currentAnswer.isChecked) return;
    setIsChecking(true);
    // Fix: dùng checkAnswerCorrect để hỗ trợ multi-select
    const isCorrect = checkAnswerCorrect(currentAnswer.selected, currentQuestion.correct_answer);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], isChecked: true, isCorrect },
    }));
    setStats((prev) => ({
      ...prev,
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
      } catch (err) {
        console.error('Failed to save attempt:', err);
      }
    }
    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  /** Đánh dấu câu đang xem là "Đã nhớ" — xóa khỏi wrong list */
  const handleMarkMastered = useCallback(async () => {
    if (!currentQuestion) return;
    setIsMastering(true);
    try {
      await markAsMastered(currentQuestion.id);
      setMasteredIds((prev) => new Set([...prev, currentQuestion.id]));
      setStats((prev) => ({ ...prev, mastered: prev.mastered + 1 }));
      toast.success('Đã đánh dấu là nhớ rồi 🎉');
      // Nếu đang ở câu cuối thì lùi lại
      setCurrentIndex((prev) =>
        prev >= activeQuestions.length - 1 ? Math.max(0, prev - 1) : prev
      );
    } catch {
      toast.error('Không thể cập nhật, thử lại');
    } finally {
      setIsMastering(false);
    }
  }, [currentQuestion, markAsMastered, activeQuestions.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < activeQuestions.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, activeQuestions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setStats({ correct: 0, wrong: 0, mastered: 0 });
    setMasteredIds(new Set());
  };

  // ── Auth check ─────────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg mb-4">Bạn cần đăng nhập để xem lại câu sai</p>
          <Button onClick={() => navigate('/auth?redirect=/practice/review')}>Đăng nhập</Button>
        </main>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
          <Button variant="link" onClick={() => navigate('/practice')}>Quay lại</Button>
        </main>
      </div>
    );
  }

  // ── Empty / All mastered ────────────────────────────────────────────────
  if (activeQuestions.length === 0) {
    const allMastered = masteredIds.size > 0 && masteredIds.size === wrongCount;
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/practice')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              {allMastered ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Tuyệt vời! 🎉</h2>
                  <p className="text-muted-foreground">
                    Bạn đã đánh dấu tất cả {masteredIds.size} câu là "Đã nhớ".<br />
                    Danh sách câu sai đã được dọn sạch!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Không có câu sai!</h2>
                  <p className="text-muted-foreground">
                    Bạn chưa có câu nào trả lời sai hoặc đã ôn lại hết rồi.
                  </p>
                </>
              )}

              {(stats.correct > 0 || stats.wrong > 0 || stats.mastered > 0) && (
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm max-w-xs mx-auto">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                    <div className="text-muted-foreground text-xs">Đúng</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
                    <div className="text-muted-foreground text-xs">Sai</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold text-primary">{stats.mastered}</div>
                    <div className="text-muted-foreground text-xs">Đã nhớ</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-4 flex-wrap">
                {wrongCount > masteredIds.size && (
                  <Button variant="outline" onClick={handleRestart}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Làm lại
                  </Button>
                )}
                <Button onClick={() => navigate('/practice')}>Luyện tập tiếp</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ── Main runner ─────────────────────────────────────────────────────────
  const checkedCount = Object.values(answers).filter((a) => a.isChecked).length;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/practice')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Ôn lại câu sai</h1>
            <Badge variant="outline">{activeQuestions.length} câu</Badge>
          </div>
          <div className="w-20" />
        </div>

        {/* Progress */}
        <ProgressBar
          current={currentIndex + 1}
          total={activeQuestions.length}
          answered={checkedCount}
          className="mb-6"
        />

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Đúng: <strong>{stats.correct}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Sai: <strong>{stats.wrong}</strong></span>
          </div>
          {stats.mastered > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Đã nhớ: <strong>{stats.mastered}</strong></span>
            </div>
          )}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={activeQuestions.length}
            selectedAnswer={currentAnswer?.selected ?? null}
            showResult={currentAnswer?.isChecked ?? false}
            isCorrect={currentAnswer?.isCorrect ?? null}
            onSelectAnswer={handleSelectAnswer}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-24"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Trước
          </Button>

          <div className="flex gap-2 flex-wrap justify-center">
            {!currentAnswer?.isChecked ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkMastered}
                  disabled={isMastering}
                  className="gap-1.5 text-primary border-primary/40 hover:bg-primary/5"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Đã nhớ rồi
                </Button>
                <Button
                  onClick={handleCheck}
                  disabled={!currentAnswer?.selected || isChecking}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Kiểm tra
                </Button>
              </>
            ) : isLastQuestion ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm lại
                </Button>
                <Button onClick={() => navigate('/practice')}>Hoàn thành</Button>
              </div>
            ) : (
              <>
                {currentAnswer?.isCorrect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkMastered}
                    disabled={isMastering}
                    className="gap-1.5 text-primary border-primary/40 hover:bg-primary/5"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Đã nhớ rồi
                  </Button>
                )}
                <Button onClick={handleNext}>
                  Tiếp theo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isLastQuestion}
            className="w-24"
          >
            Tiếp
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
