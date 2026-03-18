import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { type ReviewQuestionCardProps, OPTION_LABELS, getOptionField, isCorrectAnswer } from './types';

export const ReviewQuestionCard = ({
  question: q,
  actualIndex,
  onToggleCorrectAnswer,
}: ReviewQuestionCardProps) => {
  const isValid = q.question_text && q.option_a && q.option_b;
  const availableOptions = OPTION_LABELS.filter(
    letter => q[getOptionField(letter)]
  );
  const correctAnswers = q.correct_answer.split(',').map(a => a.trim()).filter(Boolean);

  return (
    <div
      className={`p-4 rounded-lg border ${isValid ? 'bg-muted/30 border-border' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
        }`}
    >
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-3">
        <Badge variant={isValid ? "secondary" : "outline"} className="shrink-0 mt-0.5">
          {actualIndex + 1}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {q.question_text || '(Chưa nhập câu hỏi)'}
          </p>
          {q.question_image && (
            <img
              src={q.question_image}
              alt={`Hình minh họa câu hỏi ${actualIndex + 1}`}
              className="mt-2 max-h-32 rounded-lg border"
            />
          )}
        </div>
        {isValid ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
        )}
      </div>

      {/* Options with clickable letters */}
      <div className="grid gap-2 ml-8">
        {availableOptions.map((letter) => {
          const optionText = q[getOptionField(letter)] as string;
          const isCorrect = isCorrectAnswer(q, letter);

          return (
            <div
              key={letter}
              className={`flex items-center gap-2 p-2 rounded-md transition-colors ${isCorrect
                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                  : 'bg-muted/50 border border-transparent hover:bg-muted'
                }`}
            >
              <button
                type="button"
                onClick={() => onToggleCorrectAnswer(actualIndex, letter)}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${isCorrect
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-muted-foreground/20 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                  }`}
                title={isCorrect ? 'Click để bỏ chọn' : 'Click để chọn làm đáp án đúng'}
                aria-label={`${isCorrect ? 'Bỏ chọn' : 'Chọn'} đáp án ${letter} cho câu hỏi ${actualIndex + 1}`}
              >
                {isCorrect ? <Check className="w-4 h-4" /> : letter}
              </button>
              <span className={`text-sm flex-1 ${isCorrect ? 'font-medium' : ''}`}>
                {optionText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Correct answers indicator */}
      <div className="mt-3 ml-8 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Đáp án đúng:</span>
        <div className="flex gap-1">
          {correctAnswers.map(answer => (
            <Badge
              key={answer}
              variant="default"
              className="bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0"
            >
              {answer}
            </Badge>
          ))}
        </div>
        {correctAnswers.length > 1 && (
          <Badge variant="outline" className="text-xs">
            Nhiều đáp án
          </Badge>
        )}
      </div>
    </div>
  );
};
