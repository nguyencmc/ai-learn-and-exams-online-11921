import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

const log = logger('AchievementsSection');
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Star,
  Target,
  Flame,
  BookOpen,
  CheckCircle2,
  Lock,
  Crown,
  Medal
} from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  level: number;
  total_exams_taken: number;
  total_correct_answers: number;
  rank: number;
}

export function AchievementsSection() {
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState('earned');
  const { 
    earnedAchievements, 
    unearnedAchievements, 
    loading,
    getUserProgress 
  } = useAchievements();
  
  const [progress, setProgress] = useState({
    exams_completed: 0,
    perfect_scores: 0,
    streak_days: 0,
    questions_answered: 0,
    points_earned: 0,
    flashcards_mastered: 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const loadProgress = async () => {
    const p = await getUserProgress();
    setProgress(p);
  };

  const fetchLeaderboard = async () => {
    if (leaderboard.length > 0) return; // Already loaded
    
    setLeaderboardLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { limit_count: 20 });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      log.error('Error fetching leaderboard', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const totalPoints = earnedAchievements.reduce((acc, a) => acc + (a.points_reward || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Thành tích
        </h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardContent className="p-3 text-center">
            <Trophy className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{earnedAchievements.length}</p>
            <p className="text-xs text-muted-foreground">Đã đạt</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Star className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">Điểm thưởng</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Target className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-muted-foreground">{unearnedAchievements.length}</p>
            <p className="text-xs text-muted-foreground">Còn lại</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tiến độ hiện tại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProgressItem 
            icon={BookOpen} 
            label="Đề thi đã làm" 
            value={progress.exams_completed} 
            color="text-blue-500"
          />
          <ProgressItem 
            icon={CheckCircle2} 
            label="Điểm tuyệt đối" 
            value={progress.perfect_scores} 
            color="text-green-500"
          />
          <ProgressItem 
            icon={Flame} 
            label="Streak ngày" 
            value={progress.streak_days} 
            color="text-orange-500"
          />
          <ProgressItem 
            icon={Target} 
            label="Câu hỏi đã trả lời" 
            value={progress.questions_answered} 
            color="text-purple-500"
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="earned" className="text-xs sm:text-sm">
            Đã đạt ({earnedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs sm:text-sm">
            Sắp đạt
          </TabsTrigger>
          <TabsTrigger value="locked" className="text-xs sm:text-sm">
            Chưa mở
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
            Xếp hạng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-4">
          {earnedAchievements.length === 0 ? (
            <EmptyState 
              message="Chưa có thành tích nào"
              description="Hoàn thành nhiệm vụ để mở khóa thành tích"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earnedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} earned />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {unearnedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} progress={progress} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {unearnedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} locked />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          {leaderboardLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <EmptyState 
              message="Chưa có dữ liệu"
              description="Bảng xếp hạng đang được cập nhật"
            />
          ) : (
            <div className="space-y-2">
              {/* Top 3 */}
              {leaderboard.slice(0, 3).map((entry, index) => (
                <Link key={entry.user_id} to={`/@${entry.username}`}>
                  <Card className={`border-border/50 transition-colors hover:bg-muted/50 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/30' :
                    'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30'
                  }`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" /> :
                         index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                         <Medal className="w-6 h-6 text-amber-600" />}
                      </div>
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {(entry.full_name || entry.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.full_name || entry.username}</p>
                        <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-amber-600'
                        }`}>{entry.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">điểm</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Rest of leaderboard */}
              {leaderboard.slice(3, 10).map((entry) => (
                <Link key={entry.user_id} to={`/@${entry.username}`}>
                  <Card className="border-border/50 transition-colors hover:bg-muted/50">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                      </div>
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {(entry.full_name || entry.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.full_name || entry.username}</p>
                        <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-foreground">{entry.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">điểm</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* View full leaderboard link */}
              <div className="pt-2 text-center">
                <Link to="/leaderboard">
                  <Button variant="outline" size="sm" className="w-full">
                    Xem đầy đủ bảng xếp hạng
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    badge_color: string;
    points_reward: number;
    requirement_type: string;
    requirement_value: number;
  };
  earned?: boolean;
  locked?: boolean;
  progress?: {
    exams_completed: number;
    perfect_scores: number;
    streak_days: number;
    questions_answered: number;
    points_earned: number;
    flashcards_mastered: number;
  };
}

function AchievementCard({ achievement, earned, locked, progress }: AchievementCardProps) {
  let currentProgress = 0;
  if (progress) {
    switch (achievement.requirement_type) {
      case 'exams_completed':
        currentProgress = progress.exams_completed;
        break;
      case 'perfect_score':
        currentProgress = progress.perfect_scores;
        break;
      case 'streak_days':
        currentProgress = progress.streak_days;
        break;
      case 'questions_answered':
        currentProgress = progress.questions_answered;
        break;
      case 'points_earned':
        currentProgress = progress.points_earned;
        break;
      case 'flashcards_mastered':
        currentProgress = progress.flashcards_mastered;
        break;
    }
  }

  const progressPercent = Math.min((currentProgress / achievement.requirement_value) * 100, 100);

  return (
    <Card className={`border-border/50 ${earned ? 'bg-gradient-to-br from-yellow-500/10 to-transparent' : ''} ${locked ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
          earned ? 'bg-yellow-500/20' : 'bg-muted'
        }`}>
          {locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : achievement.icon}
        </div>
        <h3 className="font-medium text-sm line-clamp-1 mb-1">{achievement.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{achievement.description}</p>
        
        {earned && (
          <Badge className="bg-yellow-500 text-white">
            +{achievement.points_reward} điểm
          </Badge>
        )}
        
        {!earned && !locked && progress && (
          <div className="mt-2">
            <Progress value={progressPercent} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">
              {currentProgress}/{achievement.requirement_value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

function ProgressItem({ icon: Icon, label, value, color }: ProgressItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({ message, description }: { message: string; description: string }) {
  return (
    <div className="text-center py-12 px-4">
      <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
