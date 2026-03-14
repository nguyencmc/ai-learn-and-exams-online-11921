import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CourseReviews } from "@/components/course/CourseReviews";
import { VideoPreviewModal } from "@/components/course/VideoPreviewModal";

import {
  Play,
  PlayCircle,
  Users,
  Star,
  Award,
  Globe,
  Infinity as InfinityIcon,
  FileText,
  Download,
  CheckCircle,
  Heart,
  Share2,
  Monitor,
  Trophy,
  Lock,
  BookOpen,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { logger } from '@/lib/logger';

const log = logger('CourseDetail');

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  subcategory: string | null;
  topic: string | null;
  term_count: number | null;
  view_count: number | null;
  creator_id: string | null;
  creator_name: string | null;
  is_official: boolean | null;
  is_featured: boolean | null;
  price: number | null;
  original_price: number | null;
  duration_hours: number | null;
  level: string | null;
  language: string | null;
  rating: number | null;
  rating_count: number | null;
  student_count: number | null;
  lesson_count: number | null;
  requirements: string[] | null;
  what_you_learn: string[] | null;
  preview_video_url: string | null;
}

interface Section {
  id: string;
  title: string;
  section_order: number | null;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number | null;
  is_preview: boolean | null;
  content_type: string | null;
  video_url: string | null;
}

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [_isPlaying, _setIsPlaying] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [liveRating, setLiveRating] = useState<{ avg: number; count: number } | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch sections with lessons
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", id)
        .order("section_order");

      if (sectionsError) throw sectionsError;

      // Fetch lessons for each section
      const sectionsWithLessons = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { data: lessonsData } = await supabase
            .from("course_lessons")
            .select("id, title, duration_minutes, is_preview, content_type, video_url")
            .eq("section_id", section.id)
            .order("lesson_order");
          
          return {
            ...section,
            lessons: lessonsData || []
          };
        })
      );

      setSections(sectionsWithLessons);
    } catch (error) {
      log.error("Error fetching course", error);
    }
    setLoading(false);
  }, [id]);

  const checkEnrollment = useCallback(async () => {
    if (!user || !id) return;
    
    const { data, error } = await supabase
      .from("user_course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .maybeSingle();

    if (!error && data) {
      setIsEnrolled(true);
    }
  }, [user, id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (user && id) {
      checkEnrollment();
    }
  }, [user, id, checkEnrollment]);

  const handleEnroll = async () => {
    if (!user || !id) return;
    
    setEnrolling(true);
    const { error } = await supabase
      .from("user_course_enrollments")
      .insert({
        user_id: user.id,
        course_id: id,
        progress_percentage: 0,
      });

    if (error) {
      log.error("Error enrolling", error);
    } else {
      setIsEnrolled(true);
    }
    setEnrolling(false);
  };

  // Calculate stats from real data (use live rating if available from reviews)
  const rating = liveRating?.avg ?? course?.rating ?? 0;
  const totalRatings = liveRating?.count ?? course?.rating_count ?? 0;
  const totalStudents = course?.student_count || 0;
  const price = course?.price || 0;
  const originalPrice = course?.original_price || 0;
  const discount = originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  const totalHours = course?.duration_hours || 0;
  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  const handleRatingUpdate = (avgRating: number, count: number) => {
    setLiveRating({ avg: avgRating, count });
  };

  // Default requirements if not set
  const requirements = course?.requirements?.length ? course.requirements : [
    "Không yêu cầu kiến thức trước, phù hợp cho người mới bắt đầu",
    "Máy tính có kết nối internet",
    "Tinh thần học hỏi và sẵn sàng thực hành",
  ];

  // Default what you'll learn if not set
  const whatYouLearn = course?.what_you_learn?.length ? course.what_you_learn : [
    "Nắm vững kiến thức từ cơ bản đến nâng cao",
    "Xây dựng dự án thực tế từ đầu đến cuối",
    "Hiểu sâu các khái niệm quan trọng",
    "Áp dụng vào công việc thực tế",
  ];

  const getLessonIcon = (contentType: string | null) => {
    switch (contentType) {
      case 'video':
        return <PlayCircle className="w-4 h-4 text-muted-foreground" />;
      case 'document':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'test':
        return <ClipboardList className="w-4 h-4 text-orange-500" />;
      default:
        return <PlayCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes || minutes === 0) return "";
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy khóa học</h1>
          <p className="text-muted-foreground mb-4">Khóa học này không tồn tại hoặc đã bị xóa</p>
          <Button asChild>
            <Link to="/courses">Quay lại danh sách khóa học</Link>
          </Button>
        </div>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
{/* Hero Section - Dark Background */}
      <section className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Link to="/courses" className="hover:text-white">Khóa học</Link>
                <span>/</span>
                <span className="capitalize">{course.category}</span>
                {course.subcategory && (
                  <>
                    <span>/</span>
                    <span className="capitalize">{course.subcategory}</span>
                  </>
                )}
              </nav>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                {course.title}
              </h1>

              <p className="text-gray-300 text-lg mb-4">
                {course.description || "Khóa học toàn diện giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao."}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {course.is_featured && (
                  <Badge className="bg-yellow-500 text-black">
                    <Award className="w-3 h-3 mr-1" />
                    Bestseller
                  </Badge>
                )}
                {course.level && (
                  <Badge variant="outline" className="border-blue-500 text-blue-400 capitalize">
                    {course.level}
                  </Badge>
                )}
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-yellow-400">{rating.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-400">({totalRatings.toLocaleString()} đánh giá)</span>
                  </div>
                )}
                {totalStudents > 0 && (
                  <span className="text-gray-400">
                    <Users className="w-4 h-4 inline mr-1" />
                    {totalStudents.toLocaleString()} học viên
                  </span>
                )}
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Giảng viên:</span>
                <Link 
                  to={course.creator_id ? `/instructor/${course.creator_id}` : '#'} 
                  className="text-purple-400 hover:underline font-medium"
                >
                  {course.creator_name || "AI-Exam.cloud"}
                </Link>
              </div>

              {/* Language */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {course.language || "Tiếng Việt"}
                </span>
              </div>
            </div>

            {/* Right: Video Preview Card - Visible on Desktop */}
            <div className="hidden lg:block">
              {/* This is just a placeholder, actual card is fixed */}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Preview - Mobile */}
            <div className="lg:hidden">
              <div 
                className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => setShowVideoModal(true)}
              >
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <button
                    className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 text-slate-900 ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm">Xem trước khóa học này</p>
                </div>
              </div>
              
              {/* Mobile Price Card */}
              <div className="mt-4 p-4 bg-card rounded-xl border">
                {price > 0 ? (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold">{price.toLocaleString()}₫</span>
                    {originalPrice > price && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">{originalPrice.toLocaleString()}₫</span>
                        <Badge variant="destructive">{discount}% giảm</Badge>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-green-600">Miễn phí</span>
                  </div>
                )}
                {isEnrolled ? (
                  <Link to={`/course/${course.id}/learn`}>
                    <Button className="w-full h-12 text-lg mb-3">
                      <Play className="w-5 h-5 mr-2" />
                      Tiếp tục học
                    </Button>
                  </Link>
                ) : user ? (
                  <Button 
                    className="w-full h-12 text-lg mb-3" 
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? "Đang đăng ký..." : price > 0 ? "Đăng ký ngay" : "Đăng ký học miễn phí"}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full h-12 text-lg mb-3">
                      Đăng nhập để đăng ký
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* What you'll learn */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Bạn sẽ học được gì
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {whatYouLearn.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content - Real Data */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Nội dung khóa học</h2>
                <div className="text-sm text-muted-foreground">
                  {sections.length} phần • {totalLessons} bài học {totalHours > 0 && `• ${totalHours} giờ`}
                </div>
              </div>

              {sections.length > 0 ? (
                <Accordion type="multiple" className="border rounded-xl overflow-hidden">
                  {sections.map((section, index) => (
                    <AccordionItem key={section.id} value={`section-${section.id}`} className="border-b last:border-b-0">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-semibold">Phần {index + 1}: {section.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {section.lessons.length} bài học
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        <div className="divide-y">
                          {section.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {getLessonIcon(lesson.content_type)}
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.is_preview && (
                                  <Badge variant="secondary" className="text-xs">
                                    Xem trước
                                  </Badge>
                                )}
                                {lesson.content_type === 'test' && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                                    Test
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!lesson.is_preview && <Lock className="w-3 h-3 text-muted-foreground" />}
                                <span className="text-sm text-muted-foreground">
                                  {formatDuration(lesson.duration_minutes)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="border rounded-xl p-8 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nội dung khóa học đang được cập nhật</p>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-bold mb-4">Yêu cầu</h2>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold mb-4">Mô tả</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {course.description ? (
                  <p>{course.description}</p>
                ) : (
                  <p>
                    Chào mừng bạn đến với khóa học toàn diện này! Đây là khóa học được thiết kế đặc biệt 
                    để giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao một cách có hệ thống.
                  </p>
                )}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Giảng viên</h2>
              <div className="flex items-start gap-4">
                <Link to={course.creator_id ? `/instructor/${course.creator_id}` : '#'}>
                  <Avatar className="w-24 h-24 hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {(course.creator_name || "AI")[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link 
                    to={course.creator_id ? `/instructor/${course.creator_id}` : '#'} 
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    {course.creator_name || "AI-Exam.cloud"}
                  </Link>
                  <p className="text-sm text-muted-foreground mb-2">Chuyên gia đào tạo</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {totalStudents > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {totalStudents.toLocaleString()} học viên
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <CourseReviews 
              courseId={course.id} 
              isEnrolled={isEnrolled}
              onRatingUpdate={handleRatingUpdate}
            />
          </div>

          {/* Right Sidebar - Sticky Card */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-card border rounded-xl overflow-hidden shadow-lg">
                {/* Video Preview */}
                <div 
                  className="relative aspect-video bg-slate-900 cursor-pointer group"
                  onClick={() => setShowVideoModal(true)}
                >
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <button
                      className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 text-slate-900 ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm text-center">Xem trước khóa học</p>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="p-6">
                  {price > 0 ? (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold">{price.toLocaleString()}₫</span>
                      {originalPrice > price && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">{originalPrice.toLocaleString()}₫</span>
                          <Badge variant="destructive">{discount}% giảm</Badge>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-green-600">Miễn phí</span>
                    </div>
                  )}

                  {isEnrolled ? (
                    <Link to={`/course/${course.id}/learn`}>
                      <Button className="w-full h-12 text-lg mb-3">
                        <Play className="w-5 h-5 mr-2" />
                        Tiếp tục học
                      </Button>
                    </Link>
                  ) : user ? (
                    <Button 
                      className="w-full h-12 text-lg mb-3" 
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? "Đang đăng ký..." : price > 0 ? "Đăng ký ngay" : "Đăng ký học miễn phí"}
                    </Button>
                  ) : (
                    <Link to="/auth">
                      <Button className="w-full h-12 text-lg mb-3">
                        Đăng nhập để đăng ký
                      </Button>
                    </Link>
                  )}

                  {/* Course includes */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Khóa học bao gồm:</h3>
                    <ul className="space-y-2 text-sm">
                      {totalHours > 0 && (
                        <li className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-muted-foreground" />
                          {totalHours} giờ video theo yêu cầu
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {totalLessons} bài học
                      </li>
                      <li className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        Tài liệu tải xuống
                      </li>
                      <li className="flex items-center gap-2">
                        <InfinityIcon className="w-4 h-4 text-muted-foreground" />
                        Truy cập trọn đời
                      </li>
                      <li className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        Xem trên mọi thiết bị
                      </li>
                      <li className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        Chứng chỉ hoàn thành
                      </li>
                    </ul>
                  </div>

                  {/* Share & Wishlist */}
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                      Yêu thích
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={course.preview_video_url}
        thumbnailUrl={course.image_url}
        courseTitle={course.title}
      />
</div>
  );
};

export default CourseDetail;
