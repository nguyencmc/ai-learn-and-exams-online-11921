import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, LogIn, RefreshCw } from 'lucide-react';
import { usePracticeTodayData } from './usePracticeTodayData';
import { PracticeInProgressCard } from './PracticeInProgressCard';
import { PracticeWrongAnswersCard } from './PracticeWrongAnswersCard';
import { PracticeQuickActions } from './PracticeQuickActions';
import { PracticeRecommendationCard } from './PracticeRecommendationCard';

export const PracticeTodayWidget = () => {
  const navigate = useNavigate();
  const {
    user, loading, smartLoading,
    inProgressSession, wrongAnswers, lastPracticeSet,
    smartRecs, smartSummary,
    fetchData, computeSmartRecommendations,
  } = usePracticeTodayData();

  const handleContinueExam = () => {
    if (inProgressSession) navigate(`/practice/exam/${inProgressSession.set_id}`, { state: { sessionId: inProgressSession.id } });
  };
  const handleReviewWrong = () => navigate('/practice/review');
  const handleQuickPractice = () => {
    if (lastPracticeSet) navigate(`/practice/setup/${lastPracticeSet.id}`, { state: { quickStart: true, questionCount: 10 } });
  };

  if (!user) {
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Hôm nay học gì?
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Luyện tập mỗi ngày để tiến bộ</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="text-center py-4 sm:py-6">
            <LogIn className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Đăng nhập để theo dõi tiến độ</p>
            <Link to="/auth">
              <Button size="sm"><LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Đăng nhập</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />Hôm nay học gì?
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Luyện tập mỗi ngày để tiến bộ</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Hôm nay học gì?</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Luyện tập mỗi ngày để tiến bộ</CardDescription>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => { fetchData(); computeSmartRecommendations(); }}
            disabled={loading || smartLoading}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${(loading || smartLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
        <PracticeInProgressCard inProgressSession={inProgressSession} onContinueExam={handleContinueExam} />
        <PracticeWrongAnswersCard wrongAnswers={wrongAnswers} onReviewWrong={handleReviewWrong} />
        <PracticeQuickActions lastPracticeSet={lastPracticeSet} onQuickPractice={handleQuickPractice} />
        <PracticeRecommendationCard
          smartRecs={smartRecs}
          smartSummary={smartSummary}
          smartLoading={smartLoading}
          onRefresh={computeSmartRecommendations}
        />
      </CardContent>
    </Card>
  );
};
