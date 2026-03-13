import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Heart,
  GraduationCap,
  Plus,
  Award,
  ExternalLink
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  last_activity?: string;
  completed_lessons?: number;
  course: {
    id: string;
    title: string;
    slug: string | null;
    image_url: string | null;
    creator_name: string | null;
    lesson_count: number | null;
    duration_hours: number | null;
    level: string | null;
  };
}

interface WishlistCourse {
  id: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    image_url: string | null;
    creator_name: string | null;
    price: number | null;
  };
}

interface Certificate {
  id: string;
  certificate_number: string;
  completion_date: string;
  final_score: number | null;
  issued_at: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    image_url: string | null;
    creator_name: string | null;
  };
}

export function MyCoursesSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<EnrolledCourse[]>([]);
  const [wishlistCourses, setWishlistCourses] = useState<WishlistCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch enrolled courses with progress percentage
    const { data: enrolled } = await supabase
      .from('user_course_enrollments')
      .select(`
        id,
        course_id,
        progress_percentage,
        enrolled_at,
        completed_at,
        course:courses(id, title, slug, image_url, creator_name, lesson_count, duration_hours, level)
      `)
      .eq('user_id', user?.id)
      .order('enrolled_at', { ascending: false });

    if (enrolled) {
      // Also fetch lesson progress for each course
      const courseIds = enrolled.map(e => e.course_id).filter(Boolean);
      
      const { data: lessonProgress } = await supabase
        .from('user_course_progress')
        .select('course_id, is_completed, last_watched_at')
        .eq('user_id', user?.id)
        .in('course_id', courseIds);

      // Calculate completed lessons and last activity for each course
      const progressMap = new Map<string, { completed: number; lastActivity: string | null }>();
      
      if (lessonProgress) {
        lessonProgress.forEach(lp => {
          const courseId = lp.course_id;
          if (!progressMap.has(courseId)) {
            progressMap.set(courseId, { completed: 0, lastActivity: null });
          }
          const current = progressMap.get(courseId)!;
          if (lp.is_completed) {
            current.completed++;
          }
          if (lp.last_watched_at && (!current.lastActivity || lp.last_watched_at > current.lastActivity)) {
            current.lastActivity = lp.last_watched_at;
          }
        });
      }

      const enrichedEnrolled = enrolled.map((e: Record<string, unknown>) => {
        const progressInfo = progressMap.get(e.course_id);
        return {
          ...e,
          completed_lessons: progressInfo?.completed || 0,
          last_activity: progressInfo?.lastActivity || e.enrolled_at,
        };
      });

      // Filter courses: in progress (< 100%) and completed (100% or completed_at is not null)
      const inProgress = enrichedEnrolled.filter((e: Record<string, unknown>) => 
        e.progress_percentage < 100 && !e.completed_at
      );
      const completed = enrichedEnrolled.filter((e: Record<string, unknown>) => 
        e.progress_percentage >= 100 || e.completed_at
      );
      
      setEnrolledCourses(inProgress as unknown as EnrolledCourse[]);
      setCompletedCourses(completed as unknown as EnrolledCourse[]);
    }

    // Fetch wishlist
    const { data: wishlist } = await supabase
      .from('course_wishlists')
      .select(`
        id,
        course_id,
        course:courses(id, title, image_url, creator_name, price)
      `)
      .eq('user_id', user?.id);

    if (wishlist) {
      setWishlistCourses(wishlist as unknown as WishlistCourse[]);
    }

    // Fetch certificates
    const { data: certs } = await supabase
      .from('course_certificates')
      .select(`
        id,
        certificate_number,
        completion_date,
        final_score,
        issued_at,
        course_id,
        course:courses(id, title, image_url, creator_name)
      `)
      .eq('user_id', user?.id)
      .order('issued_at', { ascending: false });

    if (certs) {
      setCertificates(certs as unknown as Certificate[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Khóa học của tôi
        </h2>
        <Link to="/courses">
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Khám phá
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enrolled" className="text-xs sm:text-sm">
            Đang học ({enrolledCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            Hoàn thành ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="text-xs sm:text-sm">
            Yêu thích ({wishlistCourses.length})
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm">
            Chứng chỉ ({certificates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-4">
          {enrolledCourses.length === 0 ? (
            <EmptyState 
              icon={BookOpen}
              title="Chưa có khóa học nào"
              description="Bạn chưa đăng ký khóa học nào"
              actionLabel="Khám phá khóa học"
              actionHref="/courses"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enrolledCourses.map((item) => (
                <CourseCard key={item.id} course={item} type="enrolled" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedCourses.length === 0 ? (
            <EmptyState 
              icon={CheckCircle2}
              title="Chưa hoàn thành khóa học nào"
              description="Tiếp tục học để hoàn thành khóa học đầu tiên"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedCourses.map((item) => (
                <CourseCard key={item.id} course={item} type="completed" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-4">
          {wishlistCourses.length === 0 ? (
            <EmptyState 
              icon={Heart}
              title="Danh sách yêu thích trống"
              description="Thêm khóa học vào yêu thích để xem sau"
              actionLabel="Khám phá khóa học"
              actionHref="/courses"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlistCourses.map((item) => (
                <WishlistCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          {certificates.length === 0 ? (
            <EmptyState 
              icon={GraduationCap}
              title="Chưa có chứng chỉ"
              description="Hoàn thành khóa học để nhận chứng chỉ"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CourseCardProps {
  course: EnrolledCourse;
  type: 'enrolled' | 'completed';
}

function CourseCard({ course, type }: CourseCardProps) {
  const progress = course.progress_percentage || 0;
  const completedLessons = course.completed_lessons || 0;
  const totalLessons = course.course.lesson_count || 0;
  
  // Format last activity date
  const formatLastActivity = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Link to={`/course/${course.course_id}/learn`}>
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
        <div className="aspect-video relative bg-muted">
          {course.course.image_url ? (
            <img 
              src={course.course.image_url} 
              alt={course.course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {type === 'completed' && (
            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Hoàn thành
            </Badge>
          )}
          {type === 'enrolled' && progress > 0 && (
            <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
              Đang học
            </Badge>
          )}
          {course.course.level && (
            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
              {course.course.level}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {course.course.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {course.course.creator_name || 'AI-Exam.cloud'}
          </p>
          
          {type === 'enrolled' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {completedLessons}/{totalLessons} bài học
                </span>
                <span className="font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {course.last_activity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Học gần nhất: {formatLastActivity(course.last_activity)}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {totalLessons} bài
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.course.duration_hours || 0}h
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface WishlistCardProps {
  item: WishlistCourse;
}

function WishlistCard({ item }: WishlistCardProps) {
  return (
    <Link to={`/course/${item.course_id}`}>
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
        <div className="aspect-video relative bg-muted">
          {item.course.image_url ? (
            <img 
              src={item.course.image_url} 
              alt={item.course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {item.course.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {item.course.creator_name || 'AI-Exam.cloud'}
          </p>
          {item.course.price !== null && (
            <p className="text-sm font-bold text-primary mt-2">
              {item.course.price === 0 ? 'Miễn phí' : `${item.course.price.toLocaleString()}đ`}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface CertificateCardProps {
  certificate: Certificate;
}

function CertificateCard({ certificate }: CertificateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Link to={`/verify-certificate/${certificate.certificate_number}`}>
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
        <div className="aspect-video relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Award className="w-16 h-16 mx-auto text-primary mb-2" />
              <p className="text-xs font-mono text-muted-foreground">
                #{certificate.certificate_number.slice(0, 8)}...
              </p>
            </div>
          </div>
          <Badge className="absolute top-2 right-2 bg-primary">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã cấp
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {certificate.course?.title || 'Khóa học'}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {certificate.course?.creator_name || 'AI-Exam.cloud'}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Ngày cấp: {formatDate(certificate.issued_at)}
            </span>
            {certificate.final_score !== null && (
              <Badge variant="secondary" className="text-xs">
                {certificate.final_score}%
              </Badge>
            )}
          </div>
          
          <Button variant="ghost" size="sm" className="w-full mt-3 gap-2 text-xs">
            <ExternalLink className="w-3 h-3" />
            Xem chứng chỉ
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
