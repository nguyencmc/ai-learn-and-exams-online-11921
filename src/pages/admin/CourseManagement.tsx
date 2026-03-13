import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  GraduationCap, 
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Users,
  Clock,
  Star,
  Eye,
  EyeOff,
  MoreVertical
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { logger } from '@/lib/logger';

const log = logger('CourseManagement');

interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: string;
  creator_id: string | null;
  creator_name: string | null;
  price: number | null;
  student_count: number | null;
  rating: number | null;
  rating_count: number | null;
  lesson_count: number | null;
  duration_hours: number | null;
  level: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  image_url: string | null;
}

interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

const CourseManagement = () => {
  const { user } = useAuth();
  const { isAdmin, hasPermission, canEditOwn, canDeleteOwn, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const canView = hasPermission('courses.view');
  const canCreate = hasPermission('courses.create');
  const canEdit = hasPermission('courses.edit');
  const canDelete = hasPermission('courses.delete');
  const canPublish = hasPermission('courses.publish');

  useEffect(() => {
    if (!roleLoading && !canView) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền xem khóa học",
        variant: "destructive",
      });
    }
  }, [canView, roleLoading, navigate, toast]);

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  const fetchData = async () => {
    setLoading(true);
    
    let coursesQuery = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    // If not admin, only show own courses
    if (!isAdmin && hasPermission('courses.edit_own') && user) {
      coursesQuery = coursesQuery.eq('creator_id', user.id);
    }

    const [{ data: coursesData }, { data: categoriesData }] = await Promise.all([
      coursesQuery,
      supabase.from('course_categories').select('id, name, slug'),
    ]);

    setCourses(coursesData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  };

  const handleDelete = async (courseId: string) => {
    // Get course info for audit log
    const courseToDelete = courses.find(c => c.id === courseId);

    // First delete all sections (lessons will be deleted via cascade)
    const { error: sectionsError } = await supabase
      .from('course_sections')
      .delete()
      .eq('course_id', courseId);

    if (sectionsError) {
      log.error('Error deleting sections', sectionsError);
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa khóa học",
        variant: "destructive",
      });
      return;
    }

    // Create audit log
    await createAuditLog(
      'delete',
      'course',
      courseId,
      { title: courseToDelete?.title, slug: courseToDelete?.slug, lesson_count: courseToDelete?.lesson_count },
      null
    );

    toast({
      title: "Thành công",
      description: "Đã xóa khóa học",
    });
    
    fetchData();
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !currentStatus })
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thành công",
      description: currentStatus ? "Đã ẩn khóa học" : "Đã xuất bản khóa học",
    });
    
    fetchData();
  };

  const toggleFeatured = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_featured: !currentStatus })
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thành công",
      description: currentStatus ? "Đã bỏ nổi bật" : "Đã đặt nổi bật",
    });
    
    fetchData();
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.creator_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'published' && course.is_published) ||
      (filterStatus === 'draft' && !course.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getLevelBadge = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Cơ bản</Badge>;
      case 'intermediate':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Trung bình</Badge>;
      case 'advanced':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600">Nâng cao</Badge>;
      default:
        return <Badge variant="outline">Chưa xác định</Badge>;
    }
  };

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

  if (!canView) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={isAdmin ? "/admin" : "/teacher"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                Quản lý khóa học
              </h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? `${courses.length} khóa học` : `${courses.length} khóa học của bạn`}
              </p>
            </div>
          </div>
          {canCreate && (
            <Link to="/admin/courses/create">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Tạo khóa học mới
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Table - Desktop */}
        <Card className="border-border/50 hidden md:block">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-4">
                  {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
                    ? 'Không tìm thấy khóa học nào' 
                    : 'Chưa có khóa học nào'}
                </p>
                <Link to="/admin/courses/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo khóa học đầu tiên
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Khóa học</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Cấp độ</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.image_url ? (
                            <img 
                              src={course.image_url} 
                              alt={course.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                              <GraduationCap className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.lesson_count || 0} bài học • {course.duration_hours || 0}h
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{course.creator_name || 'Chưa xác định'}</span>
                      </TableCell>
                      <TableCell>{getLevelBadge(course.level)}</TableCell>
                      <TableCell>
                        {course.price && course.price > 0 ? (
                          <span className="font-medium">{course.price.toLocaleString()}đ</span>
                        ) : (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">Miễn phí</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {course.student_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{(course.rating || 0).toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">
                            ({course.rating_count || 0})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {course.is_published ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Eye className="w-3 h-3 mr-1" />
                              Công khai
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Nháp
                            </Badge>
                          )}
                          {course.is_featured && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              <Star className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/courses/${course.id}`} className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => togglePublish(course.id, course.is_published || false)}
                            >
                              {course.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Ẩn khóa học
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xuất bản
                                </>
                              )}
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem 
                                onClick={() => toggleFeatured(course.id, course.is_featured || false)}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                {course.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                              </DropdownMenuItem>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động này không thể hoàn tác. Tất cả nội dung khóa học sẽ bị xóa.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(course.id)}>
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Courses Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Không tìm thấy khóa học nào' 
                  : 'Chưa có khóa học nào'}
              </p>
              <Link to="/admin/courses/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo khóa học đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Card key={course.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {course.image_url ? (
                      <img 
                        src={course.image_url} 
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.creator_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.student_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {(course.rating || 0).toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration_hours || 0}h
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/courses/${course.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => togglePublish(course.id, course.is_published || false)}
                        >
                          {course.is_published ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Ẩn khóa học
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Xuất bản
                            </>
                          )}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(course.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      {course.is_published ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">Công khai</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Nháp</Badge>
                      )}
                      {getLevelBadge(course.level)}
                    </div>
                    {course.price && course.price > 0 ? (
                      <span className="font-semibold text-primary">{course.price.toLocaleString()}đ</span>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">Miễn phí</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseManagement;
