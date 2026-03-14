import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useExamData, useExamAnswers, useExamTimer, useExamSubmission, useExamProctoring } from '@/features/exams/hooks';
import { MAX_GUEST_QUESTIONS } from '@/features/exams/types';
import {
  ExamHeader,
  QuestionNavigator,
  QuestionDisplay,
  ProgressSidebar,
  MobileExamBar,
  SubmitDialog,
  ExamResults,
  GuestAccessBanner,
} from '@/features/exams/components';

const ExamTaking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isPracticeMode = searchParams.get('type') === 'practice';
  const isGuest = !user;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // --- Data fetching ---
  const { exam, questions: allQuestions, isLoading } = useExamData({
    slug,
    isPracticeMode,
  });

  // Limit questions for non-authenticated users
  const questions =
    isGuest && allQuestions.length > MAX_GUEST_QUESTIONS
      ? allQuestions.slice(0, MAX_GUEST_QUESTIONS)
      : allQuestions;
  const totalQuestionsInExam = allQuestions.length;
  const isLimitedAccess = isGuest && totalQuestionsInExam > MAX_GUEST_QUESTIONS;

  // --- Answer management ---
  const {
    currentQuestionIndex,
    currentQuestion,
    answers,
    flaggedQuestions,
    answeredCount,
    flaggedCount,
    unansweredCount,
    progress,
    isLastQuestion,
    handleAnswerSelect,
    toggleFlag,
    goToQuestion,
    goToPrev,
    goToNext,
    getQuestionStatus,
  } = useExamAnswers(questions);

  // --- Proctoring ---
  const proctoring = useExamProctoring({
    examId: exam?.id || '',
    userId: user?.id || '',
    enabled: !!user && !!exam?.id && !isSubmitted,
    snapshotInterval: 30000,
    onViolation: (event) => {
      toast.warning(
        `Vi phạm: ${event.type === 'tab_switch' ? 'Chuyển tab' : 'Mất focus cửa sổ'}`,
        { description: 'Hành vi này đã được ghi nhận' },
      );
    },
  });

  // Start proctoring session
  useEffect(() => {
    if (exam?.id && user?.id && !isSubmitted) {
      proctoring.startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, user?.id, isSubmitted]);

  // --- Submission ---
  const { submit } = useExamSubmission({
    exam,
    questions,
    answers,
    userId: user?.id,
    isPracticeMode,
    endProctoringSession: proctoring.endSession,
  });

  const handleSubmit = useCallback(async () => {
    setIsSubmitted(true);
    setShowSubmitDialog(false);
    await submit();
  }, [submit]);

  // --- Timer ---
  const onTimeUp = useCallback(() => {
    setIsSubmitted(true);
    submit();
  }, [submit]);

  const { timeLeft, durationSeconds } = useExamTimer({
    durationMinutes: exam?.duration_minutes,
    enabled: !isSubmitted,
    onTimeUp,
  });

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Không tìm thấy đề thi
          </h1>
          <Link to="/exams">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Results screen ---
  if (isSubmitted) {
    return (
      <ExamResults
        exam={exam}
        questions={questions}
        answers={answers}
        violationCount={proctoring.violationCount}
      />
    );
  }

  // --- Main exam taking screen ---
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      <ExamHeader
        title={exam.title}
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        userEmail={user?.email}
        proctoring={proctoring}
      />

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
          <QuestionNavigator
            questions={questions}
            answeredCount={answeredCount}
            flaggedCount={flaggedCount}
            unansweredCount={unansweredCount}
            getQuestionStatus={getQuestionStatus}
            onSelectQuestion={goToQuestion}
          />

          <main className="min-w-0">
            {currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                difficulty={exam.difficulty}
                answers={answers}
                flaggedQuestions={flaggedQuestions}
                isLastQuestion={isLastQuestion}
                onAnswerSelect={handleAnswerSelect}
                onToggleFlag={toggleFlag}
                onPrev={goToPrev}
                onNext={goToNext}
                onSubmit={() => setShowSubmitDialog(true)}
              />
            )}

            {isLimitedAccess && (
              <GuestAccessBanner totalQuestionsInExam={totalQuestionsInExam} />
            )}
          </main>

          <ProgressSidebar
            timeLeft={timeLeft}
            durationSeconds={durationSeconds}
            answeredCount={answeredCount}
            totalQuestions={questions.length}
            flaggedCount={flaggedCount}
            progress={progress}
            proctoring={proctoring}
            onSubmit={() => setShowSubmitDialog(true)}
          />
        </div>
      </div>

      <MobileExamBar
        timeLeft={timeLeft}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        progress={progress}
        onSubmit={() => setShowSubmitDialog(true)}
      />

      <SubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedCount}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default ExamTaking;
