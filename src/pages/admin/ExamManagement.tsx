import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import {
  FileText, Plus, Search, Edit, Trash2, ArrowLeft,
  Users, HelpCircle, Clock, Camera, CameraOff,
  Filter, Zap, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';

interface Exam {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  question_count: number | null;
  attempt_count: number | null;
  difficulty: string | null;
  duration_minutes: number | null;
  created_at: string;
  category_id: string | null;
  is_proctored: boolean;
}

interface ExamCategory {
  id: string;
  name: string;
  slug: string;
}

const DIFFICULTY_CFG: Record<string, { label: string; cls: string }> = {
  easy:        { label: 'Dễ',       cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  beginner:    { label: 'Dễ',       cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  medium:      { label: 'Trung bình', cls: 'bg-amber-500/10   text-amber-600   border-amber-500/20' },
  intermediate:{ label: 'Trung bình', cls: 'bg-amber-500/10   text-amber-600   border-amber-500/20' },
  hard:        { label: 'Khó',      cls: 'bg-rose-500/10   text-rose-600    border-rose-500/20' },
  advanced:    { label: 'Khó',      cls: 'bg-rose-500/10   text-rose-600    border-rose-500/20' },
};

const ExamManagement = () => {
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canView   = hasPermission('exams.view');
  const canCreate = hasPermission('exams.create');

  useEffect(() => {
    if (!roleLoading && !canView) {
      navigate('/');
      toast({ title: 'Không có quyền truy cập', variant: 'destructive' });
    }
  }, [canView, roleLoading, navigate, toast]);

  useEffect(() => {
    if (canView && user) fetchData();
  }, [canView, user]);

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (!isAdmin && hasPermission('exams.edit_own')) q = q.eq('creator_id', user?.id);
    const [{ data: examsData }, { data: catsData }] = await Promise.all([
      q,
      supabase.from('exam_categories').select('id, name, slug'),
    ]);
    setExams((examsData || []).map(e => ({ ...e, is_proctored: (e as Record<string, unknown>).is_proctored as boolean ?? false })));
    setCategories(catsData || []);
    setLoading(false);
  };

  const handleDelete = async (examId: string) => {
    const examToDelete = exams.find(e => e.id === examId);
    await supabase.from('questions').delete().eq('exam_id', examId);
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa đề thi', variant: 'destructive' });
      return;
    }
    await createAuditLog('delete', 'exam', examId,
      { title: examToDelete?.title, slug: examToDelete?.slug }, null);
    toast({ title: 'Đã xóa đề thi' });
    fetchData();
  };

  const handleToggleProctoring = async (exam: Exam) => {
    setTogglingId(exam.id);
    const next = !exam.is_proctored;
    const { error } = await supabase
      .from('exams')
      .update({ is_proctored: next } as Record<string, unknown>)
      .eq('id', exam.id);
    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' });
    } else {
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_proctored: next } : e));
      toast({
        title: next ? '🎥 Đã bật giám sát' : '🚫 Đã tắt giám sát',
        description: exam.title.slice(0, 50),
      });
    }
    setTogglingId(null);
  };

  const getCategoryName = (id: string | null) =>
    id ? (categories.find(c => c.id === id)?.name ?? 'Không xác định') : 'Chưa phân loại';

  const filteredExams = exams.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiff = filterDifficulty === 'all' || e.difficulty === filterDifficulty;
    const matchCat  = filterCategory === 'all' || e.category_id === filterCategory;
    return matchSearch && matchDiff && matchCat;
  });

  const totalQ    = exams.reduce((s, e) => s + (e.question_count || 0), 0);
  const totalAtts = exams.reduce((s, e) => s + (e.attempt_count || 0), 0);
  const procCount = exams.filter(e => e.is_proctored).length;

  if (roleLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
  if (!canView) return null;

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={isAdmin ? '/admin' : '/teacher'}>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Quản lý đề thi
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {exams.length} đề thi · {totalQ.toLocaleString()} câu hỏi
              </p>
            </div>
          </div>
          {canCreate && (
            <Link to="/admin/exams/create">
              <Button className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                Tạo đề thi mới
              </Button>
            </Link>
          )}
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng đề thi',  value: exams.length,             icon: <BookOpen   className="w-4 h-4 text-primary" />,       cls: 'text-primary' },
            { label: 'Câu hỏi',      value: totalQ.toLocaleString(),   icon: <HelpCircle className="w-4 h-4 text-blue-500" />,       cls: 'text-blue-500' },
            { label: 'Lượt thi',     value: totalAtts.toLocaleString(),icon: <Users      className="w-4 h-4 text-purple-500" />,     cls: 'text-purple-500' },
            { label: 'Có giám sát',  value: procCount,                 icon: <Camera     className="w-4 h-4 text-orange-500" />,     cls: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className={cn('text-xl font-bold leading-none', s.cls)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đề thi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-40 h-9 gap-1.5">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả độ khó</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 h-9 gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || filterDifficulty !== 'all' || filterCategory !== 'all') && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground"
              onClick={() => { setSearchQuery(''); setFilterDifficulty('all'); setFilterCategory('all'); }}>
              Xoá lọc
            </Button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium mb-1">
                {searchQuery ? 'Không tìm thấy đề thi nào' : 'Chưa có đề thi nào'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Thử thay đổi bộ lọc.' : 'Hãy tạo đề thi đầu tiên.'}
              </p>
              {canCreate && (
                <Link to="/admin/exams/create">
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" />Tạo đề thi</Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground w-[34%]">Tên đề thi</TableHead>
                  <TableHead className="font-semibold text-foreground">Danh mục</TableHead>
                  <TableHead className="font-semibold text-foreground">Độ khó</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    <span className="flex items-center gap-1 justify-center">
                      <Clock className="w-3.5 h-3.5" />Thời gian
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    <span className="flex items-center gap-1 justify-center">
                      <HelpCircle className="w-3.5 h-3.5" />Câu hỏi
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    <span className="flex items-center gap-1 justify-center">
                      <Users className="w-3.5 h-3.5" />Lượt thi
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 justify-center cursor-help select-none">
                          <Camera className="w-3.5 h-3.5" />Giám sát
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Bật/tắt giám sát webcam khi học viên làm bài</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map(exam => {
                  const diff = DIFFICULTY_CFG[exam.difficulty ?? 'medium'] ?? DIFFICULTY_CFG.medium;
                  const cleanDesc = (exam.description ?? '')
                    .replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                  return (
                    <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Title */}
                      <TableCell>
                        <div>
                          <p className="font-medium leading-snug">{exam.title}</p>
                          {cleanDesc && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-xs">
                              {cleanDesc}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
                          {getCategoryName(exam.category_id)}
                        </Badge>
                      </TableCell>

                      {/* Difficulty */}
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs font-medium border', diff.cls)}>
                          {diff.label}
                        </Badge>
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="text-center text-sm tabular-nums">
                        {exam.duration_minutes ?? 60}
                        <span className="text-muted-foreground text-xs ml-0.5">ph</span>
                      </TableCell>

                      {/* Questions */}
                      <TableCell className="text-center text-sm font-medium tabular-nums">
                        {exam.question_count ?? 0}
                      </TableCell>

                      {/* Attempts */}
                      <TableCell className="text-center text-sm tabular-nums">
                        {(exam.attempt_count ?? 0).toLocaleString()}
                      </TableCell>

                      {/* Proctoring toggle */}
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-2">
                              {exam.is_proctored
                                ? <Camera className="w-3.5 h-3.5 text-orange-500" />
                                : <CameraOff className="w-3.5 h-3.5 text-muted-foreground/40" />}
                              <Switch
                                checked={exam.is_proctored}
                                disabled={togglingId === exam.id}
                                onCheckedChange={() => handleToggleProctoring(exam)}
                                className="data-[state=checked]:bg-orange-500"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {exam.is_proctored
                              ? 'Giám sát đang BẬT — click để tắt'
                              : 'Giám sát đang TẮT — click để bật'}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {new Date(exam.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/admin/exams/${exam.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Chỉnh sửa</TooltipContent>
                          </Tooltip>

                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>Xoá đề thi</TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa đề thi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Toàn bộ câu hỏi trong <strong>"{exam.title}"</strong> sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(exam.id)}>
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {filteredExams.length > 0 && filteredExams.length < exams.length && (
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Hiển thị {filteredExams.length} / {exams.length} đề thi
          </p>
        )}

      </main>
    </div>
    </TooltipProvider>
  );
};

export default ExamManagement;
