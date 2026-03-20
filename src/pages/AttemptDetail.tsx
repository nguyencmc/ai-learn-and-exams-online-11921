import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HtmlContent } from "@/components/ui/HtmlContent";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { AIExplanation } from "@/components/exam/AIExplanation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCcw,
  MinusCircle,
  BookOpen,
  Loader2,
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

const PASS_THRESHOLD = 70;

export default function AttemptDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [creatingPractice, setCreatingPractice] = useState(false);

  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_attempts")
        .select(`
          *,
          exam:exams(id, title, slug, difficulty)
        `)
        .eq("id", attemptId!)
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "hard":
        return "bg-red-500/10 text-red-600 border-red-500/20";
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
    const labels: Record<string, string> = { A: "A", B: "B", C: "C", D: "D" };
    return labels[option] || option;
  };

  const getQuestionStateClass = (userAnswer: string | undefined, correctAnswer: string) => {
    if (!userAnswer) return "bg-muted text-muted-foreground hover:bg-muted/80";
    if (userAnswer === correctAnswer) {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25";
    }
    return "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25";
  };

  const answers = (attempt?.answers as Record<string, string>) || {};

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

  // Calculate stats
  const total = attempt?.total_questions || 0;
  const correct = attempt?.correct_answers || 0;
  const answeredCount = Math.min(Object.keys(answers).length, total);
  const unanswered = Math.max(total - answeredCount, 0);
  const wrong = Math.max(answeredCount - correct, 0);
  const scorePercent = attempt?.score || 0;
  const isPassed = scorePercent >= PASS_THRESHOLD;

  const currentQuestion = questions?.[selectedQuestionIndex];

  // Get wrong + unanswered questions for practice
  const wrongAndUnansweredQuestions = questions?.filter((q) => {
    const userAnswer = answers[q.id];
    return !userAnswer || userAnswer !== q.correct_answer;
  }) || [];

  const handleCreatePractice = async () => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để tạo bài luyện tập");
      return;
    }
    if (wrongAndUnansweredQuestions.length === 0) return;

    setCreatingPractice(true);
    try {
      const examTitle = attempt?.exam?.title || "Đề thi";
      const title = `Ôn tập câu sai - ${examTitle}`;
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();

      // 1. Create question_set
      const { data: newSet, error: setError } = await supabase
        .from("question_sets")
        .insert({
          title,
          slug,
          description: `Bộ đề ôn tập ${wrongAndUnansweredQuestions.length} câu sai/chưa làm từ bài thi "${examTitle}"`,
          level: attempt?.exam?.difficulty || "medium",
          is_published: false,
          question_count: wrongAndUnansweredQuestions.length,
          creator_id: user.id,
        })
        .select()
        .single();

      if (setError) throw setError;

      // 2. Insert wrong/unanswered questions as practice_questions
      const practiceQuestions = wrongAndUnansweredQuestions.map((q, index) => ({
        set_id: newSet.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        question_order: index + 1,
        creator_id: user.id,
      }));

      const { error: questionsError } = await supabase
        .from("practice_questions")
        .insert(practiceQuestions);

      if (questionsError) throw questionsError;

      toast.success(
        `Đã tạo bộ đề luyện tập ${wrongAndUnansweredQuestions.length} câu thành công!`,
      );
      navigate(`/practice/setup/${newSet.id}`);
    } catch (error: any) {
      console.error("Error creating practice set:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo bộ đề luyện tập");
    } finally {
      setCreatingPractice(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2.5 sm:h-14">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl"
              onClick={() => navigate("/history")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="leading-tight">
              <h1 className="text-sm font-bold">Lịch sử bài làm</h1>
              {attempt?.exam && (
                <p className="text-[11px] text-muted-foreground">
                  {attempt.exam.title}
                </p>
              )}
            </div>
          </div>
          {attempt?.exam?.slug && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 sm:px-4 rounded-xl gap-1.5 text-xs flex-1 sm:flex-none"
                onClick={() => navigate(`/exam/${attempt.exam?.slug}`)}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">Xem đề thi</span>
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 sm:px-4 rounded-xl gap-1.5 text-xs flex-1 sm:flex-none"
                onClick={() => navigate(`/exam/${attempt.exam?.slug}/take`)}
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span className="truncate">Làm lại</span>
              </Button>
              {wrongAndUnansweredQuestions.length > 0 && user && (
                <Button
                  size="sm"
                  className="h-8 px-3 sm:px-4 rounded-xl gap-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex-1 sm:flex-none"
                  onClick={handleCreatePractice}
                  disabled={creatingPractice}
                >
                  {creatingPractice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">Luyện tập câu sai</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {isLoading ? (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            <Skeleton className="h-[600px] rounded-2xl" />
            <Skeleton className="h-[600px] rounded-2xl" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr] gap-4 lg:gap-6 items-start">
            {/* ── Left Column (30%): Info, Stats, grid ── */}
            <div className="hidden lg:block sticky top-20 bg-background rounded-2xl border border-border/50 p-5 shadow-sm space-y-6">
              {/* Exam Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-base leading-tight">
                    {attempt?.exam?.title}
                  </h2>
                  {attempt?.exam?.difficulty && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 shrink-0 ${getDifficultyColor(
                        attempt.exam.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(attempt.exam.difficulty)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {attempt?.completed_at &&
                      format(new Date(attempt.completed_at), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(attempt?.time_spent_seconds || 0)}
                  </div>
                </div>
              </div>

              {/* Pass/Fail % */}
              <div className="flex items-center gap-4 py-3 border-y border-border/50">
                <div
                  className={`flex-1 shrink-0 px-3 py-2 rounded-xl border text-center ${
                    isPassed
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                  }`}
                >
                  <div className="text-2xl font-black">{scorePercent}%</div>
                  <div className="text-[10px] font-bold tracking-wide mt-0.5 flex items-center justify-center gap-1">
                    {isPassed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> ĐẠT
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> CHƯA ĐẠT
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Đúng</span>
                    <span>{correct}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-red-600 dark:text-red-400">
                    <span>Sai</span>
                    <span>{wrong}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                    <span>Chưa làm</span>
                    <span>{unanswered}</span>
                  </div>
                </div>
              </div>

              {/* Question list (4 columns) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                    Danh sách câu hỏi
                  </p>
                  <span className="text-xs font-semibold">{total} câu</span>
                </div>
                  <div className="grid grid-cols-4 gap-2">
                  {questions?.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isActive = selectedQuestionIndex === idx;

                    const bgClass = getQuestionStateClass(userAnswer, q.correct_answer);

                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuestionIndex(idx)}
                        className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                          isActive
                            ? "border-primary shadow-md scale-105 opacity-100"
                            : "border-transparent opacity-80"
                        } ${bgClass}`}
                      >
                        <span className="text-[13px]">{idx + 1}</span>
                        {/* Hiển thị đáp án đúng bên trong ô */}
                        <span className="text-[9px] opacity-70 leading-none mt-0.5">
                          {q.correct_answer}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ── Right Column (70%): Details ── */}
            <div className="space-y-4">
              <div className="lg:hidden bg-background rounded-2xl border border-border/50 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex-1 px-3 py-2.5 rounded-xl border ${
                      isPassed
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    <div className="text-xl font-black leading-none">{scorePercent}%</div>
                    <div className="text-[10px] font-bold tracking-wide mt-1 flex items-center gap-1">
                      {isPassed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> ĐẠT
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> CHƯA ĐẠT
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center flex-1">
                    <div className="rounded-lg bg-emerald-500/10 py-2">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{correct}</div>
                      <div className="text-[10px] text-muted-foreground">Đúng</div>
                    </div>
                    <div className="rounded-lg bg-red-500/10 py-2">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">{wrong}</div>
                      <div className="text-[10px] text-muted-foreground">Sai</div>
                    </div>
                    <div className="rounded-lg bg-muted py-2">
                      <div className="text-sm font-bold">{unanswered}</div>
                      <div className="text-[10px] text-muted-foreground">Chưa làm</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {attempt?.completed_at &&
                      format(new Date(attempt.completed_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(attempt?.time_spent_seconds || 0)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                      Danh sách câu hỏi
                    </p>
                    <span className="text-xs font-semibold">{total} câu</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                    {questions?.map((q, idx) => {
                      const userAnswer = answers[q.id];
                      const bgClass = getQuestionStateClass(userAnswer, q.correct_answer);
                      const isActive = selectedQuestionIndex === idx;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuestionIndex(idx)}
                          className={`h-10 min-w-10 px-2 rounded-lg flex items-center justify-center text-xs font-bold border transition-all snap-start ${
                            isActive
                              ? "border-primary shadow-md opacity-100"
                              : "border-transparent opacity-80"
                          } ${bgClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-2xl border border-border/50 shadow-sm min-h-[600px]">
              {!currentQuestion ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chọn một câu hỏi để xem chi tiết
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Header of right col */}
                  <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Câu</span>
                      {selectedQuestionIndex + 1}
                    </h3>
                    {(() => {
                      const ans = answers[currentQuestion.id];
                      if (!ans) {
                        return (
                          <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                            <MinusCircle className="w-3.5 h-3.5 mr-1.5" /> Chưa làm
                          </Badge>
                        );
                      }
                      if (ans === currentQuestion.correct_answer) {
                        return (
                          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Trả lời đúng
                          </Badge>
                        );
                      }
                      return (
                        <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/15 border-red-500/20">
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Trả lời sai
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6 flex-1">
                    {/* Question text */}
                    <div className="text-[15px] font-medium leading-relaxed">
                      <HtmlContent
                        html={currentQuestion.question_text}
                        onClickImage={setLightboxSrc}
                        className="[&_img]:max-h-64 [&_img]:rounded-xl [&_img]:mx-auto [&_p]:mb-2 last:[&_p]:mb-0"
                      />
                    </div>

                    {/* Options list */}
                    <div className="space-y-2.5">
                      {[
                        { key: "A", value: currentQuestion.option_a },
                        { key: "B", value: currentQuestion.option_b },
                        ...(currentQuestion.option_c
                          ? [{ key: "C", value: currentQuestion.option_c }]
                          : []),
                        ...(currentQuestion.option_d
                          ? [{ key: "D", value: currentQuestion.option_d }]
                          : []),
                      ].map((opt) => {
                        const isCorrectOption =
                          currentQuestion.correct_answer === opt.key;
                        const isUserChoice =
                          answers[currentQuestion.id] === opt.key;

                        let ringClass = "border-border/40 bg-muted/20"; // Normal
                        if (isCorrectOption) {
                          ringClass = "border-emerald-500/40 bg-emerald-500/10";
                        } else if (isUserChoice) {
                          ringClass = "border-red-500/40 bg-red-500/10";
                        }

                        return (
                          <div
                            key={opt.key}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${ringClass}`}
                          >
                            <div
                              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                isCorrectOption
                                  ? "bg-emerald-500 text-white"
                                  : isUserChoice
                                  ? "bg-red-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {getOptionLabel(opt.key)}
                            </div>
                            <HtmlContent
                              html={opt.value}
                              className="flex-1 mt-1 text-sm leading-snug [&_p]:mb-0"
                            />
                            {isCorrectOption && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            {isUserChoice && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {currentQuestion.explanation && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mt-8">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
                          <FileText className="w-4 h-4" />
                          Giải thích chi tiết
                        </div>
                        <HtmlContent
                          html={currentQuestion.explanation}
                          className="text-sm text-muted-foreground leading-relaxed [&_img]:max-h-64 [&_img]:rounded-lg"
                          onClickImage={setLightboxSrc}
                        />
                      </div>
                    )}

                    {/* AI Explanation */}
                    <AIExplanation
                      question={currentQuestion}
                      userAnswer={answers[currentQuestion.id]}
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
