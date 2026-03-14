import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { usePracticeRunner } from '../hooks/usePracticeRunner';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { PracticeHeader } from '../components/PracticeHeader';
import { PracticeNavigator } from '../components/PracticeNavigator';
import { PracticeQuestionDisplay } from '../components/PracticeQuestionDisplay';
import { PracticeSidebar } from '../components/PracticeSidebar';
import { PracticeResults } from '../components/PracticeResults';
import {
  PracticeMobileTabBar,
  PracticeMobileNavPanel,
  PracticeMobileExplanationPanel,
  PracticeMobileBottomBar,
} from '../components/PracticeMobileBar';

export default function PracticeRunner() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const count = parseInt(searchParams.get('count') || '10', 10);
  const difficulty = (searchParams.get('difficulty') || 'all') as
    | 'all'
    | 'easy'
    | 'medium'
    | 'hard';
  const shuffle = searchParams.get('shuffle') !== '0';

  const {
    data: questions,
    isLoading,
    error,
  } = usePracticeQuestions({
    setId: setId!,
    limit: count,
    difficulty,
    shuffle,
    enabled: !!setId,
  });

  const runner = usePracticeRunner({ questions });
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
  if (runner.isFinished) {
    return (
      <PracticeResults
        questions={questions}
        stats={runner.stats}
        onRestart={runner.handleRestart}
        onNavigateReview={() => navigate('/practice/review')}
        onNavigatePractice={() => navigate('/practice')}
      />
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Global Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <PracticeHeader
        currentIndex={runner.currentIndex}
        totalQuestions={questions.length}
        progress={runner.progress}
        stats={runner.stats}
        onBack={() => navigate(`/practice/setup/${setId}`)}
      />

      {/* ══ 3-COLUMN BODY (desktop) ══════════════════════════════════════════ */}
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-40 lg:pb-6">
        <div className="grid lg:grid-cols-[200px_1fr_280px] gap-6">
          <PracticeNavigator
            questions={questions}
            answers={runner.answers}
            currentIndex={runner.currentIndex}
            correctCount={runner.correctCount}
            wrongCount={runner.wrongCount}
            unansweredCount={runner.unansweredCount}
            onSelectQuestion={runner.setCurrentIndex}
          />

          <main className="min-w-0">
            <PracticeMobileTabBar
              mobileTab={runner.mobileTab}
              currentAnswer={runner.currentAnswer}
              onSetMobileTab={runner.setMobileTab}
            />

            {runner.mobileTab === 'nav' && (
              <PracticeMobileNavPanel
                questions={questions}
                answers={runner.answers}
                currentIndex={runner.currentIndex}
                correctCount={runner.correctCount}
                wrongCount={runner.wrongCount}
                unansweredCount={runner.unansweredCount}
                answeredCount={runner.answeredCount}
                onSetCurrentIndex={runner.setCurrentIndex}
                onSetMobileTab={runner.setMobileTab}
                onFinish={() => runner.setIsFinished(true)}
              />
            )}

            {runner.mobileTab === 'explanation' && (
              <PracticeMobileExplanationPanel
                currentQuestion={runner.currentQuestion}
                currentAnswer={runner.currentAnswer}
                onClickImage={setLightboxSrc}
              />
            )}

            {runner.currentQuestion && (
              <PracticeQuestionDisplay
                question={runner.currentQuestion}
                questionIndex={runner.currentIndex}
                answer={runner.currentAnswer}
                isChecking={runner.isChecking}
                isLastQuestion={runner.isLastQuestion}
                hidden={runner.mobileTab !== 'question'}
                onSelectAnswer={runner.handleSelectAnswer}
                onCheck={runner.handleCheck}
                onPrev={runner.handlePrev}
                onNext={runner.handleNext}
                onRestart={runner.handleRestart}
                onFinish={() => runner.setIsFinished(true)}
                onClickImage={setLightboxSrc}
              />
            )}
          </main>

          <PracticeSidebar
            currentQuestion={runner.currentQuestion}
            currentAnswer={runner.currentAnswer}
            answeredCount={runner.answeredCount}
            totalQuestions={questions.length}
            progress={runner.progress}
            stats={runner.stats}
            onClickImage={setLightboxSrc}
            onFinish={() => runner.setIsFinished(true)}
          />
        </div>
      </div>

      <PracticeMobileBottomBar
        currentQuestion={runner.currentQuestion}
        currentAnswer={runner.currentAnswer}
        currentIndex={runner.currentIndex}
        isChecking={runner.isChecking}
        isLastQuestion={runner.isLastQuestion}
        onCheck={runner.handleCheck}
        onNext={runner.handleNext}
        onPrev={runner.handlePrev}
        onRestart={runner.handleRestart}
        onFinish={() => runner.setIsFinished(true)}
      />
    </div>
  );
}
