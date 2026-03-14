import { CheckCircle, Flag, Circle } from "lucide-react";

interface QuestionNavigatorProps {
  questions: { id: string }[];
  answeredCount: number;
  flaggedCount: number;
  unansweredCount: number;
  getQuestionStatus: (
    questionId: string,
    index: number,
  ) => { isAnswered: boolean; isCurrent: boolean; isFlagged: boolean };
  onSelectQuestion: (index: number) => void;
}

export function QuestionNavigator({
  questions,
  answeredCount,
  flaggedCount,
  unansweredCount,
  getQuestionStatus,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  return (
    <aside className="hidden lg:block">
      <div className="bg-card border rounded-xl p-4 sticky top-24">
        <h3 className="font-semibold text-foreground mb-2">
          Điều hướng câu hỏi
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Nhấn vào câu để chuyển
        </p>

        {/* Legend */}
        <div className="flex flex-col gap-1 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">
              Đã trả lời ({answeredCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3 text-orange-500" />
            <span className="text-muted-foreground">
              Đánh dấu ({flaggedCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Chưa làm ({unansweredCount})
            </span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const { isAnswered, isCurrent, isFlagged } = getQuestionStatus(
              q.id,
              index,
            );

            return (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(index)}
                className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                  ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : isFlagged
                        ? "bg-orange-500 text-white"
                        : isAnswered
                          ? "bg-green-500/20 text-green-600 border border-green-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
