import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, BookOpen, Loader2 } from 'lucide-react';
import { useClassCourses, useAvailableCourses, useAddCourseToClass, useRemoveCourseFromClass } from '../hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CoursesTabProps {
  classId: string;
  isManager: boolean;
}

const CoursesTab = ({ classId, isManager }: CoursesTabProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: classCourses, isLoading } = useClassCourses(classId);
  const { data: availableCourses } = useAvailableCourses(classId);
  const addCourse = useAddCourseToClass();
  const removeCourse = useRemoveCourseFromClass();

  const handleAdd = async (courseId: string) => {
    await addCourse.mutateAsync({ classId, courseId });
    setIsAddOpen(false);
  };

  const handleRemove = async (courseId: string) => {
    await removeCourse.mutateAsync({ classId, courseId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {isManager && (
        <div className="flex justify-end mb-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm khóa học
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Thêm khóa học vào lớp</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {!availableCourses || availableCourses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Không có khóa học nào để thêm
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleAdd(course.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            {course.image_url ? (
                              <img src={course.image_url} alt={`Ảnh khóa học ${course.title}`} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.lesson_count || 0} bài học
                            </p>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!classCourses || classCourses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có khóa học nào</h3>
            <p className="text-muted-foreground">
              {isManager ? 'Thêm khóa học vào lớp để học viên có thể truy cập' : 'Giáo viên chưa thêm khóa học vào lớp'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classCourses.map((cc) => (
            <Card key={cc.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {cc.course?.image_url ? (
                  <img 
                    src={cc.course.image_url} 
                    alt={cc.course?.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {isManager && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemove(cc.course_id)}
                    aria-label={`Gỡ khóa học ${cc.course?.title || 'này'} khỏi lớp`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">
                  {cc.course?.title || 'Khóa học'}
                </CardTitle>
                <CardDescription>
                  {cc.course?.lesson_count || 0} bài học
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={`/course/${cc.course_id}`}>
                  <Button variant="outline" className="w-full">
                    Xem khóa học
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesTab;
