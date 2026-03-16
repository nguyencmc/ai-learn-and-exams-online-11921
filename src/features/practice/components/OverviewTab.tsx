import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle,
  BrainCircuit,
  TrendingUp,
  Clock,
  Trophy,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { usePracticeStats } from '../hooks/usePracticeStats';
import { useReviewWrong } from '../hooks/useReviewWrong';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function OverviewTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading } = usePracticeStats();
  const { wrongCount, isLoading: wrongLoading } = useReviewWrong();

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/practice/setup/${stats.mostPracticedSet!.set_id}`)}
            >
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
                      <span
                        className={`text-lg font-bold ${scorePercent >= 80 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                      >
                        {scorePercent}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/practice/result/${exam.id}`)}
                      >
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
