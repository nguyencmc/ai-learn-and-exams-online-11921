import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Question } from "../types";
import { OPTION_LABELS } from "../types";
import { isMultiAnswer } from "../examUtils";

interface QuestionDisplayProps {
  question: Question;
  questionIndex: number;
  difficulty: string | null;
  answers: Record<string, string[]>;
  flaggedQuestions: Set<string>;
  isLastQuestion: boolean;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onToggleFlag: (questionId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function QuestionDisplay({
  question,
  questionIndex,
  difficulty,
  answers,
  flaggedQuestions,
  isLastQuestion,
  onAnswerSelect,
  onToggleFlag,
  onPrev,
  onNext,
  onSubmit,
}: QuestionDisplayProps) {
  const userAnswers = answers[question.id] || [];
  const isFlagged = flaggedQuestions.has(question.id);

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Question Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3">
        {difficulty && (
          <Badge variant="outline" className="uppercase text-xs">
            {difficulty}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {isMultiAnswer(question) ? "Nhiều đáp án" : "Một đáp án"}
        </Badge>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">Câu {questionIndex + 1}</h2>
        <p className="text-muted-foreground mb-6">
          Chọn đáp án đúng nhất từ các lựa chọn bên dưới.
        </p>

        {/* Question Text */}
        <div className="bg-muted/50 rounded-xl p-6 mb-6">
          <div
            className="text-lg prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(question.question_text),
            }}
          />
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {OPTION_LABELS.map((option) => {
            const optionKey =
              `option_${option.toLowerCase()}` as keyof Question;
            const optionText = question[optionKey];
            if (!optionText) return null;

            const isSelected = userAnswers.includes(option);

            return (
              <button
                key={option}
                onClick={() => onAnswerSelect(question.id, option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {option}
                </span>
                <span
                  className="flex-1 prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(optionText as string),
                  }}
                />
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="outline" onClick={onPrev} disabled={questionIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Câu trước
        </Button>

        <Button
          variant={isFlagged ? "default" : "outline"}
          onClick={() => onToggleFlag(question.id)}
          className={isFlagged ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          <Flag className="w-4 h-4 mr-2" />
          {isFlagged ? "Bỏ đánh dấu" : "Đánh dấu"}
        </Button>

        <Button
          onClick={isLastQuestion ? onSubmit : onNext}
          className="bg-primary hover:bg-primary/90"
        >
          {isLastQuestion ? "Nộp bài" : "Câu tiếp"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
