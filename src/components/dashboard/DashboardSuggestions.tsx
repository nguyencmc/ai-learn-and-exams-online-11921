import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    if (!user?.id) return;
    const { count: dueCount } = await supabase
      .from('user_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString());
    setDueFlashcards(dueCount || 0);
  }, [user]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const nextStreakMilestone = Math.ceil(streak / 7) * 7;
  const streakProgress = (streak % 7) / 7 * 100;

  const getLevelColor = (level: number) => {
    if (level >= 50) return { text: 'text-amber-400',  bg: 'bg-amber-500/15',  grad: 'from-amber-500 to-orange-500' };
    if (level >= 30) return { text: 'text-purple-400', bg: 'bg-purple-500/15', grad: 'from-purple-500 to-violet-500' };
    if (level >= 20) return { text: 'text-blue-400',   bg: 'bg-blue-500/15',   grad: 'from-blue-500 to-indigo-500' };
    if (level >= 10) return { text: 'text-emerald-400',bg: 'bg-emerald-500/15',grad: 'from-emerald-500 to-teal-500' };
    return { text: 'text-indigo-400', bg: 'bg-indigo-500/15', grad: 'from-indigo-500 to-violet-500' };
  };
  const levelColors = getLevelColor(level);

  return (
    <aside className="space-y-4">
      {/* Streak & Level Card */}
      <Card className="border-border/40 overflow-hidden animate-fade-slide-up stagger-1 db-card-hover">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-orange-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardContent className="p-4 space-y-4 relative">
          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-md',
                streak > 0
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : 'bg-muted'
              )}>
                <Flame
                  className={cn('w-7 h-7', streak > 0 ? 'text-white' : 'text-muted-foreground')}
                  style={streak > 0 ? { animation: 'flamePulse 1.8s ease-in-out infinite' } : undefined}
                />
                {streak >= 7 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">ngày liên tiếp</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Mục tiêu</p>
                <p className="text-sm font-bold text-orange-500">{nextStreakMilestone} ngày</p>
              </div>
            )}
          </div>

          {streak > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Milestone</span>
                <span>{streak % 7}/{7}</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${streakProgress}%`,
                    background: 'linear-gradient(90deg, #f97316 0%, #eab308 100%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Level */}
          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm', levelColors.bg)}>
                  <Trophy className={cn('w-4 h-4', levelColors.text)} />
                </div>
                <div>
                  <span className="font-bold text-lg leading-none">Level {level}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{points.toLocaleString()} XP</p>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-xs border-border/40', levelColors.text)}>
                +{pointsToNextLevel} → Lv.{level + 1}
              </Badge>
            </div>
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${levelProgress}%`,
                  backgroundImage: `linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Today Widget */}
      <PracticeTodayWidget />

      {/* Practice Stats Widget */}
      <PracticeStatsWidget />

      {/* Due Flashcards notification */}
      {dueFlashcards > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5 animate-fade-slide-up">
          <CardContent className="p-3">
            <Link to="/flashcards/today" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Bạn có {dueFlashcards} thẻ cần ôn!</p>
                <p className="text-xs text-muted-foreground">Ôn ngay để không quên</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      )}
    </aside>
  );
});

DashboardSuggestions.displayName = 'DashboardSuggestions';
