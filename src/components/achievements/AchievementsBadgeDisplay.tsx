import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const badgeColorClasses: Record<string, string> = {
  bronze: 'bg-amber-700/20 border-amber-700/50 text-amber-700',
  silver: 'bg-slate-400/20 border-slate-400/50 text-slate-500',
  gold: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-600',
  platinum: 'bg-purple-500/20 border-purple-500/50 text-purple-600',
};

const categoryLabels: Record<string, string> = {
  exam: 'Bài thi',
  streak: 'Chuỗi ngày',
  questions: 'Câu hỏi',
  points: 'Điểm số',
  flashcard: 'Flashcard',
};

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    badge_color: string;
    points_reward: number;
    requirement_value: number;
    requirement_type: string;
  };
  earned: boolean;
  earnedAt?: string;
  progress?: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  earned, 
  earnedAt,
  progress = 0 
}) => {
  const progressPercent = Math.min((progress / achievement.requirement_value) * 100, 100);

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300',
      earned 
        ? 'border-2 shadow-lg hover:shadow-xl' 
        : 'opacity-70 hover:opacity-90',
      earned && badgeColorClasses[achievement.badge_color]?.replace('text-', 'border-')
    )}>
      {earned && (
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
            earned 
              ? badgeColorClasses[achievement.badge_color] 
              : 'bg-muted text-muted-foreground'
          )}>
            {earned ? achievement.icon : <Lock className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-semibold text-sm',
              !earned && 'text-muted-foreground'
            )}>
              {achievement.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {achievement.description}
            </p>
            
            {earned ? (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  +{achievement.points_reward} điểm
                </Badge>
                {earnedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(earnedAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Tiến độ</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface AchievementsBadgeDisplayProps {
  showAll?: boolean;
  maxDisplay?: number;
}

export const AchievementsBadgeDisplay: React.FC<AchievementsBadgeDisplayProps> = ({ 
  showAll = false,
  maxDisplay = 6 
}) => {
  const { user } = useAuth();
  const { 
    achievements, 
    earnedAchievements, 
    unearnedAchievements: _unearnedAchievements,
    userAchievements,
    loading,
    getUserProgress
  } = useAchievements();
  
  const [progress, setProgress] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchProgress = async () => {
      const userProgress = await getUserProgress();
      setProgress({
        exams_completed: userProgress.exams_completed,
        perfect_score: userProgress.perfect_scores,
        streak_days: userProgress.streak_days,
        questions_answered: userProgress.questions_answered,
        points_earned: userProgress.points_earned,
        flashcards_mastered: userProgress.flashcards_mastered,
      });
    };
    
    if (user) fetchProgress();
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Đăng nhập để xem thành tựu
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const categories = [...new Set(achievements.map(a => a.category))];

  if (!showAll) {
    // Compact display for dashboard
    const displayAchievements = earnedAchievements.slice(0, maxDisplay);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">Thành tựu</CardTitle>
            </div>
            <Badge variant="secondary">
              {earnedAchievements.length}/{achievements.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có thành tựu nào. Hãy bắt đầu học ngay!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayAchievements.map(a => (
                <div 
                  key={a.id}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                    badgeColorClasses[a.badge_color]
                  )}
                  title={a.name}
                >
                  {a.icon}
                </div>
              ))}
              {earnedAchievements.length > maxDisplay && (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  +{earnedAchievements.length - maxDisplay}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full display with tabs
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Thành tựu
            </CardTitle>
            <CardDescription>
              Đã đạt {earnedAchievements.length}/{achievements.length} thành tựu
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {earnedAchievements.reduce((sum, a) => sum + a.points_reward, 0)}
            </p>
            <p className="text-xs text-muted-foreground">điểm thưởng</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="earned">Đã đạt</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {categoryLabels[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map(a => {
                const ua = userAchievements.find(u => u.achievement_id === a.id);
                return (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    earned={!!ua}
                    earnedAt={ua?.earned_at}
                    progress={progress[a.requirement_type] || 0}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="earned">
            {earnedAchievements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Chưa có thành tựu nào
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {earnedAchievements.map(a => {
                  const ua = userAchievements.find(u => u.achievement_id === a.id);
                  return (
                    <AchievementCard
                      key={a.id}
                      achievement={a}
                      earned={true}
                      earnedAt={ua?.earned_at}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {categories.map(cat => (
            <TabsContent key={cat} value={cat}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements
                  .filter(a => a.category === cat)
                  .map(a => {
                    const ua = userAchievements.find(u => u.achievement_id === a.id);
                    return (
                      <AchievementCard
                        key={a.id}
                        achievement={a}
                        earned={!!ua}
                        earnedAt={ua?.earned_at}
                        progress={progress[a.requirement_type] || 0}
                      />
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
