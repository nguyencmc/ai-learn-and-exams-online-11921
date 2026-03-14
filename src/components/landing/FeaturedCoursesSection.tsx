import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Users, Clock, ArrowRight, BookOpen, GraduationCap } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  duration_hours: number | null;
  level: string | null;
  category: string | null;
  view_count: number | null;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: "Cơ bản", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  intermediate: { label: "Trung cấp", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  advanced: { label: "Nâng cao", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

export const FeaturedCoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setCourses(data);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const getRandomRating = () => (4 + Math.random()).toFixed(1);
  const getRandomStudents = () => Math.floor(Math.random() * 5000) + 500;

  if (loading) {
    return (
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="py-24 lg:py-32 bg-background relative">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Khóa học nổi bật</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Khám phá khóa học
            <span className="text-gradient"> chất lượng cao</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Các khóa học được thiết kế bởi chuyên gia, giúp bạn nâng cao kiến thức một cách hiệu quả.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {courses.map((course, index) => {
            const level = levelConfig[course.level || "beginner"] || levelConfig.beginner;
            
            return (
              <Link key={course.id} to={`/courses/${course.slug}`}>
                <Card 
                  className="group h-full overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    {/* Level Badge */}
                    <Badge className={`absolute top-4 left-4 ${level.color} border-0`}>
                      {level.label}
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    {/* Category */}
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                      {course.category || "Khóa học"}
                    </p>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[56px]">
                      {course.title}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">{getRandomRating()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{getRandomStudents().toLocaleString()}</span>
                      </div>
                      {course.duration_hours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_hours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Arrow */}
                    <div className="flex items-center justify-between pt-5 border-t border-border/50">
                      {course.price && course.price > 0 ? (
                        <span className="text-xl font-bold text-primary">
                          {course.price.toLocaleString()}đ
                        </span>
                      ) : (
                        <span className="text-xl font-bold text-accent">Miễn phí</span>
                      )}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
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
          <Link to="/courses">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold gap-2 group border-2">
              Xem tất cả khóa học
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
