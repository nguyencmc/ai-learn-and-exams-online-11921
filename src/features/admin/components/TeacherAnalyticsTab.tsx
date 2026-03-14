import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Layers,
  GraduationCap,
  Star,
  Award,
} from 'lucide-react';
import type { TeacherStats, CourseWithStats } from '@/features/admin/types';

interface TeacherAnalyticsTabProps {
  stats: TeacherStats;
  myCourses: CourseWithStats[];
}

export function TeacherAnalyticsTab({ stats, myCourses }: TeacherAnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Phân tích & Thống kê</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Tổng quan hiệu suất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng học viên</span>
              <span className="font-semibold">{stats.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Đánh giá trung bình</span>
              <span className="font-semibold flex items-center gap-1">
                {stats.avgRating || '-'}
                <Star className="w-4 h-4 text-yellow-500" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Khóa học đã xuất bản</span>
              <span className="font-semibold">{myCourses.filter(c => c.is_published).length}/{stats.totalCourses}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Nội dung đã tạo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-cyan-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Khóa học</span>
                  <span className="font-medium">{stats.totalCourses}</span>
                </div>
                <Progress value={Math.min(stats.totalCourses * 10, 100)} className="h-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Đề thi</span>
                  <span className="font-medium">{stats.totalExams}</span>
                </div>
                <Progress value={Math.min(stats.totalExams * 5, 100)} className="h-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Flashcard</span>
                  <span className="font-medium">{stats.totalFlashcardSets}</span>
                </div>
                <Progress value={Math.min(stats.totalFlashcardSets * 5, 100)} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-8 text-center">
          <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Thống kê chi tiết đang phát triển</h3>
          <p className="text-sm text-muted-foreground">
            Biểu đồ xu hướng, doanh thu, và phân tích học viên sẽ sớm ra mắt
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
