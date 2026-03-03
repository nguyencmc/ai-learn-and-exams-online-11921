import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play,
  RotateCcw,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogIn,
  BookOpen,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Trophy,
  Flame,
  Star,
} from 'lucide-react';

interface InProgressSession {
  id: string;
  set_id: string;
  started_at: string;
  total_questions: number | null;
}

interface WrongAnswerStats {
  count: number;
  questionIds: string[];
}

interface LastPracticeSet {
  id: string;
  title: string;
}

interface Recommendation {
  type: 'exam' | 'flashcard' | 'practice' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  icon: 'target' | 'brain' | 'trending' | 'book' | 'trophy' | 'flame' | 'star';
}

// ── Thuật toán gợi ý thông minh (pure local) ────────────────────────────────
interface UserStats {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  streakToday: boolean;
  flashcardsDue: number;
  inProgressSession: boolean;
  wrongAnswerCount: number;
  practicedSetIds: string[];
  unpracticedSets: { id: string; title: string }[];
  recentAccuracy7d: number;
  daysActiveLast7: number;
}

function buildRecommendations(stats: UserStats): Recommendation[] {
  const recs: Recommendation[] = [];

  if (stats.inProgressSession) {
    recs.push({ type: 'exam', title: 'Tiếp tục bài đang làm', description: 'Bạn có bài thi chưa hoàn thành', priority: 'high', href: '/practice', icon: 'target' });
  }

  if (stats.wrongAnswerCount >= 5) {
    recs.push({ type: 'review', title: 'Ôn lại câu sai', description: `${stats.wrongAnswerCount} câu sai cần củng cố ngay`, priority: 'high', href: '/practice/review', icon: 'trending' });
  } else if (stats.wrongAnswerCount > 0) {
    recs.push({ type: 'review', title: 'Ôn lại câu sai', description: `${stats.wrongAnswerCount} câu sai cần xem lại`, priority: 'medium', href: '/practice/review', icon: 'trending' });
  }

  if (stats.flashcardsDue >= 10) {
    recs.push({ type: 'flashcard', title: 'Ôn flashcard hôm nay', description: `${stats.flashcardsDue} thẻ đến hạn, ôn ngay để không quên`, priority: 'high', href: '/flashcards/today', icon: 'brain' });
  } else if (stats.flashcardsDue > 0) {
    recs.push({ type: 'flashcard', title: 'Ôn flashcard', description: `${stats.flashcardsDue} thẻ đến hạn ôn tập`, priority: 'medium', href: '/flashcards/today', icon: 'brain' });
  }

  if (stats.totalAttempts >= 10 && stats.recentAccuracy7d < 50) {
    recs.push({ type: 'practice', title: 'Luyện câu dễ để lấy đà', description: `Tỉ lệ đúng gần đây ${stats.recentAccuracy7d.toFixed(0)}% — ôn lại nền tảng`, priority: 'high', href: '/practice?difficulty=easy', icon: 'star' });
  }

  if (stats.totalAttempts >= 20 && stats.recentAccuracy7d >= 80) {
    recs.push({ type: 'practice', title: 'Thử thách nâng cao', description: `Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — bạn sẵn sàng câu khó!`, priority: 'medium', href: '/practice?difficulty=hard', icon: 'trophy' });
  }

  if (stats.unpracticedSets.length > 0) {
    const set = stats.unpracticedSets[0];
    recs.push({ type: 'practice', title: `Khám phá: ${set.title}`, description: 'Bộ đề bạn chưa thử lần nào', priority: stats.totalAttempts === 0 ? 'high' : 'low', href: `/practice/setup/${set.id}`, icon: 'book' });
  }

  if (!stats.streakToday && stats.daysActiveLast7 >= 3) {
    recs.push({ type: 'practice', title: 'Giữ vững chuỗi học tập', description: 'Học ít nhất 5 câu hôm nay để không mất streak', priority: 'high', href: '/practice', icon: 'flame' });
  }

  if (stats.totalAttempts < 5) {
    recs.push({ type: 'practice', title: 'Bắt đầu luyện tập ngay', description: 'Thử 10 câu đầu tiên để khám phá', priority: 'high', href: '/practice', icon: 'target' });
  }

  const seen = new Set<string>();
  return recs
    .filter(r => { if (seen.has(r.title)) return false; seen.add(r.title); return true; })
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 3);
}

