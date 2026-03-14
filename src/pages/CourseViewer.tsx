import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseTestTaking } from '@/components/course/CourseTestTaking';
import { LessonNotes } from '@/components/course/LessonNotes';
import { CourseCertificate } from '@/components/course/CourseCertificate';
import { CourseQA } from '@/components/course/CourseQA';
import { VideoPlayer } from '@/components/course/VideoPlayer';
import { 
  Play, 
  CheckCircle, 
  Circle, 
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  FileText,
  MessageSquare,
  BookOpen,
  Download,
  File,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger('CourseViewer');

interface Course {
  id: string;
  title: string;
  description: string | null;
  creator_name: string | null;
  creator_id: string | null;
  image_url: string | null;
}

interface LessonAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
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
  description: string | null;
  duration_minutes: number | null;
  video_url: string | null;
  lesson_order: number | null;
  is_preview: boolean | null;
  content_type: string | null;
  attachments?: LessonAttachment[];
}

interface _CourseTest {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  is_required: boolean;
}

interface _TestQuestion {
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

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  watch_time_seconds: number;
}

const CourseViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [_videoProgress, setVideoProgress] = useState(0);
  const [_videoDuration, setVideoDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchCourseData = useCallback(async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch sections with lessons
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', id)
        .order('section_order');

      if (sectionsError) throw sectionsError;

      // Fetch lessons for each section with attachments
      const sectionsWithLessons = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { data: lessonsData } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('section_id', section.id)
            .order('lesson_order');
          
          // Fetch attachments for lessons
          const lessonsWithAttachments = await Promise.all(
            (lessonsData || []).map(async (lesson) => {
              const { data: attachments } = await supabase
                .from('lesson_attachments')
                .select('*')
                .eq('lesson_id', lesson.id)
                .order('display_order');
              
              return {
                ...lesson,
                attachments: attachments || []
              };
            })
          );
          
          return {
            ...section,
            lessons: lessonsWithAttachments
          };
        })
      );

      setSections(sectionsWithLessons);

      // Set first lesson as current if available
      if (sectionsWithLessons.length > 0 && sectionsWithLessons[0].lessons.length > 0) {
        setCurrentLesson(sectionsWithLessons[0].lessons[0]);
      }

      // Fetch user progress if logged in
      if (user) {
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id);

        if (progressData) {
          const progressMap = new Map<string, LessonProgress>();
          progressData.forEach(p => {
            progressMap.set(p.lesson_id!, {
              lesson_id: p.lesson_id!,
              is_completed: p.is_completed || false,
              watch_time_seconds: p.watch_time_seconds || 0
            });
          });
          setProgress(progressMap);
        }
      }
    } catch (error) {
      log.error('Error fetching course', error);
      toast.error('Không thể tải khóa học');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, user, fetchCourseData]);

  const getTotalLessons = () => {
    return sections.reduce((acc, section) => acc + section.lessons.length, 0);
  };

  const getCompletedLessons = () => {
    let count = 0;
    progress.forEach(p => {
      if (p.is_completed) count++;
    });
    return count;
  };

  const getProgressPercentage = () => {
    const total = getTotalLessons();
    if (total === 0) return 0;
    return Math.round((getCompletedLessons() / total) * 100);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(false);
    setVideoProgress(0);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu tiến độ');
      return;
    }

    try {
      // Mark lesson as complete
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      // Update local progress state
      const newProgress = new Map(progress);
      newProgress.set(lessonId, {
        lesson_id: lessonId,
        is_completed: true,
        watch_time_seconds: progress.get(lessonId)?.watch_time_seconds || 0
      });
      setProgress(newProgress);

      // Calculate new progress percentage
      const totalLessons = getTotalLessons();
      let completedCount = 0;
      newProgress.forEach(p => {
        if (p.is_completed) completedCount++;
      });
      const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // Update enrollment progress
      const { error: enrollmentError } = await supabase
        .from('user_course_enrollments')
        .update({ 
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('course_id', id);

      if (enrollmentError) {
        log.error('Error updating enrollment progress', enrollmentError);
      }

      toast.success('Đã hoàn thành bài học');
    } catch (error) {
      log.error('Error marking lesson complete', error);
      toast.error('Không thể cập nhật tiến độ');
    }
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    const allLessons = sections.flatMap(s => s.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    }
  };

  const _formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const _handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoProgress(videoRef.current.currentTime);
    }
  };

  const _handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const _togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const _toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const _handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoProgress(time);
    }
  };

  const _toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy khóa học</h1>
          <Link to="/courses">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'lg:mr-80' : ''}`}>
        {/* Header */}
        <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/course/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-sm truncate max-w-md">{course.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Progress value={getProgressPercentage()} className="w-32 h-2" />
              <span className="text-sm text-muted-foreground">
                {getProgressPercentage()}%
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
        </header>

        {/* Video Player */}
        <VideoPlayer
          src={currentLesson?.video_url || null}
          onTimeUpdate={(time, dur) => {
            setVideoProgress(time);
            setVideoDuration(dur);
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Lesson Navigation */}
        <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateLesson('prev')}
            disabled={sections.flatMap(s => s.lessons).findIndex(l => l.id === currentLesson?.id) === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Bài trước
          </Button>
          
          <div className="flex items-center gap-2">
            {currentLesson && !progress.get(currentLesson.id)?.is_completed && (
              <Button
                size="sm"
                onClick={() => currentLesson && markLessonComplete(currentLesson.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Hoàn thành bài học
              </Button>
            )}
            {currentLesson && progress.get(currentLesson.id)?.is_completed && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã hoàn thành
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateLesson('next')}
            disabled={sections.flatMap(s => s.lessons).findIndex(l => l.id === currentLesson?.id) === sections.flatMap(s => s.lessons).length - 1}
          >
            Bài tiếp
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 p-4 lg:p-6">
          <Tabs defaultValue={currentLesson?.content_type === 'test' ? 'test' : 'overview'} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Tổng quan
              </TabsTrigger>
              {currentLesson?.content_type === 'test' && (
                <TabsTrigger value="test" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Bài kiểm tra
                </TabsTrigger>
              )}
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ghi chú
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Hỏi đáp
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{currentLesson?.title}</h2>
                  {currentLesson?.description && (
                    <p className="text-muted-foreground">{currentLesson.description}</p>
                  )}
                </div>
                
                {/* Attachments */}
                {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <File className="w-4 h-4" />
                        Tài liệu đính kèm
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {currentLesson.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <FileText className="w-5 h-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Về khóa học này</h3>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  {course.creator_name && (
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">Giảng viên:</span> {course.creator_name}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {currentLesson?.content_type === 'test' && (
              <TabsContent value="test">
                <CourseTestTaking 
                  lessonId={currentLesson.id}
                  onComplete={() => markLessonComplete(currentLesson.id)}
                />
              </TabsContent>
            )}
            
            <TabsContent value="notes">
              {currentLesson && (
                <LessonNotes 
                  lessonId={currentLesson.id}
                  lessonTitle={currentLesson.title}
                  courseId={id || ''}
                />
              )}
            </TabsContent>
            
            <TabsContent value="qa">
              {currentLesson && (
                <CourseQA 
                  courseId={id || ''} 
                  lessonId={currentLesson.id} 
                  instructorId={course?.creator_id}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar - Course Content */}
      <aside className={`fixed right-0 top-0 h-full w-80 bg-card border-l transform transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Nội dung khóa học</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{getCompletedLessons()}/{getTotalLessons()} bài học</span>
              <span>•</span>
              <span>{getProgressPercentage()}% hoàn thành</span>
            </div>
            <Progress value={getProgressPercentage()} className="mt-2 h-1" />

            {/* Certificate Section */}
            <div className="mt-4 pt-4 border-t">
              <CourseCertificate
                courseId={id || ''}
                courseTitle={course.title}
                creatorName={course.creator_name}
                progressPercentage={getProgressPercentage()}
              />
            </div>
          </div>

          {/* Course Sections */}
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="px-2">
              {sections.map((section, sectionIndex) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="py-3 px-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium text-sm">
                        Phần {sectionIndex + 1}: {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {section.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = progress.get(lesson.id)?.is_completed;
                        const isCurrent = currentLesson?.id === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                              isCurrent 
                                ? 'bg-primary/10 text-primary' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm truncate ${isCurrent ? 'font-medium' : ''}`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.content_type === 'test' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Test
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {lesson.content_type === 'test' ? (
                                  <ClipboardList className="h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                <span>{lesson.duration_minutes || 0} phút</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
};

export default CourseViewer;
