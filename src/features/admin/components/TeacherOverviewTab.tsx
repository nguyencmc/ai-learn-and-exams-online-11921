import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Headphones,
  Layers,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Users,
  Star,
  Clock,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Users2,
  ClipboardCheck,
} from 'lucide-react';
import type { TeacherStats, RecentItem, ClassWithStats, StudentSummary } from '@/features/admin/types';

interface QuickCreateItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  enabled: boolean;
}

interface TeacherOverviewTabProps {
  stats: TeacherStats;
  recentItems: RecentItem[];
  loading: boolean;
  quickCreateItems: QuickCreateItem[];
  myClasses?: ClassWithStats[];
  myStudents?: StudentSummary[];
  onGoToTab?: (tab: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function getTypeIcon(type: RecentItem['type']) {
  switch (type) {
    case 'exam': return FileText;
    case 'course': return GraduationCap;
    case 'flashcard': return Layers;
    case 'podcast': return Headphones;
    case 'class': return Users;
    default: return BookOpen;
  }
}

function getTypeColor(type: RecentItem['type']): string {
  switch (type) {
    case 'exam': return 'text-purple-500 bg-purple-500/10';
    case 'course': return 'text-cyan-500 bg-cyan-500/10';
    case 'flashcard': return 'text-orange-500 bg-orange-500/10';
    case 'podcast': return 'text-pink-500 bg-pink-500/10';
    case 'class': return 'text-indigo-500 bg-indigo-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
}

function isInactive(dateString: string | null): boolean {
  if (!dateString) return true;
  return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)) > 7;
}

export function TeacherOverviewTab({
  stats,
  recentItems,
  loading,
  quickCreateItems,
  myClasses = [],
  myStudents = [],
  onGoToTab,
}: TeacherOverviewTabProps) {
  const inactiveStudents = myStudents.filter((s) => isInactive(s.last_activity)).length;
  const closedClasses = myClasses.filter((c) => !c.is_active).length;
  const totalPendingGrading = myClasses.reduce((sum, c) => sum + c.pending_grading, 0);
  const hasAlerts = inactiveStudents > 0 || closedClasses > 0 || totalPendingGrading > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Khóa học</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Users2 className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
                <p className="text-sm text-muted-foreground">Lớp học</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Học viên</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating || '-'}</p>
                <p className="text-sm text-muted-foreground">Đánh giá TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!loading && hasAlerts && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Cần xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {totalPendingGrading > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <ClipboardCheck className="w-3.5 h-3.5 inline-block text-red-500" />
                    {totalPendingGrading} bài tập chờ chấm
                  </span>
                  {onGoToTab && (
                    <button
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      onClick={() => onGoToTab('classes')}
                    >
                      Xem &rsaquo;
                    </button>
                  )}
                </div>
              )}
              {inactiveStudents > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {inactiveStudents} học sinh không hoạt động 7 ngày
                  </span>
                  {onGoToTab && (
                    <button
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      onClick={() => onGoToTab('students')}
                    >
                      Xem &rsaquo;
                    </button>
                  )}
                </div>
              )}
              {closedClasses > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    {closedClasses} lớp học đã đóng
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tạo nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickCreateItems.filter((item) => item.enabled).map((item) => (
              <Link key={item.href} to={item.href}>
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có hoạt động nào</p>
              <p className="text-sm mt-1">Bắt đầu tạo nội dung mới!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => {
                const Icon = getTypeIcon(item.type);
                const colorClass = getTypeColor(item.type);
                const [textColor, bgColor] = colorClass.split(' ');
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.type === 'course' ? `/admin/courses/${item.id}` : `/admin/${item.type}s/${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.stats || formatDate(item.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
