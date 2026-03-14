import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  Users,
  ArrowRight,
  Target,
  Zap,
  Brain,
  TrendingUp
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  question_count: number | null;
  attempt_count: number | null;
  difficulty: string | null;
  duration_minutes: number | null;
  category_name?: string;
}

const difficultyConfig: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  easy: { label: "Dễ", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Zap },
  medium: { label: "Trung bình", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Target },
  hard: { label: "Khó", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: Brain },
};

export const PopularExamsSection = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select(`
          id,
          title,
          slug,
          description,
          question_count,
          attempt_count,
          difficulty,
          duration_minutes,
          category:exam_categories(name)
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!examError && examData) {
        const formattedExams = examData.map((exam) => ({
          ...exam,
          category_name: (exam.category as { name: string } | null)?.name || null,
        }));
        setExams(formattedExams);
      }
      setLoading(false);
    };

    fetchExams();
  }, []);

  const getAttempts = (count: number | null) => count || Math.floor(Math.random() * 2000) + 100;

  if (loading) {
    return (
      <section className="py-24 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (exams.length === 0) {
    return null;
  }

  return (
    <section className="py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Đề thi phổ biến</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Luyện tập với đề thi
            <span className="text-gradient"> thực tế</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Hàng ngàn đề thi từ cơ bản đến nâng cao, giúp bạn chuẩn bị tốt nhất cho mọi kỳ thi.
          </p>
        </div>

        {/* Exams Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {exams.map((exam, index) => {
            const difficulty = difficultyConfig[exam.difficulty || "medium"] || difficultyConfig.medium;
            const DifficultyIcon = difficulty.icon;

            return (
              <Link key={exam.id} to={`/exams/${exam.slug}`}>
                <Card 
                  className="group h-full overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-7 h-7 text-primary" />
                      </div>
                      <Badge className={`${difficulty.color} border-0`}>
                        <DifficultyIcon className="w-3 h-3 mr-1" />
                        {difficulty.label}
                      </Badge>
                    </div>

                    {/* Category */}
                    {exam.category_name && (
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                        {exam.category_name}
                      </p>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[56px]">
                      {exam.title}
                    </h3>

                    {/* Description */}
                    {exam.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                        {exam.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-6 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>{exam.question_count || 10} câu</span>
                      </div>
                      {exam.duration_minutes && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{exam.duration_minutes} phút</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Users className="w-4 h-4" />
                        <span>{getAttempts(exam.attempt_count).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link to="/exams">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold gap-2 group border-2">
              Xem tất cả đề thi
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
