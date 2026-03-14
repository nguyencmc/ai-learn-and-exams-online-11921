import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  CheckCircle, 
  Clock, 
  Star, 
  TrendingUp,
  Award,
  BookOpen,
  Calendar
} from "lucide-react";
import { logger } from '@/lib/logger';

const log = logger('UserProfile');

interface Profile {
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  level: number;
  total_exams_taken: number;
  total_correct_answers: number;
  total_questions_answered: number;
  created_at: string;
}

interface ExamAttempt {
  id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
  exam_id: string;
  exams?: {
    title: string;
    slug: string;
  };
}

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

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      // Remove @ prefix if present
      const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's exam attempts
      if (profileData?.user_id) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select(`
            id,
            score,
            correct_answers,
            total_questions,
            time_spent_seconds,
            completed_at,
            exam_id,
            exams (
              title,
              slug
            )
          `)
          .eq('user_id', profileData.user_id)
          .order('completed_at', { ascending: false })
          .limit(20);

        if (!attemptsError && attemptsData) {
          setAttempts(attemptsData as ExamAttempt[]);
        }
      }
    } catch (error) {
      log.error('Error fetching profile', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { limit_count: 50 });

      if (error) throw error;
      setLeaderboard(data || []);

      // Find current user's rank
      const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;
      const userEntry = data?.find((entry: LeaderboardEntry) => entry.username === cleanUsername);
      if (userEntry) {
        setUserRank(userEntry.rank);
      }
    } catch (error) {
      log.error('Error fetching leaderboard', error);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchLeaderboard();
    }
  }, [username, fetchProfile, fetchLeaderboard]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAccuracyPercentage = () => {
    if (!profile || profile.total_questions_answered === 0) return 0;
    return Math.round((profile.total_correct_answers / profile.total_questions_answered) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
</div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy người dùng</h1>
          <p className="text-muted-foreground mb-6">Người dùng này không tồn tại hoặc chưa thiết lập trang cá nhân.</p>
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </main>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                    {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left mt-4 md:mt-0 md:mb-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.full_name || profile.username}
                    </h1>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Level {profile.level}
                    </Badge>
                  </div>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                  {profile.bio && (
                    <p className="text-foreground mt-2">{profile.bio}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1">
                    <Calendar className="w-4 h-4" />
                    Tham gia từ {formatDate(profile.created_at)}
                  </p>
                </div>

                {userRank && (
                  <div className="text-center md:text-right">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      Hạng #{userRank}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Điểm tích lũy</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.total_exams_taken}</p>
                <p className="text-sm text-muted-foreground">Đề thi đã làm</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.total_correct_answers}</p>
                <p className="text-sm text-muted-foreground">Câu trả lời đúng</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{getAccuracyPercentage()}%</p>
                <p className="text-sm text-muted-foreground">Độ chính xác</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for History and Leaderboard */}
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="history">Lịch sử làm bài</TabsTrigger>
              <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Lịch sử làm bài gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attempts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có lịch sử làm bài nào.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {attempts.map((attempt) => (
                        <div 
                          key={attempt.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1">
                            <Link 
                              to={`/exam/${attempt.exams?.slug}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {attempt.exams?.title || 'Đề thi không xác định'}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(attempt.completed_at)} • {formatTime(attempt.time_spent_seconds)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={attempt.score >= 70 ? "default" : "secondary"}
                                className={attempt.score >= 70 ? "bg-green-500" : ""}
                              >
                                {attempt.score}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {attempt.correct_answers}/{attempt.total_questions} câu đúng
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top 50 người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có dữ liệu bảng xếp hạng.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => (
                        <Link
                          key={entry.user_id}
                          to={`/@${entry.username}`}
                          className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors ${
                            entry.username === (username?.startsWith('@') ? username.slice(1) : username)
                              ? 'bg-primary/10 border border-primary/20'
                              : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback>
                              {(entry.full_name || entry.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {entry.full_name || entry.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Level {entry.level} • {entry.total_exams_taken} đề thi
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-primary">{entry.points.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">điểm</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
</div>
  );
};

export default UserProfile;