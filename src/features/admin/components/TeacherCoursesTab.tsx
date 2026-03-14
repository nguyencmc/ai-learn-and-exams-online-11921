import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  ChevronRight,
  Plus,
  Users,
  Star,
} from 'lucide-react';
import type { CourseWithStats } from '@/features/admin/types';

interface TeacherCoursesTabProps {
  myCourses: CourseWithStats[];
  canCreateCourses: boolean;
}

export function TeacherCoursesTab({ myCourses, canCreateCourses }: TeacherCoursesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Khóa học của tôi</h2>
        {canCreateCourses && (
          <Link to="/admin/courses/create">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo khóa học
            </Button>
          </Link>
        )}
      </div>

      {myCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có khóa học nào</h3>
            <p className="text-muted-foreground mb-4">Tạo khóa học đầu tiên để bắt đầu</p>
            {canCreateCourses && (
              <Link to="/admin/courses/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo khóa học
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {myCourses.map((course) => (
            <Link key={course.id} to={`/admin/courses/${course.id}`}>
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${course.is_published ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {course.is_published ? 'Đã xuất bản' : 'Nháp'}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1 mb-2">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.student_count || 0}
                    </span>
                    {course.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {course.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Link to="/admin/courses">
          <Button variant="outline">
            Xem tất cả khóa học
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
