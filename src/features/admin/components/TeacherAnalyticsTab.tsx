import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Layers,
  GraduationCap,
  Star,
  Users,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TeacherStats, CourseWithStats, StudentSummary } from '@/features/admin/types';

interface TeacherAnalyticsTabProps {
  stats: TeacherStats;
  myCourses: CourseWithStats[];
  myStudents?: StudentSummary[];
}

function buildEnrollmentTrend(students: StudentSummary[]) {
  const now = new Date();
  const weeks: { week: string; students: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const label = `T${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

    const newThisWeek = students.filter((s) => {
      const courseSource = s.sources.find((src) => src.type === 'course');
      const activity = courseSource?.last_activity ?? s.last_activity;
      if (!activity) return false;
      const d = new Date(activity);
      return d >= weekStart && d <= weekEnd;
    }).length;

    weeks.push({ week: label, students: newThisWeek });
  }
  return weeks;
}

export function TeacherAnalyticsTab({ stats, myCourses, myStudents = [] }: TeacherAnalyticsTabProps) {
  const enrollmentTrend = useMemo(() => buildEnrollmentTrend(myStudents), [myStudents]);

  const courseRatingData = useMemo(() => {
    return myCourses
      .filter((c) => c.rating != null)
      .slice(0, 6)
      .map((c) => ({
        name: c.title.length > 14 ? c.title.slice(0, 14) + '…' : c.title,
        rating: c.rating ? Number(c.rating.toFixed(1)) : 0,
        students: c.student_count || 0,
      }));
  }, [myCourses]);

  const completedStudents = myStudents.filter((s) =>
    s.sources.some((src) => src.type === 'course' && src.progress >= 100)
  ).length;
  const courseStudentCount = myStudents.filter((s) =>
    s.sources.some((src) => src.type === 'course')
  ).length;
  const completionRate =
    courseStudentCount > 0 ? Math.round((completedStudents / courseStudentCount) * 100) : 0;

  const publishedCount = myCourses.filter((c) => c.is_published).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Phân tích & Thống kê</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Tổng học viên</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.avgRating || '-'}</p>
                <p className="text-xs text-muted-foreground">Đánh giá TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Hoàn thành khóa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{publishedCount}</p>
                <p className="text-xs text-muted-foreground">Đã xuất bản</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Học viên đăng ký mới theo tuần
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myStudents.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={enrollmentTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [v, 'Học viên mới']}
                  />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đánh giá trung bình theo khóa học
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseRatingData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={courseRatingData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} allowDecimals />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [v.toFixed(1), 'Đánh giá']}
                  />
                  <Bar dataKey="rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Nội dung đã tạo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Khóa học</span>
                    <span className="font-medium">{stats.totalCourses}</span>
                  </div>
                  <Progress value={Math.min(stats.totalCourses * 10, 100)} className="h-1.5" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Đề thi</span>
                    <span className="font-medium">{stats.totalExams}</span>
                  </div>
                  <Progress value={Math.min(stats.totalExams * 5, 100)} className="h-1.5" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Flashcard</span>
                    <span className="font-medium">{stats.totalFlashcardSets}</span>
                  </div>
                  <Progress value={Math.min(stats.totalFlashcardSets * 5, 100)} className="h-1.5" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Lớp học</span>
                    <span className="font-medium">{stats.totalClasses}</span>
                  </div>
                  <Progress value={Math.min(stats.totalClasses * 10, 100)} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
