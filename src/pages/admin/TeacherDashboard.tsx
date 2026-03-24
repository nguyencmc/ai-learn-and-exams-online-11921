import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { TeacherMobileBottomNav } from '@/components/admin/TeacherMobileBottomNav';
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
  { id: 'overview'  as const, label: 'Tổng quan', icon: BarChart3,     color: 'text-indigo-400' },
  { id: 'courses'   as const, label: 'Khóa học',  icon: GraduationCap, color: 'text-cyan-400' },
  { id: 'exams'     as const, label: 'Đề thi',    icon: FileText,      color: 'text-violet-400' },
  { id: 'content'   as const, label: 'Nội dung',  icon: FolderOpen,    color: 'text-amber-400' },
  { id: 'analytics' as const, label: 'Phân tích', icon: TrendingUp,    color: 'text-emerald-400' },
];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { isTeacher, isAdmin, hasAnyPermission, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

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

  // Loading skeleton
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-2">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-10 space-y-4">
              <div className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  const quickCreateItems = [
    { label: 'Khóa học mới', icon: GraduationCap, href: '/admin/courses/create',   color: 'bg-cyan-500',    enabled: canCreateCourses },
    { label: 'Đề thi mới',   icon: FileText,      href: '/admin/exams/create',     color: 'bg-purple-500',  enabled: canCreateExams },
    { label: 'Flashcard',    icon: Layers,         href: '/admin/flashcards/create',color: 'bg-orange-500',  enabled: canCreateFlashcards },
    { label: 'Podcast',      icon: Headphones,     href: '/admin/podcasts/create',  color: 'bg-pink-500',    enabled: canCreatePodcasts },
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
      <main className="container mx-auto px-4 py-6 pb-28 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 animate-fade-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold db-shimmer-text">
                Teacher Dashboard
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Tạo và quản lý nội dung học tập</p>
            </div>
          </div>
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all"
              >
                <span className="hidden sm:inline">Admin Panel</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-2">
            <nav className="space-y-0.5 sticky top-24 bg-card rounded-2xl border border-border/40 p-2 shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-1.5">
                Navigation
              </p>
              {sidebarItems.map((item, i) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'animate-fade-slide-up w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                      `stagger-${Math.min(i + 1, 6)}`,
                      isActive
                        ? 'text-white shadow-md db-nav-active-bar'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5'
                    )}
                    style={isActive ? {
                      backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    } : undefined}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-accent'
                    )}>
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
                    </div>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-10">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <TeacherMobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default TeacherDashboard;
