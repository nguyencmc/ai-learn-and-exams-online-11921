import { memo, useState, useEffect, useCallback} from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Flame, 
  Bell,
  ChevronRight,
  Zap,
  Trophy,
} from 'lucide-react';
import { PracticeTodayWidget } from '@/components/dashboard/practiceTodayWidget';
import { PracticeStatsWidget } from '@/components/dashboard/PracticeStatsWidget';
import { cn } from '@/lib/utils';

interface DashboardSuggestionsProps {
  streak: number;
  level: number;
  points: number;
  pointsToNextLevel: number;
  levelProgress: number;
}

export const DashboardSuggestions = memo(function DashboardSuggestions({
  streak,
  level,
  points,
  pointsToNextLevel,
  levelProgress,
}: DashboardSuggestionsProps) {
  const { user } = useAuth();
  const [dueFlashcards, setDueFlashcards] = useState(0);

  const fetchNotifications = useCallback(async () => {
    // Fetch due flashcards count
    const { count: dueCount } = await supabase
      .from('user_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .lte('next_review_at', new Date().toISOString());

    setDueFlashcards(dueCount || 0);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Calculate streak reward milestones
  const nextStreakMilestone = Math.ceil(streak / 7) * 7;
  const streakProgress = (streak % 7) / 7 * 100;

  // Level badge color
  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-amber-500 bg-amber-500/10';
    if (level >= 30) return 'text-purple-500 bg-purple-500/10';
    if (level >= 20) return 'text-blue-500 bg-blue-500/10';
    if (level >= 10) return 'text-green-500 bg-green-500/10';
    return 'text-primary bg-primary/10';
  };

  return (
    <aside className="space-y-4">
      {/* Streak & Level Card - Enhanced */}
      <Card className="border-border/50 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-4 space-y-4 relative">
          {/* Streak Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center relative",
                streak > 0 ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-muted"
              )}>
                <Flame className={cn("w-7 h-7", streak > 0 ? "text-white" : "text-muted-foreground")} />
                {streak >= 7 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{streak}</p>
                <p className="text-xs text-muted-foreground">ngày liên tiếp</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Mục tiêu</p>
                <p className="text-sm font-semibold text-orange-500">{nextStreakMilestone} ngày</p>
              </div>
            )}
          </div>
          
          {streak > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tiến độ milestone</span>
                <span>{streak % 7}/7</span>
              </div>
              <Progress value={streakProgress} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-yellow-500" />
            </div>
          )}
          
          {/* Level Section */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getLevelColor(level))}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-lg">Level {level}</span>
                  <p className="text-[10px] text-muted-foreground leading-none">
                    {points.toLocaleString()} XP
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                +{pointsToNextLevel} → Lv.{level + 1}
              </Badge>
            </div>
            <Progress 
              value={levelProgress} 
              className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-purple-500" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Practice Today Widget - Hôm nay học gì */}
      <PracticeTodayWidget />

      {/* Practice Stats Widget - Thống kê luyện tập */}
      <PracticeStatsWidget />

      {/* Notifications / Reminders */}
      {(dueFlashcards > 0) && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-3">
            <Link to="/flashcards/today" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bạn có {dueFlashcards} thẻ cần ôn!</p>
                <p className="text-xs text-muted-foreground">Ôn ngay để không quên</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      )}

    </aside>
  );
});

DashboardSuggestions.displayName = 'DashboardSuggestions';
