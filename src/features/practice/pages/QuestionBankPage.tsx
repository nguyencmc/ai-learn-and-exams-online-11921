import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Filter,
  BookOpen,
  BrainCircuit,
  TrendingUp,
  Clock,
  Trophy,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePracticeStats } from '../hooks/usePracticeStats';
import { useQuestionSets } from '../hooks/useQuestionSets';
import { useReviewWrong } from '../hooks/useReviewWrong';

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

// ── Shared card component ──────────────────────────────────────────────────
function QuestionSetCard({
  set,
  isOwner = false,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  set: QuestionSet;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublish?: () => void;
}) {
  const navigate = useNavigate();
  const getLevelBadge = (level: string) => {
    if (level === 'easy') return { label: 'Dễ', variant: 'secondary' as const };
    if (level === 'hard') return { label: 'Khó', variant: 'destructive' as const };
    return { label: 'Trung bình', variant: 'default' as const };
  };
  const levelInfo = getLevelBadge(set.level);

  return (
    <Card className="group hover:shadow-lg transition-all border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="relative p-4 pb-3 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileQuestion className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                  {set.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={levelInfo.variant} className="text-xs">
                    {levelInfo.label}
                  </Badge>
                  {isOwner && (
                    set.is_published ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Globe className="w-3 h-3" />Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />Private
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onTogglePublish}>
                    {set.is_published ? (
                      <><Lock className="w-4 h-4 mr-2" />Chuyển riêng tư</>
                    ) : (
                      <><Share2 className="w-4 h-4 mr-2" />Công khai</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 pt-2 space-y-3">
          {set.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{set.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />{set.question_count} câu hỏi
            </span>
          </div>
          {set.tags && set.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {set.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
              {set.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">+{set.tags.length - 3}</Badge>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" size="sm"
              onClick={() => navigate(`/practice/setup/${set.id}`)}>
              <PlayCircle className="mr-2 h-4 w-4" />Luyện tập
            </Button>
            <Button className="flex-1" size="sm"
              onClick={() => navigate(`/practice/exam-setup/${set.id}`)}>
              <FileCheck className="mr-2 h-4 w-4" />Thi thử
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Overview / Dashboard tab ───────────────────────────────────────────────
function OverviewTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading } = usePracticeStats();
  const { wrongCount, isLoading: wrongLoading } = useReviewWrong();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Đăng nhập để xem thống kê luyện tập</p>
        <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-all border-primary/20 bg-primary/5 hover:bg-primary/10 group"
          onClick={() => navigate('/practice/review')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Ôn lại câu sai</p>
              {wrongLoading ? (
                <Skeleton className="h-4 w-16 mt-1" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {wrongCount > 0 ? `${wrongCount} câu cần ôn` : 'Không có câu sai 🎉'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-all border-blue-500/20 hover:bg-blue-500/5 group"
          onClick={() => navigate('/practice?tab=my-sets')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <PlayCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">Bộ đề của tôi</p>
              <p className="text-sm text-muted-foreground">Tạo & luyện tập</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-all border-amber-500/20 hover:bg-amber-500/5 group"
          onClick={() => navigate('/practice?tab=public')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <LayoutGrid className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold">Kho đề công khai</p>
              <p className="text-sm text-muted-foreground">Khám phá bộ đề</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-day accuracy */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Độ chính xác 7 ngày qua</h3>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {stats.accuracy7Days.accuracy}%
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-3 w-full" />
          ) : (
            <>
              <Progress value={stats.accuracy7Days.accuracy} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.accuracy7Days.correctAttempts}/{stats.accuracy7Days.totalAttempts} câu đúng
                {stats.accuracy7Days.totalAttempts === 0 && ' — chưa có dữ liệu'}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Most practiced set */}
      {!loading && stats.mostPracticedSet && (
        <Card>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bộ đề luyện nhiều nhất</p>
                <p className="font-semibold line-clamp-1">{stats.mostPracticedSet.title}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.mostPracticedSet.attempt_count} lần luyện trong 7 ngày
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => navigate(`/practice/setup/${stats.mostPracticedSet!.set_id}`)}>
              Luyện tiếp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent exams */}
      {!loading && stats.recentExams.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Lịch sử thi gần đây
          </h3>
          <div className="space-y-2">
            {stats.recentExams.map((exam) => {
              const scorePercent = exam.total_questions
                ? Math.round(((exam.correct_count || 0) / exam.total_questions) * 100)
                : 0;
              return (
                <Card key={exam.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {exam.set_title || 'Bộ đề không xác định'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exam.ended_at)} · {formatDuration(exam.duration_sec)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-lg font-bold ${scorePercent >= 80 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {scorePercent}%
                      </span>
                      <Button variant="ghost" size="sm"
                        onClick={() => navigate(`/practice/result/${exam.id}`)}>
                        Xem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!loading && stats.recentExams.length === 0 && stats.accuracy7Days.totalAttempts === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BrainCircuit className="mx-auto h-12 w-12 mb-3 opacity-30" />
          <p>Chưa có lịch sử luyện tập</p>
          <p className="text-sm mt-1">Bắt đầu luyện tập để theo dõi tiến độ!</p>
        </div>
      )}
    </div>
  );
}

// ── My Sets tab ────────────────────────────────────────────────────────────
function MySetsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMySets();
  }, [user]);

  const fetchMySets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('creator_id', user?.id)
      .order('created_at', { ascending: false });
    if (!error && data) setSets(data);
    setLoading(false);
  };

  const filteredSets = useMemo(
    () => sets.filter((s) => {
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = levelFilter === 'all' || s.level === levelFilter;
      return matchSearch && matchLevel;
    }),
    [sets, searchQuery, levelFilter]
  );

  const togglePublish = async (set: QuestionSet) => {
    const newStatus = !set.is_published;
    const { error } = await supabase.from('question_sets')
      .update({ is_published: newStatus }).eq('id', set.id);
    if (error) { toast.error('Không thể cập nhật trạng thái'); return; }
    setSets(prev => prev.map(s => s.id === set.id ? { ...s, is_published: newStatus } : s));
    toast.success(newStatus ? 'Đã công khai bộ đề' : 'Đã chuyển riêng tư');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('practice_questions').delete().eq('set_id', deleteId);
    const { error } = await supabase.from('question_sets').delete().eq('id', deleteId);
    if (error) { toast.error('Không thể xóa bộ đề'); }
    else { toast.success('Đã xóa bộ đề'); setSets(prev => prev.filter(s => s.id !== deleteId)); }
    setDeleting(false);
    setDeleteId(null);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Đăng nhập để quản lý bộ đề của bạn</p>
        <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
      </div>
    );
  }

  return (
    <>
      {/* Stats row */}
      {!loading && sets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng số bộ đề', value: sets.length, color: 'text-foreground' },
            { label: 'Tổng câu hỏi', value: sets.reduce((a, s) => a + (s.question_count || 0), 0), color: 'text-foreground' },
            { label: 'Đã công khai', value: sets.filter(s => s.is_published).length, color: 'text-green-600' },
            { label: 'Riêng tư', value: sets.filter(s => !s.is_published).length, color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm bộ đề..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate('/practice/create')}>
          <Plus className="w-4 h-4 mr-2" />Tạo bộ đề
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredSets.length === 0 && (
        <div className="text-center py-12">
          <FileQuestion className="w-14 h-14 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || levelFilter !== 'all' ? 'Không tìm thấy bộ đề' : 'Chưa có bộ đề nào'}
          </h3>
          <p className="text-muted-foreground mb-5 text-sm">
            {searchQuery || levelFilter !== 'all'
              ? 'Thử thay đổi từ khóa hoặc bộ lọc'
              : 'Tạo bộ đề đầu tiên để bắt đầu luyện tập'}
          </p>
          {!searchQuery && levelFilter === 'all' && (
            <Button onClick={() => navigate('/practice/create')}>
              <Plus className="w-4 h-4 mr-2" />Tạo bộ đề đầu tiên
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filteredSets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <QuestionSetCard key={set.id} set={set} isOwner
              onEdit={() => navigate(`/practice/edit/${set.id}`)}
              onDelete={() => setDeleteId(set.id)}
              onTogglePublish={() => togglePublish(set)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bộ đề?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả câu hỏi sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Public Sets tab ────────────────────────────────────────────────────────
function PublicSetsTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const { data: sets, isLoading } = useQuestionSets(
    levelFilter !== 'all' ? { level: levelFilter } : undefined
  );

  const filteredSets = useMemo(
    () => (sets || []).filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sets, searchQuery]
  );

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm bộ đề công khai..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      )}

      {!isLoading && filteredSets.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-14 h-14 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy bộ đề</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hiện chưa có bộ đề công khai nào'}
          </p>
        </div>
      )}

      {!isLoading && filteredSets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <QuestionSetCard key={set.id} set={set as QuestionSet} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function QuestionBankPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lấy tab từ URL search params nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'overview';

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Luyện tập
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý bộ đề, luyện tập và theo dõi tiến độ
            </p>
          </div>
          {user && (
            <Button onClick={() => navigate('/practice/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bộ đề mới
            </Button>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="my-sets" className="gap-1.5">
              <FileQuestion className="h-4 w-4" />
              Của tôi
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1.5">
              <Globe className="h-4 w-4" />
              Kho đề
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="my-sets">
            <MySetsTab />
          </TabsContent>

          <TabsContent value="public">
            <PublicSetsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
