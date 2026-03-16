import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIExplanation } from "@/components/exam/AIExplanation";
import { ExamPagination } from "@/components/exam/ExamPagination";
import {
  Trophy,
  Target,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  ListFilter,
} from "lucide-react";
import type { Exam, Question } from "../types";
import { OPTION_LABELS } from "../types";
import { isAnswerCorrect, getCorrectAnswers } from "../examUtils";

type FilterType = "all" | "correct" | "incorrect";

const QUESTIONS_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");

  const correctCount = questions.filter((q) =>
    isAnswerCorrect(q, answers[q.id]),
  ).length;
  const wrongCount = questions.length - correctCount;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  const getMessage = () => {
    if (scorePercent >= 90) return "Xuất sắc!";
    if (scorePercent >= 80) return "Tốt lắm!";
    if (scorePercent >= 70) return "Khá tốt!";
    if (scorePercent >= 50) return "Đạt yêu cầu";
    return "Cần cố gắng thêm";
  };

  const getEmoji = () => {
    if (scorePercent >= 90) return "🎉";
    if (scorePercent >= 70) return "👏";
    if (scorePercent >= 50) return "👍";
    return "💪";
  };

  // Build indexed questions with their original index preserved
  const indexedQuestions = useMemo(
    () =>
      questions.map((q, i) => ({
        question: q,
        originalIndex: i,
        isCorrect: isAnswerCorrect(q, answers[q.id] || []),
      })),
    [questions, answers],
  );

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (filter === "correct") return indexedQuestions.filter((q) => q.isCorrect);
    if (filter === "incorrect")
      return indexedQuestions.filter((q) => !q.isCorrect);
    return indexedQuestions;
  }, [indexedQuestions, filter]);

  // Paginate
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE,
  );

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Results Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              scorePercent >= 70
                ? "bg-green-500/15"
                : scorePercent >= 50
                  ? "bg-yellow-500/15"
                  : "bg-destructive/15"
            }`}
          >
            {scorePercent >= 50 ? (
              <Trophy
                className={`w-10 h-10 ${
                  scorePercent >= 70 ? "text-green-500" : "text-yellow-500"
                }`}
              />
            ) : (
              <Target className="w-10 h-10 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {getMessage()} {getEmoji()}
          </h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Score Section */}
        <div className="bg-card border rounded-2xl p-6 mb-6 shadow-sm">
          <div className="text-center mb-4">
            <div
              className={`text-6xl font-bold mb-1 ${
                scorePercent >= 70
                  ? "text-green-500"
                  : scorePercent >= 50
                    ? "text-yellow-500"
                    : "text-destructive"
              }`}
            >
              {scorePercent}%
            </div>
            <p className="text-sm text-muted-foreground">
              {correctCount}/{questions.length} câu đúng
            </p>
          </div>
          <Progress value={scorePercent} className="h-2.5 mb-6" />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {correctCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Câu đúng</div>
            </div>
            <div className="rounded-xl bg-red-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Câu sai</div>
            </div>
            <div className="rounded-xl bg-muted/60 p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {violationCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Vi phạm</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <Button variant="outline" onClick={() => navigate("/exams")}>
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Làm lại
          </Button>
        </div>

        {/* Review Answers Section */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          {/* Review Header with Filter */}
          <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">
                Xem lại đáp án
              </h2>
              <Badge variant="secondary" className="ml-1">
                {filteredQuestions.length} câu
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("all")}
              >
                Tất cả ({questions.length})
              </Button>
              <Button
                variant={filter === "correct" ? "default" : "outline"}
                size="sm"
                className={
                  filter === "correct"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                onClick={() => handleFilterChange("correct")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Đúng ({correctCount})
              </Button>
              <Button
                variant={filter === "incorrect" ? "default" : "outline"}
                size="sm"
                className={
                  filter === "incorrect"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
                onClick={() => handleFilterChange("incorrect")}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Sai ({wrongCount})
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="p-4 sm:p-6 space-y-4">
            {paginatedQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không có câu hỏi nào trong mục này</p>
              </div>
            ) : (
              paginatedQuestions.map(
                ({ question, originalIndex, isCorrect }) => {
                  const userAnswers = answers[question.id] || [];
                  const correctAnswerLabels = getCorrectAnswers(question);

                  return (
                    <div
                      key={question.id}
                      className="border rounded-xl overflow-hidden"
                    >
                      <div
                        className={`px-4 py-3 flex items-center gap-3 ${
                          isCorrect ? "bg-green-500/10" : "bg-destructive/10"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        )}
                        <span className="font-medium">
                          Câu {originalIndex + 1}
                        </span>
                        <Badge
                          variant={isCorrect ? "default" : "destructive"}
                          className={`ml-auto text-xs ${isCorrect ? "bg-green-600" : ""}`}
                        >
                          {isCorrect ? "Đúng" : "Sai"}
                        </Badge>
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
                            const isUserSelected =
                              userAnswers.includes(option);

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
                                    __html: sanitizeHtml(
                                      optionText as string,
                                    ),
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {question.explanation && (
                          <div className="mt-4 p-4 bg-muted/50 border rounded-lg">
                            <p className="text-sm font-semibold mb-1">
                              💡 Giải thích:
                            </p>
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
                },
              )
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(currentPage - 1) * QUESTIONS_PER_PAGE + 1}-
                  {Math.min(
                    currentPage * QUESTIONS_PER_PAGE,
                    filteredQuestions.length,
                  )}{" "}
                  / {filteredQuestions.length} câu
                </p>
                <ExamPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
