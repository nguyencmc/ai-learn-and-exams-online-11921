import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Clock, FileText, Target, Users, ArrowLeft, Play,
  BookOpen, BarChart3, Shield, Camera, CheckCircle2,
  AlertTriangle, TrendingUp, Trophy, ChevronRight, Timer,
  Hash, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  question_count: number | null;
  attempt_count: number | null;
  pass_rate: number | null;
  category_name: string | null;
  is_proctored: boolean;
}

interface UserAttempt {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

const ExamDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPracticeMode = searchParams.get('type') === 'practice';

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam-detail", slug, isPracticeMode],
    queryFn: async (): Promise<ExamData | null> => {
      if (isPracticeMode) {
        let { data, error } = await supabase
          .from("question_sets")
          .select("*, exam_categories(name)")
          .eq("slug", slug)
          .maybeSingle();

        if (!data && !error) {
          const idQuery = await supabase
            .from("question_sets")
            .select("*, exam_categories(name)")
            .eq("id", slug)
            .maybeSingle();
          data = idQuery.data;
          error = idQuery.error;
        }

        if (error) throw error;
        if (!data) return null;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          duration_minutes: data.duration_minutes || 60,
          difficulty: data.level,
          question_count: data.question_count,
          attempt_count: 0,
          pass_rate: 0,
          category_name: (data.exam_categories as { name: string } | null)?.name || null,
          is_proctored: false,
        };
      } else {
        const { data, error } = await supabase
          .from("exams")
          .select("*, exam_categories(name)")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          duration_minutes: data.duration_minutes,
          difficulty: data.difficulty,
          question_count: data.question_count,
          attempt_count: data.attempt_count,
          pass_rate: data.pass_rate,
          category_name: (data.exam_categories as { name: string } | null)?.name || null,
          is_proctored: (data as Record<string, unknown>).is_proctored as boolean ?? false,
        };
      }
    },
    enabled: !!slug,
  });

  const { data: questionCount } = useQuery({
    queryKey: ["exam-questions-count", exam?.id, isPracticeMode],
    queryFn: async () => {
      if (isPracticeMode) {
        const { count, error } = await supabase
          .from("practice_questions")
          .select("*", { count: "exact", head: true })
          .eq("set_id", exam?.id);
        if (error) throw error;
        return count || 0;
      } else {
        const { count, error } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", exam?.id);
        if (error) throw error;
        return count || 0;
      }
    },
    enabled: !!exam?.id,
  });

  // Fetch user's past attempts for this exam
  const { data: userAttempts } = useQuery({
    queryKey: ["user-attempts", exam?.id, user?.id],
    queryFn: async (): Promise<UserAttempt[]> => {
      if (!user?.id || !exam?.id) return [];
      const { data, error } = await supabase
        .from("exam_attempts")
        .select("id, score, total_questions, correct_answers, completed_at")
        .eq("user_id", user.id)
        .eq("exam_id", exam.id)
        .order("completed_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return (data || []) as unknown as UserAttempt[];
    },
    enabled: !!exam?.id && !!user?.id,
  });

  const bestScore = userAttempts?.length
    ? Math.max(...userAttempts.map(a => a.score))
    : null;
  const totalAttempts = userAttempts?.length ?? 0;
  const lastAttempt = userAttempts?.[0] ?? null;

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "easy": case "beginner":
        return { label: "Dễ", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", bar: "bg-emerald-500", pct: 33 };
      case "medium": case "intermediate":
        return { label: "Trung bình", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", bar: "bg-amber-500", pct: 66 };
      case "hard": case "advanced":
        return { label: "Khó", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20", bar: "bg-rose-500", pct: 100 };
      default:
        return { label: difficulty, cls: "bg-muted text-muted-foreground", bar: "bg-muted-foreground", pct: 50 };
    }
  };

  const handleStartExam = () => {
    if (isPracticeMode) navigate(`/exam/${slug}/take?type=practice`);
    else navigate(`/exam/${slug}/take`);
  };

  const totalQ = questionCount || exam?.question_count || 0;
  const diffCfg = getDifficultyConfig(exam?.difficulty || "medium");

  if (examLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-6 rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Không tìm thấy đề thi</h1>
          <p className="text-muted-foreground">Đề thi này không tồn tại hoặc đã bị xoá.</p>
          <Button onClick={() => navigate("/exams")}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background border-b border-border">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 py-8 max-w-5xl">
          <Button variant="ghost" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {exam.category_name && (
                  <Badge variant="secondary" className="font-medium">
                    {exam.category_name}
                  </Badge>
                )}
                {isPracticeMode && (
                  <Badge variant="outline">Cộng đồng</Badge>
                )}
                <Badge variant="outline" className={cn("font-medium", diffCfg.cls)}>
                  {diffCfg.label}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="text-muted-foreground text-base md:text-lg max-w-2xl line-clamp-2">
                  {exam.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                </p>
              )}

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <strong className="text-foreground">{totalQ}</strong> câu hỏi
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <strong className="text-foreground">{exam.duration_minutes || 60}</strong> phút
                </span>
                {!isPracticeMode && (exam.attempt_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <strong className="text-foreground">{(exam.attempt_count || 0).toLocaleString()}</strong> lượt thi
                  </span>
                )}
              </div>
            </div>

            {/* CTA desktop */}
            <div className="hidden md:flex flex-col items-center gap-2 flex-shrink-0">
              <Button size="lg" className="gap-2 px-10 text-base h-12 shadow-lg" onClick={handleStartExam}>
                <Play className="w-5 h-5 fill-current" />
                Bắt đầu làm bài
              </Button>
              <span className="text-xs text-muted-foreground">Tính giờ ngay khi bắt đầu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Questions */}
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Câu hỏi</span>
                <Hash className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-bold">{totalQ}</span>
              <span className="text-xs text-muted-foreground">câu</span>
            </CardContent>
          </Card>

          {/* Time */}
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Thời gian</span>
                <Timer className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-bold">{exam.duration_minutes || 60}</span>
              <span className="text-xs text-muted-foreground">phút</span>
            </CardContent>
          </Card>

          {/* Difficulty */}
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Độ khó</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xl font-bold">{diffCfg.label}</span>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", diffCfg.bar)} style={{ width: `${diffCfg.pct}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Pass rate or user best */}
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {bestScore !== null ? "Điểm cao nhất" : "Tỷ lệ đạt"}
                </span>
                <Trophy className={cn("w-4 h-4", bestScore !== null ? "text-yellow-500" : "text-emerald-500")} />
              </div>
              <span className={cn("text-2xl font-bold", bestScore !== null && bestScore >= 70 ? "text-emerald-500" : bestScore !== null ? "text-rose-500" : "text-foreground")}>
                {bestScore !== null ? `${bestScore}%` : `${exam.pass_rate || 0}%`}
              </span>
              <span className="text-xs text-muted-foreground">
                {bestScore !== null ? `Sau ${totalAttempts} lần thi` : "tỷ lệ đỗ"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* ── Main grid ── */}
        <div className="grid md:grid-cols-5 gap-6">

          {/* Left col: instructions + proctoring */}
          <div className="md:col-span-3 space-y-4">

            {/* Rules */}
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Quy định làm bài
                </h2>
                <ul className="space-y-3">
                  {[
                    { icon: <Timer className="w-4 h-4 text-blue-500" />, text: "Thời gian bắt đầu tính ngay khi nhấn \"Bắt đầu\"" },
                    { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Có thể chuyển qua lại giữa các câu hỏi trong thời gian làm bài" },
                    { icon: <Clock className="w-4 h-4 text-amber-500" />, text: "Bài thi tự động nộp khi hết thời gian" },
                    { icon: <BarChart3 className="w-4 h-4 text-purple-500" />, text: "Kết quả và giải thích chi tiết sau khi nộp bài" },
                    { icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, text: "Không chuyển tab hoặc rời khỏi trang trong khi thi", warn: true },
                  ].map((item, i) => (
                    <li key={i} className={cn("flex items-start gap-3 text-sm", item.warn ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground")}>
                      <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Proctoring */}
            {exam.is_proctored && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-orange-600 dark:text-orange-400 mb-1">
                        Chế độ thi có giám sát
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bài thi được giám sát qua webcam. Đảm bảo camera hoạt động và bạn đang ở môi trường yên tĩnh trước khi bắt đầu.
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera sẽ được bật trong suốt thời gian làm bài</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right col: user history + CTA */}
          <div className="md:col-span-2 space-y-4">

            {/* CTA card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Play className="w-7 h-7 text-primary fill-primary/30" />
                </div>
                <div>
                  <p className="font-semibold text-base">Sẵn sàng bắt đầu?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalQ} câu · {exam.duration_minutes || 60} phút
                  </p>
                </div>
                <Button size="lg" className="w-full gap-2 h-11" onClick={handleStartExam}>
                  <Play className="w-4 h-4 fill-current" />
                  Bắt đầu làm bài
                </Button>
                {totalAttempts > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Bạn đã thi <strong>{totalAttempts}</strong> lần · Cao nhất: <strong className={bestScore! >= 70 ? "text-emerald-500" : "text-rose-500"}>{bestScore}%</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Attempt history */}
            {userAttempts && userAttempts.length > 0 && (
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Lịch sử của bạn
                  </h3>
                  <div className="space-y-2">
                    {userAttempts.map((attempt, i) => (
                      <button
                        key={attempt.id}
                        onClick={() => navigate(`/attempt/${attempt.id}`)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                          attempt.score >= 70
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        )}>
                          {attempt.score}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={attempt.score}
                              className="h-1.5 flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {attempt.correct_answers}/{attempt.total_questions} đúng ·{" "}
                            {format(new Date(attempt.completed_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No history yet */}
            {user && userAttempts?.length === 0 && (
              <Card className="border-border/60 border-dashed">
                <CardContent className="p-5 text-center">
                  <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Bạn chưa thi đề này</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Hãy bắt đầu ngay!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <Button size="lg" className="w-full gap-2 h-12 text-base" onClick={handleStartExam}>
          <Play className="w-5 h-5 fill-current" />
          Bắt đầu làm bài
        </Button>
      </div>
      <div className="md:hidden h-20" />
    </div>
  );
};

export default ExamDetail;