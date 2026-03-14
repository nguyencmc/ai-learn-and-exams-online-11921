import { useNavigate } from "react-router-dom";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { AIExplanation } from "@/components/exam/AIExplanation";
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Exam, Question } from "../types";
import { OPTION_LABELS } from "../types";
import { isAnswerCorrect, getCorrectAnswers } from "../examUtils";

interface ExamResultsProps {
  exam: Exam;
  questions: Question[];
  answers: Record<string, string[]>;
  violationCount: number;
}

export function ExamResults({
  exam,
  questions,
  answers,
  violationCount,
}: ExamResultsProps) {
  const navigate = useNavigate();
  const correctCount = questions.filter((q) =>
    isAnswerCorrect(q, answers[q.id]),
  ).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Results Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                scorePercent >= 70
                  ? "bg-green-500/20"
                  : scorePercent >= 50
                    ? "bg-yellow-500/20"
                    : "bg-destructive/20"
              }`}
            >
              <Trophy
                className={`w-8 h-8 ${
                  scorePercent >= 70
                    ? "text-green-500"
                    : scorePercent >= 50
                      ? "text-yellow-500"
                      : "text-destructive"
                }`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Kết quả bài thi
              </h1>
              <p className="text-muted-foreground">{exam.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {scorePercent}%
            </div>
            <div className="text-sm text-muted-foreground">Điểm số</div>
          </div>
          <div className="bg-card border rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">
              {correctCount}
            </div>
            <div className="text-sm text-muted-foreground">Câu đúng</div>
          </div>
          <div className="bg-card border rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-destructive mb-2">
              {questions.length - correctCount}
            </div>
            <div className="text-sm text-muted-foreground">Câu sai</div>
          </div>
          <div className="bg-card border rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">
              {violationCount}
            </div>
            <div className="text-sm text-muted-foreground">Vi phạm</div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/exams")}>
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Làm lại
          </Button>
        </div>

        {/* Review Answers */}
        <h2 className="text-xl font-bold text-foreground mb-4">
          Xem lại đáp án
        </h2>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const userAnswers = answers[question.id] || [];
            const isCorrect = isAnswerCorrect(question, userAnswers);
            const correctAnswerLabels = getCorrectAnswers(question);

            return (
              <div
                key={question.id}
                className="bg-card border rounded-xl overflow-hidden"
              >
                <div
                  className={`px-4 py-3 flex items-center gap-3 ${
                    isCorrect ? "bg-green-500/10" : "bg-destructive/10"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="font-medium">Câu {index + 1}</span>
                </div>
                <div className="p-4">
                  <div
                    className="font-medium mb-4 prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(question.question_text),
                    }}
                  />
                  <div className="grid gap-2">
                    {OPTION_LABELS.map((option) => {
                      const optionKey =
                        `option_${option.toLowerCase()}` as keyof Question;
                      const optionText = question[optionKey];
                      if (!optionText) return null;

                      const isCorrectOption =
                        correctAnswerLabels.includes(option);
                      const isUserSelected = userAnswers.includes(option);

                      return (
                        <div
                          key={option}
                          className={`p-3 rounded-lg border-2 flex items-start gap-2 ${
                            isCorrectOption
                              ? "border-green-500 bg-green-500/10"
                              : isUserSelected
                                ? "border-destructive bg-destructive/10"
                                : "border-border"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm flex-shrink-0 ${
                              isCorrectOption
                                ? "bg-green-500 text-white"
                                : isUserSelected
                                  ? "bg-destructive text-white"
                                  : "bg-muted"
                            }`}
                          >
                            {option}
                          </span>
                          <span
                            className="prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(optionText as string),
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {question.explanation && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-1">Giải thích:</p>
                      <div
                        className="text-sm prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(question.explanation),
                        }}
                      />
                    </div>
                  )}
                  <AIExplanation
                    question={question}
                    userAnswer={userAnswers.join(", ")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
