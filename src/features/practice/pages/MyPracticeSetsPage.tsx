import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Target,
  Plus,
  FileQuestion,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Lock,
  Globe,
  PlayCircle,
  Search,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionSet {
  id: string;
  title: string;
  description: string | null;
  level: string;
  question_count: number;
  is_published: boolean;
  created_at: string;
  tags: string[];
}

export default function MyPracticeSetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMySets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('creator_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSets(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMySets();
  }, [user, navigate, fetchMySets]);

  const togglePublish = async (set: QuestionSet) => {
    const newStatus = !set.is_published;
    const { error } = await supabase
      .from('question_sets')
      .update({ is_published: newStatus })
      .eq('id', set.id);

    if (error) {
      toast.error('Không thể cập nhật trạng thái');
      return;
    }

    setSets(prev =>
      prev.map(s => (s.id === set.id ? { ...s, is_published: newStatus } : s))
    );

    toast.success(
      newStatus
        ? 'Đề thi đã được công khai'
        : 'Đề thi đã chuyển sang riêng tư'
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    await supabase.from('practice_questions').delete().eq('set_id', deleteId);
    const { error } = await supabase
      .from('question_sets')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Không thể xóa bộ đề');
    } else {
      toast.success('Đã xóa bộ đề');
      setSets(prev => prev.filter(s => s.id !== deleteId));
    }

    setDeleting(false);
    setDeleteId(null);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'easy':
        return { label: 'Dễ', variant: 'secondary' as const };
      case 'medium':
        return { label: 'Trung bình', variant: 'default' as const };
      case 'hard':
        return { label: 'Khó', variant: 'destructive' as const };
      default:
        return { label: level, variant: 'outline' as const };
    }
  };

  const filteredSets = sets.filter(
    set =>
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Bộ đề của tôi
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các bộ đề luyện tập cá nhân
            </p>
          </div>
          <Button onClick={() => navigate('/practice/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo bộ đề mới
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bộ đề..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredSets.length === 0 && (
          <div className="text-center py-16">
            <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'Không tìm thấy bộ đề' : 'Chưa có bộ đề nào'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Thử tìm với từ khóa khác'
                : 'Tạo bộ đề đầu tiên để bắt đầu luyện tập'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/practice/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo bộ đề đầu tiên
              </Button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && filteredSets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSets.map(set => {
              const levelBadge = getLevelBadge(set.level);
              return (
                <Card key={set.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {set.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 shrink-0">
                        {set.is_published ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/practice/edit/${set.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish(set)}>
                              {set.is_published ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Chuyển riêng tư
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Công khai (chia sẻ)
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(set.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {set.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {set.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-4 h-4" />
                        {set.question_count} câu
                      </span>
                    </div>

                    {set.tags && set.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {set.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {set.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{set.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/practice/setup/${set.id}`)}
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Luyện tập
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/practice/exam-setup/${set.id}`)}
                      >
                        <FileCheck className="w-4 h-4 mr-1" />
                        Thi thử
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bộ đề?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả câu hỏi trong bộ đề sẽ bị
              xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
