import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useCourseTest } from '@/features/courseTest/hooks/useCourseTest';
import { TestIntroScreen } from '@/features/courseTest/components/TestIntroScreen';
import { TestTakingScreen } from '@/features/courseTest/components/TestTakingScreen';
import { TestResultScreen } from '@/features/courseTest/components/TestResultScreen';
import type { CourseTestTakingProps } from '@/features/courseTest/types';

export const CourseTestTaking = ({ lessonId, onComplete }: CourseTestTakingProps) => {
  const {
    test,
    questions,
    loading,
    testState,
    currentQuestionIndex,
    answers,
    timeRemaining,
    submitting,
    showConfirmSubmit,
    result,
    previousAttempts,
    handleStartTest,
    handleSelectAnswer,
    handleSubmitTest,
    setCurrentQuestionIndex,
    setShowConfirmSubmit,
    setTestState,
    formatTime,
    getAnsweredCount,
    getOptionLabel,
    isMultipleAnswer,
  } = useCourseTest(lessonId, onComplete);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Bài học này chưa có bài test</p>
        </CardContent>
      </Card>
    );
  }

  if (testState === 'intro') {
    return (
      <TestIntroScreen
        test={test}
        questionCount={questions.length}
        previousAttempts={previousAttempts}
        onStartTest={handleStartTest}
      />
    );
  }

  if (testState === 'taking') {
    return (
      <TestTakingScreen
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        timeRemaining={timeRemaining}
        submitting={submitting}
        showConfirmSubmit={showConfirmSubmit}
        onSelectAnswer={handleSelectAnswer}
        onNavigateQuestion={setCurrentQuestionIndex}
        onShowConfirmSubmit={setShowConfirmSubmit}
        onSubmitTest={handleSubmitTest}
        formatTime={formatTime}
        getAnsweredCount={getAnsweredCount}
        getOptionLabel={getOptionLabel}
        isMultipleAnswer={isMultipleAnswer}
      />
    );
  }

  if (testState === 'result' && result) {
    return (
      <TestResultScreen
        test={test}
        questions={questions}
        result={result}
        previousAttempts={previousAttempts}
        onStartTest={handleStartTest}
        onBackToIntro={() => setTestState('intro')}
        getOptionLabel={getOptionLabel}
        isMultipleAnswer={isMultipleAnswer}
      />
    );
  }

  return null;
};
