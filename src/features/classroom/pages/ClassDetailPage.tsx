import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Copy, Loader2,
  GraduationCap, Users, BookOpen, ClipboardList, BarChart3, Library,
  ClipboardCheck, Video,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClass, useMyClassRole } from '../hooks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import CoursesTab from '../components/CoursesTab';
import MembersTab from '../components/MembersTab';
import AssignmentsTab from '../components/AssignmentsTab';
import GradebookTab from '../components/GradebookTab';
import StudentTodoList from '../components/StudentTodoList';
import ClassLibraryTab from '../components/ClassLibraryTab';
import ExamsTab from '../components/ExamsTab';
import VideoTab from '../components/VideoTab';

const CLASS_GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-purple-600 to-pink-700',
  'from-emerald-600 to-teal-700',
  'from-orange-600 to-amber-700',
  'from-rose-600 to-red-700',
  'from-cyan-600 to-blue-700',
];

function getGradient(id: string) {
  const idx = id.charCodeAt(0) % CLASS_GRADIENTS.length;
  return CLASS_GRADIENTS[idx];
}

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: classData, isLoading } = useClass(classId);
  const { data: myRole } = useMyClassRole(classId);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const isManager = myRole === 'teacher' || myRole === 'assistant';
  const isStudent = myRole === 'student';

  const copyClassCode = () => {
    if (classData?.class_code) {
      navigator.clipboard.writeText(classData.class_code);
      toast({ title: 'Đã sao chép mã lớp!' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Không tìm thấy lớp học</h1>
          <p className="text-muted-foreground text-sm mb-6">Lớp học này không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Button onClick={() => navigate('/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const gradient = getGradient(classData.id);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Banner ── */}
      <div className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}>
        {classData.cover_image && (
          <img
            src={classData.cover_image}
            alt={classData.title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative container mx-auto px-4 py-8 max-w-6xl">
          {/* Back button */}
          <button
            onClick={() => navigate('/classes')}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Danh sách lớp học
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            {/* Class info */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{classData.title}</h1>
                  {!classData.is_active && (
                    <Badge className="bg-white/20 border-white/30 text-white text-xs">Đã đóng</Badge>
                  )}
                </div>
                {classData.description && (
                  <p className="text-white/75 text-sm line-clamp-2 max-w-lg">{classData.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge className="bg-white/15 border-white/25 text-white/90 text-xs backdrop-blur-sm">
                    {isManager ? 'Giáo viên' : 'Học sinh'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Class code + settings */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-4 py-2.5">
                <p className="text-white/60 text-xs mb-0.5">Mã lớp học</p>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono font-bold text-lg tracking-wider">
                    {classData.class_code}
                  </code>
                  <button
                    onClick={copyClassCode}
                    className="text-white/70 hover:text-white transition-colors"
                    title="Sao chép mã lớp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {isManager && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/15 rounded-xl"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Student Todo List */}
        {isStudent && classId && (
          <div className="mb-8">
            <StudentTodoList classId={classId} />
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="library">
          <div className="overflow-x-auto pb-1 mb-8">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-auto inline-flex gap-1 min-w-max">
              <TabsTrigger
                value="library"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <Library className="h-4 w-4" />
                <span>Tài liệu</span>
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <Video className="h-4 w-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger
                value="exams"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Bài kiểm tra</span>
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Khóa học</span>
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <Users className="h-4 w-4" />
                <span>Thành viên</span>
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Bài tập</span>
              </TabsTrigger>
              {isManager && (
                <TabsTrigger
                  value="gradebook"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Bảng điểm</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="library">
            <ClassLibraryTab classId={classId!} isManager={isManager} />
          </TabsContent>

          <TabsContent value="video">
            <VideoTab classId={classId!} isManager={isManager} />
          </TabsContent>

          <TabsContent value="exams">
            <ExamsTab classId={classId!} isManager={isManager} />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab classId={classId!} isManager={isManager} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab classId={classId!} isManager={isManager} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab classId={classId!} isManager={isManager} />
          </TabsContent>

          {isManager && (
            <TabsContent value="gradebook">
              <GradebookTab classId={classId!} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default ClassDetailPage;
