import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Headphones,
  Layers,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  BarChart3,
  FolderOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useTeacherData } from '@/features/admin/hooks/useTeacherData';
import { TeacherOverviewTab } from '@/features/admin/components/TeacherOverviewTab';
import { TeacherCoursesTab } from '@/features/admin/components/TeacherCoursesTab';
import { TeacherExamsTab } from '@/features/admin/components/TeacherExamsTab';
import { TeacherContentTab } from '@/features/admin/components/TeacherContentTab';
import { TeacherAnalyticsTab } from '@/features/admin/components/TeacherAnalyticsTab';
import type { DashboardTab } from '@/features/admin/types';

const sidebarItems = [
  { id: 'overview' as const, label: 'Tổng quan', icon: BarChart3, color: 'text-primary' },
  { id: 'courses' as const, label: 'Khóa học', icon: GraduationCap, color: 'text-cyan-500' },
  { id: 'exams' as const, label: 'Đề thi', icon: FileText, color: 'text-purple-500' },
  { id: 'content' as const, label: 'Nội dung', icon: FolderOpen, color: 'text-orange-500' },
  { id: 'analytics' as const, label: 'Phân tích', icon: TrendingUp, color: 'text-green-500' },
];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { isTeacher, isAdmin, hasAnyPermission, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Check if user is a teacher (not admin accessing teacher panel)
  // Teacher Dashboard is exclusive to teachers, admins should use Admin Dashboard
  const hasAccess = isTeacher && !isAdmin && hasAnyPermission([
    'exams.view', 'courses.view', 'flashcards.view', 'podcasts.view', 'questions.view'
  ]);

  const canCreateExams = hasPermission('exams.create');
  const canCreateCourses = hasPermission('courses.create');
  const canCreateFlashcards = hasPermission('flashcards.create');
  const canCreatePodcasts = hasPermission('podcasts.create');

  const { stats, recentItems, myCourses, loading, fetchData } = useTeacherData(user?.id);

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Trang này chỉ dành cho giảng viên (Teacher)",
        variant: "destructive",
      });
    }
  }, [hasAccess, roleLoading, navigate, toast]);

  useEffect(() => {
    if (hasAccess && user) {
      fetchData();
    }
  }, [hasAccess, user, fetchData]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const quickCreateItems = [
    { label: 'Khóa học mới', icon: GraduationCap, href: '/admin/courses/create', color: 'bg-cyan-500', enabled: canCreateCourses },
    { label: 'Đề thi mới', icon: FileText, href: '/admin/exams/create', color: 'bg-purple-500', enabled: canCreateExams },
    { label: 'Flashcard', icon: Layers, href: '/admin/flashcards/create', color: 'bg-orange-500', enabled: canCreateFlashcards },
    { label: 'Podcast', icon: Headphones, href: '/admin/podcasts/create', color: 'bg-pink-500', enabled: canCreatePodcasts },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <TeacherOverviewTab
            stats={stats}
            recentItems={recentItems}
            loading={loading}
            quickCreateItems={quickCreateItems}
          />
        );
      case 'courses':
        return <TeacherCoursesTab myCourses={myCourses} canCreateCourses={canCreateCourses} />;
      case 'exams':
        return <TeacherExamsTab stats={stats} canCreateExams={canCreateExams} />;
      case 'content':
        return <TeacherContentTab stats={stats} />;
      case 'analytics':
        return <TeacherAnalyticsTab stats={stats} myCourses={myCourses} />;
      default:
        return (
          <TeacherOverviewTab
            stats={stats}
            recentItems={recentItems}
            loading={loading}
            quickCreateItems={quickCreateItems}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">Tạo và quản lý nội dung học tập</p>
            </div>
          </div>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                Chuyển sang Admin
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-2">
            <nav className="space-y-1 sticky top-24">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", activeTab === item.id ? item.color : "")} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DashboardTab)}>
              <TabsList className="grid w-full grid-cols-5">
                {sidebarItems.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="text-xs px-2">
                    <item.icon className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-10">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
