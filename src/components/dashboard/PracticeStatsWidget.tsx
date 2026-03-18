import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeStats } from '@/features/practice/hooks/usePracticeStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Target, 
  BookOpen,
  TrendingUp,
  RefreshCw,
  LogIn,
  ChevronRight
} from 'lucide-react';

export const PracticeStatsWidget = memo(() => {
  const { user } = useAuth();
  const { stats, loading, refetch } = usePracticeStats();

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Not logged in
  if (!user) {
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Thống kê luyện thi
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="text-center py-4 sm:py-6">
            <LogIn className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              Đăng nhập để xem thống kê
            </p>
            <Link to="/auth">
              <Button size="sm">Đăng nhập</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Thống kê luyện thi
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
          <Skeleton className="h-20 sm:h-24 w-full" />
          <Skeleton className="h-14 sm:h-16 w-full" />
          <Skeleton className="h-14 sm:h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = stats.accuracy7Days.totalAttempts > 0 || stats.recentExams.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Thống kê luyện thi</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tiến độ 7 ngày gần nhất</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0 flex-shrink-0"
            aria-label="Làm mới thống kê luyện thi"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4 sm:space-y-6">
        {!hasData ? (
          <div className="text-center py-6 sm:py-8">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Bạn chưa làm bài nào</p>
            <Link to="/practice">
              <Button variant="outline" size="sm">
                Bắt đầu luyện tập
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* A) 7-day Accuracy */}
            <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-foreground text-sm sm:text-base">Độ chính xác 7 ngày</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.accuracy7Days.correctAttempts}/{stats.accuracy7Days.totalAttempts} câu đúng
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xl sm:text-2xl font-bold ${getAccuracyColor(stats.accuracy7Days.accuracy)}`}>
                    {stats.accuracy7Days.accuracy}%
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress value={stats.accuracy7Days.accuracy} className="h-1.5 sm:h-2" />
                <div 
                  className={`absolute top-0 left-0 h-1.5 sm:h-2 rounded-full transition-all ${getProgressColor(stats.accuracy7Days.accuracy)}`}
                  style={{ width: `${stats.accuracy7Days.accuracy}%` }}
                />
              </div>
            </div>

            {/* B) Link to Exam History */}
            <Link to="/history" className="block">
              <div className="p-3 sm:p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                      Lịch sử làm bài
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {stats.recentExams.length > 0 
                        ? `${stats.recentExams.length} bài thi gần đây`
                        : 'Xem các bài thi đã làm'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>

            {/* C) Most Practiced Set */}
            {stats.mostPracticedSet && (
              <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-xs sm:text-sm">Bộ đề luyện nhiều nhất</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {stats.mostPracticedSet.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                    {stats.mostPracticedSet.attempt_count} lượt
                  </Badge>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

PracticeStatsWidget.displayName = 'PracticeStatsWidget';
