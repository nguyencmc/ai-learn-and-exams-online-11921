import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Clock, 
  FileText,
  CheckCircle2,
  Target,
  RotateCcw
} from 'lucide-react';

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  completed_at: string;
  time_spent_seconds: number | null;
  exam?: {
    title: string;
    slug: string;
  };
}

interface PracticeSession {
  id: string;
  set_id: string | null;
  score: number | null;
  correct_count: number | null;
  total_questions: number | null;
  ended_at: string | null;
  duration_sec: number;
  set_title?: string;
}

export function HistorySection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch exam attempts
    const { data: exams } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        exam_id,
        score,
        correct_answers,
        total_questions,
        completed_at,
        time_spent_seconds,
        exam:exams(title, slug)
      `)
      .eq('user_id', user?.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (exams) {
      setExamAttempts(exams as unknown as ExamAttempt[]);
    }

    // Fetch practice sessions
    const { data: sessions } = await supabase
      .from('practice_exam_sessions')
      .select('id, set_id, score, correct_count, total_questions, ended_at, duration_sec')
      .eq('user_id', user?.id)
      .eq('status', 'submitted')
      .order('ended_at', { ascending: false })
      .limit(20);

    if (sessions && sessions.length > 0) {
      // Fetch set titles
      const setIds = [...new Set(sessions.map(s => s.set_id).filter(Boolean))] as string[];
      
      if (setIds.length > 0) {
        const { data: sets } = await supabase
          .from('question_sets')
          .select('id, title')
          .in('id', setIds);

        const sessionsWithTitles = sessions.map(session => ({
          ...session,
          set_title: sets?.find(s => s.id === session.set_id)?.title,
        }));
        setPracticeSessions(sessionsWithTitles);
      } else {
        setPracticeSessions(sessions);
      }
    }

    setLoading(false);
  };

  // Calculate stats
  const totalAttempts = examAttempts.length + practiceSessions.length;
  const avgScore = totalAttempts > 0 
    ? Math.round(
        ([...examAttempts, ...practiceSessions]
          .map(a => a.score || 0)
          .reduce((acc, s) => acc + s, 0)) / totalAttempts
      )
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-purple-500" />
          Lịch sử làm bài
        </h2>
        <Link to="/history">
          <Button size="sm" variant="outline">
            Xem chi tiết
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalAttempts}</p>
            <p className="text-xs text-muted-foreground">Tổng bài làm</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Điểm TB</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">
              {examAttempts.filter(a => (a.score || 0) >= 70).length + 
               practiceSessions.filter(s => (s.score || 0) >= 70).length}
            </p>
            <p className="text-xs text-muted-foreground">Đạt yêu cầu</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Tất cả ({totalAttempts})
          </TabsTrigger>
          <TabsTrigger value="exams" className="text-xs sm:text-sm">
            Đề thi ({examAttempts.length})
          </TabsTrigger>
          <TabsTrigger value="practice" className="text-xs sm:text-sm">
            Luyện tập ({practiceSessions.length})
          </TabsTrigger>
          <TabsTrigger value="wrong" className="text-xs sm:text-sm">
            Câu sai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {totalAttempts === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {/* Merge and sort by date */}
              {[...examAttempts.map(a => ({ ...a, type: 'exam' as const })),
                ...practiceSessions.map(s => ({ 
                  ...s, 
                  type: 'practice' as const,
                  completed_at: s.ended_at || ''
                }))]
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                .slice(0, 10)
                .map((item) => (
                  item.type === 'exam' 
                    ? <ExamAttemptCard key={`exam-${item.id}`} attempt={item as ExamAttempt} />
                    : <PracticeSessionCard key={`practice-${item.id}`} session={item as PracticeSession} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          {examAttempts.length === 0 ? (
            <EmptyState message="Chưa có lịch sử làm đề thi" />
          ) : (
            <div className="space-y-3">
              {examAttempts.slice(0, 10).map((attempt) => (
                <ExamAttemptCard key={attempt.id} attempt={attempt} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="practice" className="mt-4">
          {practiceSessions.length === 0 ? (
            <EmptyState message="Chưa có lịch sử luyện tập" />
          ) : (
            <div className="space-y-3">
              {practiceSessions.slice(0, 10).map((session) => (
                <PracticeSessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wrong" className="mt-4">
          <div className="text-center py-8 px-4 bg-red-500/5 rounded-lg border border-red-500/20">
            <RotateCcw className="w-10 h-10 mx-auto text-red-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Ôn câu sai</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ôn lại những câu đã trả lời sai để cải thiện điểm số
            </p>
            <Link to="/practice/review">
              <Button className="gap-2">
                <Target className="w-4 h-4" />
                Bắt đầu ôn tập
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExamAttemptCard({ attempt }: { attempt: ExamAttempt }) {
  const score = attempt.score || 0;
  const isPassed = score >= 70;
  
  return (
    <Link to={`/history/${attempt.id}`}>
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isPassed ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <FileText className={`w-6 h-6 ${isPassed ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-1">
                {attempt.exam?.title || 'Đề thi'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true, locale: vi })}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {score}%
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {attempt.correct_answers}/{attempt.total_questions}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PracticeSessionCard({ session }: { session: PracticeSession }) {
  const score = session.score || 0;
  const isPassed = score >= 70;
  
  return (
    <Link to={`/practice/result/${session.id}`}>
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isPassed ? 'bg-green-500/10' : 'bg-orange-500/10'
            }`}>
              <Target className={`w-6 h-6 ${isPassed ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-1">
                {session.set_title || 'Bài luyện tập'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {session.ended_at 
                  ? formatDistanceToNow(new Date(session.ended_at), { addSuffix: true, locale: vi })
                  : 'Vừa xong'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isPassed ? 'text-green-600' : 'text-orange-600'}`}>
                {score}%
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {session.correct_count}/{session.total_questions}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ message = "Chưa có lịch sử làm bài" }: { message?: string }) {
  return (
    <div className="text-center py-12 px-4">
      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Bắt đầu làm bài để xem lịch sử tại đây
      </p>
      <Link to="/exams">
        <Button size="sm">Làm đề thi</Button>
      </Link>
    </div>
  );
}
