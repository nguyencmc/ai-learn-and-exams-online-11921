import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ChoiceItem } from './ChoiceItem';
import { HtmlContent } from '@/components/ui/HtmlContent';
import type { AnswerState, PracticeQuestion } from '../types';
import { isMultiSelectQuestion } from '../types';
import { getChoices, getDifficultyLabel, CHOICE_LABELS } from '../practiceUtils';

interface PracticeQuestionDisplayProps {
  question: PracticeQuestion;
  questionIndex: number;
  answer: AnswerState | null;
  isChecking: boolean;
  isLastQuestion: boolean;
  hidden: boolean;
  onSelectAnswer: (choiceId: string) => void;
  onCheck: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onFinish: () => void;
  onClickImage: (src: string) => void;
}

export function PracticeQuestionDisplay({
  question,
  questionIndex,
  answer,
  isChecking,
  isLastQuestion,
  hidden,
  onSelectAnswer,
  onCheck,
  onPrev,
  onNext,
  onRestart,
  onFinish,
  onClickImage,
}: PracticeQuestionDisplayProps) {
  const choices = getChoices(question);
  const isMultiSelect = isMultiSelectQuestion(question.correct_answer);
  const selectedAnswers =
    answer?.selected?.split(',').map((s) => s.trim().toUpperCase()) ?? [];
  const diff = getDifficultyLabel(question.difficulty ?? null);

  return (
    <div className={hidden ? 'hidden lg:block' : ''}>
      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Question Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center gap-2">
          <Badge
            variant="outline"
            className={`uppercase text-xs font-semibold ${diff.cls} border-0`}
          >
            {diff.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {isMultiSelect ? 'Nhiều đáp án' : 'Một đáp án'}
          </Badge>
        </div>

        {/* Question Content */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg sm:text-2xl font-bold">Câu {questionIndex + 1}</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            {isMultiSelect
              ? 'Chọn tất cả đáp án đúng từ các lựa chọn bên dưới.'
              : 'Chọn đáp án đúng nhất từ các lựa chọn bên dưới.'}
          </p>

          {/* Question image */}
          {question.question_image && (
            <div className="mb-4 flex justify-center">
              <img
                src={question.question_image}
                alt="Question"
                className="max-w-full max-h-52 sm:max-h-64 rounded-lg object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() => onClickImage(question.question_image!)}
              />
            </div>
          )}

          {/* Question Text */}
          <div className="bg-muted/50 rounded-xl px-4 py-4 sm:p-6 mb-5">
            <HtmlContent
              html={question.question_text}
              className="text-base sm:text-lg prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:cursor-zoom-in [&_img]:hover:opacity-80 [&_img]:transition-opacity"
              onClickImage={onClickImage}
            />
          </div>

          {/* Answer Options */}
          <div className="space-y-2.5">
            {choices.map((choice, index) => (
              <ChoiceItem
                key={choice.id}
                id={choice.id}
                text={choice.text}
                label={CHOICE_LABELS[index]}
                isSelected={selectedAnswers.includes(choice.id.toUpperCase())}
                isCorrect={answer?.isCorrect ?? null}
                showResult={answer?.isChecked || false}
                correctAnswer={question.correct_answer}
                disabled={answer?.isChecked || false}
                isMultiSelect={isMultiSelect}
                onSelect={onSelectAnswer}
                onClickImage={onClickImage}
              />
            ))}
          </div>
        </div>

        {/* Desktop Navigation Footer */}
        <div className="hidden lg:flex px-6 py-4 border-t bg-muted/30 items-center justify-between">
          <Button variant="outline" onClick={onPrev} disabled={questionIndex === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Câu trước
          </Button>
          <div className="flex gap-2">
            {!answer?.isChecked ? (
              <Button
                onClick={onCheck}
                disabled={!answer?.selected || isChecking}
                className="px-8 gap-2"
              >
                <Check className="h-4 w-4" /> Kiểm tra
              </Button>
            ) : isLastQuestion ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onRestart} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Làm lại
                </Button>
                <Button onClick={onFinish}>Xem kết quả</Button>
              </div>
            ) : (
              <Button onClick={onNext} className="px-8 gap-2">
                Câu tiếp <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onNext} disabled={isLastQuestion}>
            Câu sau <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