function buildSummary(stats: UserStats): string {
  if (stats.totalAttempts === 0) return 'Bắt đầu luyện tập để nhận gợi ý cá nhân hoá! 🚀';
  if (stats.recentAccuracy7d >= 80) return `Tuyệt vời! Tỉ lệ đúng 7 ngày gần nhất ${stats.recentAccuracy7d.toFixed(0)}% 🎉`;
  if (stats.recentAccuracy7d >= 60) return `Khá tốt! Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — tiếp tục duy trì nhé 💪`;
  if (stats.totalAttempts >= 10) return `Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — ôn lại câu sai để cải thiện 📚`;
  return `Đã làm ${stats.totalAttempts} câu — luyện đều mỗi ngày để tiến bộ nhanh hơn!`;
}
// ────────────────────────────────────────────────────────────────────────────

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toDateString() === new Date().toDateString();
};
const isWithinDays = (dateStr: string, days: number) => {
  return new Date(dateStr) >= new Date(Date.now() - days * 86400000);
};

export const PracticeTodayWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [inProgressSession, setInProgressSession] = useState<InProgressSession | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerStats>({ count: 0, questionIds: [] });
  const [lastPracticeSet, setLastPracticeSet] = useState<LastPracticeSet | null>(null);

  const [smartRecs, setSmartRecs] = useState<Recommendation[]>([]);
  const [smartSummary, setSmartSummary] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sessions } = await supabase
        .from('practice_exam_sessions')
        .select('id, set_id, started_at, total_questions')
        .eq('user_id', user?.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1);
      if (sessions && sessions.length > 0) setInProgressSession(sessions[0]);

      const { data: wrongAttempts } = await supabase
        .from('practice_attempts')
        .select('question_id')
        .eq('user_id', user?.id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (wrongAttempts && wrongAttempts.length > 0) {
        const uniqueIds = [...new Set(wrongAttempts.map(a => a.question_id))].slice(0, 10);
        setWrongAnswers({ count: uniqueIds.length, questionIds: uniqueIds });
      }

      const { data: recentAttempts } = await supabase
        .from('practice_attempts')
        .select('question_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (recentAttempts && recentAttempts.length > 0) {
        const { data: question } = await supabase
          .from('practice_questions')
          .select('set_id')
          .eq('id', recentAttempts[0].question_id)
          .maybeSingle();
        if (question?.set_id) {
          const { data: set } = await supabase
            .from('question_sets')
            .select('id, title')
            .eq('id', question.set_id)
            .maybeSingle();
          if (set) setLastPracticeSet(set);
        }
      }

      if (!lastPracticeSet) {
        const { data: fallbackSet } = await supabase
          .from('question_sets')
          .select('id, title')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackSet && fallbackSet.length > 0) setLastPracticeSet(fallbackSet[0]);
      }
    } catch (error) {
      console.error('Error fetching practice today data:', error);
    }
    setLoading(false);
  };

  const computeSmartRecommendations = async () => {
    if (!user) return;
    setSmartLoading(true);
    try {
      // Lịch sử 30 ngày
      const { data: attempts30d } = await supabase
        .from('practice_attempts')
        .select('is_correct, created_at, question_id')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(500);

      const all = attempts30d ?? [];
      const totalAttempts = all.length;
      const correctCount = all.filter(a => a.is_correct).length;
      const wrongCount = totalAttempts - correctCount;

      const last7d = all.filter(a => isWithinDays(a.created_at, 7));
      const recentAccuracy7d = last7d.length > 0 ? (last7d.filter(a => a.is_correct).length / last7d.length) * 100 : 0;
      const daysActiveLast7 = new Set(last7d.map(a => new Date(a.created_at).toDateString())).size;
      const streakToday = all.some(a => isToday(a.created_at));

      // Flashcard đến hạn
      const { count: flashcardsDue } = await supabase
        .from('user_flashcard_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());

      // Bộ đề đã làm vs chưa làm
      let practicedSetIds: string[] = [];
      const qIds = all.map(a => a.question_id).slice(0, 100);
      if (qIds.length > 0) {
        const { data: practicedQs } = await supabase
          .from('practice_questions')
          .select('set_id')
          .in('id', qIds);
        practicedSetIds = [...new Set((practicedQs ?? []).map(q => q.set_id))];
      }

      const { data: allSets } = await supabase
        .from('question_sets')
        .select('id, title')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      const unpracticedSets = (allSets ?? []).filter(s => !practicedSetIds.includes(s.id));

      // Câu sai
      const { data: wrongData } = await supabase
        .from('practice_attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_correct', false)
        .limit(50);
      const wrongAnswerCount = new Set((wrongData ?? []).map(a => a.question_id)).size;

      // Session đang dở
      const { data: sesData } = await supabase
        .from('practice_exam_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .limit(1);

      const stats: UserStats = {
        totalAttempts, correctCount, wrongCount,
        accuracy: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
        streakToday,
        flashcardsDue: flashcardsDue ?? 0,
        inProgressSession: (sesData ?? []).length > 0,
        wrongAnswerCount,
        practicedSetIds,
        unpracticedSets,
        recentAccuracy7d,
        daysActiveLast7,
      };

      setSmartRecs(buildRecommendations(stats));
      setSmartSummary(buildSummary(stats));
    } catch (err) {
      console.error('Smart recommendations error:', err);
    } finally {
      setSmartLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      computeSmartRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleContinueExam = () => {
    if (inProgressSession) navigate(`/practice/exam/${inProgressSession.set_id}`, { state: { sessionId: inProgressSession.id } });
  };
  const handleReviewWrong = () => navigate('/practice/review');
  const handleQuickPractice = () => {
    if (lastPracticeSet) navigate(`/practice/setup/${lastPracticeSet.id}`, { state: { quickStart: true, questionCount: 10 } });
  };

  const getIcon = (icon: Recommendation['icon']) => {
    const map: Record<string, React.ReactNode> = {
      target: <Target className="w-4 h-4" />,
      brain: <Brain className="w-4 h-4" />,
      trending: <TrendingUp className="w-4 h-4" />,
      book: <BookOpen className="w-4 h-4" />,
      trophy: <Trophy className="w-4 h-4" />,
      flame: <Flame className="w-4 h-4" />,
      star: <Star className="w-4 h-4" />,
    };
    return map[icon] ?? <Sparkles className="w-4 h-4" />;
  };

  const getPriorityStyle = (priority: Recommendation['priority']) => ({
    high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400',
  }[priority]);

  const getPriorityLabel = (priority: Recommendation['priority']) =>
    ({ high: 'Ưu tiên', medium: 'Nên làm', low: 'Tùy chọn' }[priority]);

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

        {/* A) Bài thi đang làm dở */}
        <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Bài thi đang làm dở</h4>
              {inProgressSession ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    1 bài chưa hoàn thành ({inProgressSession.total_questions || 0} câu)
                  </p>
                  <Button size="sm" onClick={handleContinueExam} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />Tiếp tục
                  </Button>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  Không có bài đang làm dở
                </p>
              )}
            </div>
          </div>
        </div>

        {/* B) Ôn câu sai */}
        <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Ôn câu sai</h4>
              {wrongAnswers.count > 0 ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    <Badge variant="destructive" className="mr-1 text-[10px] sm:text-xs">{wrongAnswers.count}</Badge>câu sai cần ôn
                  </p>
                  <Button size="sm" variant="outline" onClick={handleReviewWrong} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />Ôn ngay
                  </Button>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />Chưa có câu sai
                </p>
              )}
            </div>
          </div>
        </div>

        {/* C) Luyện nhanh */}
        <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Luyện nhanh 10 câu</h4>
              {lastPracticeSet ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 truncate">{lastPracticeSet.title}</p>
                  <Button size="sm" variant="secondary" onClick={handleQuickPractice} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />Luyện ngay
                  </Button>
                </>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />Chưa có bộ đề
                  </p>
                  <Link to="/practice">
                    <Button size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />Khám phá
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D) Gợi ý thông minh (thuật toán local) */}
        <div className="pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h4 className="font-medium text-foreground text-sm sm:text-base truncate">Gợi ý cho bạn</h4>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={computeSmartRecommendations}
              disabled={smartLoading}
              className="h-7 w-7 p-0"
              title="Làm mới gợi ý"
            >
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${smartLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {smartLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : smartRecs.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {/* Tóm tắt */}
              <div className="p-2 sm:p-3 bg-primary/5 rounded-lg text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {smartSummary}
              </div>

              {/* Danh sách gợi ý */}
              {smartRecs.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border/50 hover:bg-accent/5 cursor-pointer transition-colors"
                  onClick={() => navigate(rec.href)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {getIcon(rec.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{rec.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{rec.description}</p>
                  </div>
                  <Badge variant="outline" className={`${getPriorityStyle(rec.priority)} text-[9px] sm:text-xs hidden xs:inline-flex`}>
                    {getPriorityLabel(rec.priority)}
                  </Badge>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 sm:py-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Bắt đầu luyện tập để nhận gợi ý cá nhân hoá</p>
              <Link to="/practice">
                <Button variant="ghost" size="sm" className="mt-2 text-xs h-8 gap-1.5">
                  <Target className="w-3 h-3" />Bắt đầu ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
