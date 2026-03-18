import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { SubmitConfirmDialog } from './SubmitConfirmDialog';
import type { TestQuestion } from '../types';

interface TestTakingScreenProps {
  questions: TestQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string[]>;
  timeRemaining: number;
  submitting: boolean;
  showConfirmSubmit: boolean;
  onSelectAnswer: (questionId: string, option: string, isMultiple: boolean) => void;
  onNavigateQuestion: React.Dispatch<React.SetStateAction<number>>;
  onShowConfirmSubmit: (show: boolean) => void;
  onSubmitTest: () => void;
  formatTime: (seconds: number) => string;
  getAnsweredCount: () => number;
  getOptionLabel: (option: string) => string | undefined;
  isMultipleAnswer: (question: TestQuestion) => boolean;
}

export const TestTakingScreen = ({
  questions,
  currentQuestionIndex,
  answers,
  timeRemaining,
  submitting,
  showConfirmSubmit,
  onSelectAnswer,
  onNavigateQuestion,
  onShowConfirmSubmit,
  onSubmitTest,
  formatTime,
  getAnsweredCount,
  getOptionLabel,
  isMultipleAnswer,
}: TestTakingScreenProps) => {
  const currentQuestion = questions[currentQuestionIndex];
  const isMultiple = isMultipleAnswer(currentQuestion);
  const selectedAnswers = answers[currentQuestion.id] || [];

  const availableOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(opt => {
    const key = getOptionLabel(opt) as keyof TestQuestion;
    return currentQuestion[key];
  });

  return (
    <div className="space-y-4">
      {/* Header with timer and progress */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 font-mono text-lg ${
                timeRemaining < 60 ? 'text-red-500 animate-pulse' :
                timeRemaining < 300 ? 'text-orange-500' : ''
              }`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
              <Badge variant="outline">
                {getAnsweredCount()}/{questions.length} đã trả lời
              </Badge>
            </div>
            <Button
              onClick={() => onShowConfirmSubmit(true)}
              disabled={submitting}
            >
              Nộp bài
            </Button>
          </div>
          <Progress
            value={(currentQuestionIndex + 1) / questions.length * 100}
            className="mt-3 h-1"
          />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </Badge>
              {isMultiple && (
                <Badge variant="outline" className="ml-2 mb-2">
                  Chọn nhiều đáp án
                </Badge>
              )}
              <CardTitle className="text-lg font-medium leading-relaxed">
                <HtmlContent html={currentQuestion.question_text} />
              </CardTitle>
            </div>
          </div>
          {currentQuestion.question_image && (
            <img
              src={currentQuestion.question_image}
              alt={`Hình minh họa câu hỏi ${currentQuestionIndex + 1}`}
              className="mt-4 max-w-full rounded-lg"
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isMultiple ? (
            <div className="space-y-3">
              {availableOptions.map(opt => {
                const key = getOptionLabel(opt) as keyof TestQuestion;
                const optionText = currentQuestion[key] as string;
                const isSelected = selectedAnswers.includes(opt);

                return (
                  <label
                    key={opt}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectAnswer(currentQuestion.id, opt, true)}
                    />
                    <span className="font-medium text-primary">{opt}.</span>
                    <span className="flex-1">{optionText}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <RadioGroup
              value={selectedAnswers[0] || ''}
              onValueChange={(value) => onSelectAnswer(currentQuestion.id, value, false)}
              className="space-y-3"
            >
              {availableOptions.map(opt => {
                const key = getOptionLabel(opt) as keyof TestQuestion;
                const optionText = currentQuestion[key] as string;

                return (
                  <label
                    key={opt}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAnswers[0] === opt
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={opt} id={`opt-${opt}`} />
                    <span className="font-medium text-primary">{opt}.</span>
                    <span className="flex-1">{optionText}</span>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => onNavigateQuestion(prev => prev - 1)}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Câu trước
        </Button>

        {/* Question dots */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-md">
          {questions.map((q, index) => {
            const hasAnswer = (answers[q.id] || []).length > 0;
            return (
              <button
                key={q.id}
                onClick={() => onNavigateQuestion(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : hasAnswer
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigateQuestion(prev => prev + 1)}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Câu sau
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <SubmitConfirmDialog
        open={showConfirmSubmit}
        onOpenChange={onShowConfirmSubmit}
        answeredCount={getAnsweredCount()}
        totalQuestions={questions.length}
        submitting={submitting}
        onSubmit={onSubmitTest}
      />
    </div>
  );
};
