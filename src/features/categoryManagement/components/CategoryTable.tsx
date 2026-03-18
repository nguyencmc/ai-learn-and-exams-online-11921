import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  FileText,
  Headphones,
  BookOpen,
  GripVertical,
} from 'lucide-react';
import type {
  BaseCategory,
  CategoryType,
  ExamCategory,
  PodcastCategory,
  BookCategory,
} from '../types';

interface CategoryTableProps {
  activeTab: CategoryType;
  categories: BaseCategory[];
  loading: boolean;
  onCreateClick: () => void;
  onEditClick: (category: BaseCategory) => void;
  onDeleteClick: (categoryId: string) => void;
}

function getTabIcon(type: CategoryType) {
  switch (type) {
    case 'exam': return <FileText className="w-4 h-4" />;
    case 'podcast': return <Headphones className="w-4 h-4" />;
    case 'book': return <BookOpen className="w-4 h-4" />;
  }
}

function getItemCount(category: BaseCategory, activeTab: CategoryType) {
  if (activeTab === 'exam') {
    return (category as ExamCategory).exam_count || 0;
  } else if (activeTab === 'podcast') {
    return (category as PodcastCategory).podcast_count || 0;
  } else {
    return (category as BookCategory).book_count || 0;
  }
}

export function CategoryTable({
  activeTab,
  categories,
  loading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: CategoryTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTabIcon(activeTab)}
          Danh mục {activeTab === 'exam' ? 'Đề thi' : activeTab === 'podcast' ? 'Podcast' : 'Sách'}
        </CardTitle>
        <CardDescription>
          Quản lý các danh mục để phân loại nội dung
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Chưa có danh mục nào</p>
            <Button onClick={onCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo danh mục đầu tiên
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Nổi bật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {category.icon_url && (
                        <img src={category.icon_url} alt={`Biểu tượng danh mục ${category.name}`} className="w-6 h-6 rounded" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{getItemCount(category, activeTab)}</span>
                  </TableCell>
                  <TableCell>
                    {category.is_featured ? (
                      <span className="text-primary">✓</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClick(category)}
                        aria-label={`Chỉnh sửa danh mục ${category.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Xóa danh mục ${category.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Danh mục &quot;{category.name}&quot; sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteClick(category.id)}>
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
