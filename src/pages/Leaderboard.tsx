import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Crown, Star, Target, TrendingUp } from "lucide-react";
import { logger } from '@/lib/logger';

const log = logger('Leaderboard');

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

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { limit_count: 100 });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      log.error('Error fetching leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-card hover:bg-muted/50';
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Bảng Xếp Hạng
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Top 100 người dùng xuất sắc nhất trên nền tảng AI-Exam.cloud
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Top 3 Cards */}
          {!loading && leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Second Place */}
              <div className="order-2 md:order-1 md:mt-8">
                <Card className="overflow-hidden border-gray-400/30 bg-gradient-to-b from-gray-400/10 to-transparent">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xl">
                      2
                    </div>
                    <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-gray-400">
                      <AvatarImage src={leaderboard[1].avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {(leaderboard[1].full_name || leaderboard[1].username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      to={`/@${leaderboard[1].username}`}
                      className="font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {leaderboard[1].full_name || leaderboard[1].username}
                    </Link>
                    <p className="text-2xl font-bold text-gray-500 mt-2">
                      {leaderboard[1].points.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">điểm</p>
                  </CardContent>
                </Card>
              </div>

              {/* First Place */}
              <div className="order-1 md:order-2">
                <Card className="overflow-hidden border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent">
                  <CardContent className="pt-6 text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-yellow-500">
                      <AvatarImage src={leaderboard[0].avatar_url || undefined} />
                      <AvatarFallback className="text-3xl">
                        {(leaderboard[0].full_name || leaderboard[0].username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      to={`/@${leaderboard[0].username}`}
                      className="font-bold text-lg text-foreground hover:text-primary transition-colors block"
                    >
                      {leaderboard[0].full_name || leaderboard[0].username}
                    </Link>
                    <p className="text-3xl font-bold text-yellow-500 mt-2">
                      {leaderboard[0].points.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">điểm</p>
                  </CardContent>
                </Card>
              </div>

              {/* Third Place */}
              <div className="order-3 md:mt-8">
                <Card className="overflow-hidden border-amber-600/30 bg-gradient-to-b from-amber-600/10 to-transparent">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xl">
                      3
                    </div>
                    <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-amber-600">
                      <AvatarImage src={leaderboard[2].avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {(leaderboard[2].full_name || leaderboard[2].username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      to={`/@${leaderboard[2].username}`}
                      className="font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {leaderboard[2].full_name || leaderboard[2].username}
                    </Link>
                    <p className="text-2xl font-bold text-amber-600 mt-2">
                      {leaderboard[2].points.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">điểm</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Bảng xếp hạng đầy đủ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có dữ liệu bảng xếp hạng. Hãy là người đầu tiên!
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <Link
                      key={entry.user_id}
                      to={`/@${entry.username}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(index + 1)}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {getRankIcon(index + 1) || index + 1}
                      </div>
                      
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          {(entry.full_name || entry.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {entry.full_name || entry.username}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            Level {entry.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {entry.total_exams_taken} đề thi
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {entry.points.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">điểm</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Leaderboard;