import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HtmlContent } from "@/components/ui/HtmlContent";
import { ImageLightbox, useClickableImages } from "@/components/ui/ImageLightbox";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  explanation: string | null;
  question_order: number;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent_seconds: number;
  completed_at: string;
  answers: Record<string, string>;
  exam?: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
}

const AttemptDetail = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  useClickableImages(questionsRef, setLightboxSrc);

  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_attempts")
        .select(`
          *,
          exam:exams(id, title, slug, difficulty)
        `)
        .eq("id", attemptId)
        .maybeSingle();

      if (error) throw error;
      return data as ExamAttempt | null;
    },
    enabled: !!attemptId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["attempt-questions", attempt?.exam_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", attempt!.exam_id)
        .order("question_order", { ascending: true });

      if (error) throw error;
      return data as Question[];
    },
    enabled: !!attempt?.exam_id,
  });

  const isLoading = attemptLoading || questionsLoading;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Dễ";
      case "medium":
        return "Trung bình";
      case "hard":
        return "Khó";
      default:
        return difficulty;
    }
  };

  const getOptionLabel = (option: string) => {
    const labels: Record<string, string> = {
      A: "A",
      B: "B",
      C: "C",
      D: "D",
    };
    return labels[option] || option;
  };

  const answers = attempt?.answers as Record<string, string> || {};

  if (!attemptLoading && !attempt) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài làm</h1>
            <p className="text-muted-foreground mb-6">
              Bài làm này không tồn tại hoặc đã bị xóa
            </p>
            <Link to="/history">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại lịch sử
              </Button>
            </Link>
          </div>
        </div>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/history")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại lịch sử
          </Button>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : attempt ? (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {attempt.exam?.title || "Đề thi"}
                </h1>
                {attempt.exam?.difficulty && (
                  <Badge
                    variant="outline"
                    className={getDifficultyColor(attempt.exam.difficulty)}
                  >
                    {getDifficultyLabel(attempt.exam.difficulty)}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(attempt.completed_at), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(attempt.time_spent_seconds)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span className={`font-semibold ${getScoreColor(attempt.score)}`}>
                    {attempt.score}% ({attempt.correct_answers}/{attempt.total_questions} câu đúng)
                  </span>
                </div>
              </div>

              {attempt.exam?.slug && (
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/exam/${attempt.exam?.slug}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Xem đề thi
                  </Button>
                  <Button onClick={() => navigate(`/exam/${attempt.exam?.slug}/take`)}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Làm lại
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* Questions Review */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-full mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <div ref={questionsRef} className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                const options = [
                  { key: "A", value: question.option_a },
                  { key: "B", value: question.option_b },
                  ...(question.option_c ? [{ key: "C", value: question.option_c }] : []),
                  ...(question.option_d ? [{ key: "D", value: question.option_d }] : []),
                ];

                return (
                  <Card
                    key={question.id}
                    className={`border-2 ${
                      isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : userAnswer
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-yellow-500/30 bg-yellow-500/5"
                    }`}
                  >
                    <CardContent className="p-6">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : userAnswer
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <HtmlContent html={question.question_text} className="font-medium text-lg [&_img]:cursor-zoom-in [&_img]:rounded-md [&_img]:hover:opacity-80 [&_img]:transition-opacity" />
                        </div>
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đúng
                            </Badge>
                          ) : userAnswer ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              Sai
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Bỏ qua
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {options.map((option) => {
                          const isUserChoice = userAnswer === option.key;
                          const isCorrectOption = question.correct_answer === option.key;

                          return (
                            <div
                              key={option.key}
                              className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                                isCorrectOption
                                  ? "border-green-500 bg-green-500/10"
                                  : isUserChoice && !isCorrect
                                  ? "border-red-500 bg-red-500/10"
                                  : "border-border bg-muted/30"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                                  isCorrectOption
                                    ? "bg-green-500 text-white"
                                    : isUserChoice && !isCorrect
                                    ? "bg-red-500 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {getOptionLabel(option.key)}
                              </div>
                              <HtmlContent html={option.value} className="flex-1" />
                              {isCorrectOption && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                              {isUserChoice && !isCorrect && (
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 text-primary font-medium mb-2">
                            <FileText className="w-4 h-4" />
                            Giải thích
                          </div>
                          <HtmlContent html={question.explanation} className="text-muted-foreground [&_img]:cursor-zoom-in [&_img]:rounded-md [&_img]:hover:opacity-80 [&_img]:transition-opacity" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Không có câu hỏi nào</p>
            </div>
          )}
        </div>
      </section>
</div>
  );
};

export default AttemptDetail;
