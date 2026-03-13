import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  BookOpen, 
  Star, 
  GraduationCap,
  Clock,
  PlayCircle,
  ArrowLeft
} from 'lucide-react';
import { logger } from '@/lib/logger';

const log = logger('InstructorProfile');

interface Instructor {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  rating_count: number | null;
  student_count: number | null;
  level: string | null;
  duration_hours: number | null;
  lesson_count: number | null;
  price: number | null;
  is_published: boolean | null;
}

const InstructorProfile = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!instructorId) return;

      setLoading(true);
      try {
        // Fetch instructor profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, bio, created_at')
          .eq('user_id', instructorId)
          .single();

        if (profileError) throw profileError;
        setInstructor(profile);

        // Fetch instructor's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, slug, description, image_url, rating, rating_count, student_count, level, duration_hours, lesson_count, price, is_published')
          .eq('creator_id', instructorId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Calculate total students
        const total = (coursesData || []).reduce((acc, course) => acc + (course.student_count || 0), 0);
        setTotalStudents(total);
      } catch (error) {
        log.error('Error fetching instructor data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [instructorId]);

  const getLevelBadge = (level: string | null) => {
    const levelConfig: Record<string, { label: string; className: string }> = {
      'beginner': { label: 'Cơ bản', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      'intermediate': { label: 'Trung cấp', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      'advanced': { label: 'Nâng cao', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    };
    return levelConfig[level || 'beginner'] || levelConfig['beginner'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-64 w-full rounded-xl mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
</div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy giảng viên</h1>
            <p className="text-muted-foreground mb-6">
              Giảng viên này không tồn tại hoặc đã bị xóa.
            </p>
            <Button asChild>
              <Link to="/courses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại khóa học
              </Link>
            </Button>
          </div>
        </main>
</div>
    );
  }

  const displayName = instructor.full_name || instructor.username || 'Giảng viên';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = new Date(instructor.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1">
        {/* Instructor Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link to="/courses">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Link>
              </Button>
              
              <div className="flex flex-col md:flex-row items-start gap-8">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                  <AvatarImage src={instructor.avatar_url || ''} alt={displayName} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Giảng viên
                    </Badge>
                  </div>
                  
                  {instructor.username && (
                    <p className="text-muted-foreground mb-4">@{instructor.username}</p>
                  )}
                  
                  {instructor.bio && (
                    <p className="text-foreground/80 mb-6 max-w-2xl">{instructor.bio}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{courses.length}</p>
                        <p className="text-sm text-muted-foreground">Khóa học</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold">{totalStudents.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Học viên</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {courses.length > 0 
                            ? (courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length).toFixed(1)
                            : '0.0'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">Đánh giá TB</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold">{memberSince}</p>
                        <p className="text-sm text-muted-foreground">Tham gia từ</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Courses Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Khóa học của {displayName}
              <span className="text-muted-foreground font-normal ml-2">({courses.length})</span>
            </h2>
            
            {courses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Giảng viên này chưa có khóa học nào được công khai.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const levelBadge = getLevelBadge(course.level);
                  
                  return (
                    <Link 
                      key={course.id} 
                      to={`/course/${course.slug || course.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                        {/* Course Image */}
                        <div className="relative aspect-video bg-muted overflow-hidden">
                          {course.image_url ? (
                            <img 
                              src={course.image_url} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <PlayCircle className="w-12 h-12 text-primary/50" />
                            </div>
                          )}
                          <Badge className={`absolute top-3 left-3 ${levelBadge.className}`}>
                            {levelBadge.label}
                          </Badge>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          
                          {course.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                          
                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-amber-600">
                              {course.rating?.toFixed(1) || '0.0'}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-4 h-4 ${
                                    star <= Math.round(course.rating || 0) 
                                      ? 'fill-amber-400 text-amber-400' 
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({course.rating_count || 0})
                            </span>
                          </div>
                          
                          {/* Meta info */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {course.student_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {course.lesson_count || 0} bài
                            </span>
                            {course.duration_hours && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.duration_hours}h
                              </span>
                            )}
                          </div>
                          
                          {/* Price */}
                          <div className="mt-4 pt-4 border-t">
                            {course.price && course.price > 0 ? (
                              <span className="font-bold text-lg text-primary">
                                {course.price.toLocaleString()}đ
                              </span>
                            ) : (
                              <span className="font-bold text-lg text-green-600">Miễn phí</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
</div>
  );
};

export default InstructorProfile;
