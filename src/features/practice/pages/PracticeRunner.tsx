import { useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, Target, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { QuestionCard } from '../components/QuestionCard';
import { createAttempt } from '../api';
import type { AnswerState } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';

export default function PracticeRunner() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const count = parseInt(searchParams.get('count') || '10', 10);
  const difficulty = (searchParams.get('difficulty') || 'all') as 'all' | 'easy' | 'medium' | 'hard';
  const shuffle = searchParams.get('shuffle') !== '0'; // default true

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
      let newSelected: string;
      
      if (isMultiSelect) {
        // Toggle selection for multi-select questions
        newSelected = toggleMultiSelect(currentSelected, choiceId);
      } else {
        // Single select - replace
        newSelected = choiceId;
      }
      
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

    // Update local state
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

    // Save to database if user is logged in
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
      } catch (error) {
        console.error('Failed to save attempt:', error);
      }
    }

    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  const handleNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setStats({ correct: 0, wrong: 0 });
    setIsFinished(false);
  };

  const handleFinish = () => {
    setIsFinished(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b px-6 py-3 flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">
          <Skeleton className="h-3 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-destructive mb-4">
            {questions?.length === 0
              ? 'Không có câu hỏi phù hợp với tiêu chí đã chọn'
              : 'Có lỗi xảy ra khi tải câu hỏi'}
          </p>
          <Button onClick={() => navigate(`/practice/setup/${setId}`)}>
            Quay lại thiết lập
          </Button>
        </div>
      </div>
    );
  }

  // ── Summary screen ────────────────────────────────────────────────────────
  if (isFinished) {
    const total = questions.length;
    const scorePercent = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    const getEmoji = () => {
      if (scorePercent >= 90) return '🎉';
      if (scorePercent >= 70) return '👏';
      if (scorePercent >= 50) return '👍';
      return '💪';
    };
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 px-8 space-y-6">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${scorePercent >= 70 ? 'bg-green-500/15' : 'bg-orange-500/15'}`}>
                {scorePercent >= 70
                  ? <Trophy className="h-10 w-10 text-green-500" />
                  : <Target className="h-10 w-10 text-orange-500" />}
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold">Kết quả luyện tập {getEmoji()}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {questions.length} câu · Chế độ luyện tập
                </p>
              </div>

              {/* Score */}
              <div>
                <div className={`text-5xl font-bold mb-2 ${scorePercent >= 80 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {scorePercent}%
                </div>
                <Progress value={scorePercent} className="h-2 mb-3" />
                <div className="grid grid-cols-2 gap-3 mt-4">
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

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                {stats.wrong > 0 && (
                  <Button variant="outline" onClick={() => navigate('/practice/review')}
                    className="w-full gap-2">
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
        </main>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.isChecked).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 gap-4">
          {/* Left: back */}
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 shrink-0"
            onClick={() => navigate(`/practice/setup/${setId}`)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại
          </Button>

          {/* Center: progress bar */}
          <div className="flex-1 max-w-xl">
            <Progress
              value={questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}
              className="h-2"
            />
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Đúng:</span>
              <strong className="text-green-600">{stats.correct}</strong>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Sai:</span>
              <strong className="text-red-600">{stats.wrong}</strong>
            </span>
          </div>
        </div>

        {/* Sub-bar: câu X / Y · Đã trả lời */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 text-xs text-muted-foreground border-t border-border/40">
          <span>
            Câu <span className="font-semibold text-foreground">{currentIndex + 1}</span> / {questions.length}
          </span>
          <span>
            Đã trả lời: <span className="font-semibold text-foreground">{answeredCount}</span>
          </span>
        </div>
      </div>

      {/* ── Main content — fullwidth centered ── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Question Card */}
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

        {/* ── Action bar ── */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-28"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Trước
          </Button>

          <div className="flex gap-2 justify-center">
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
                <Button onClick={handleFinish}>
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
      </main>
    </div>
  );
}
