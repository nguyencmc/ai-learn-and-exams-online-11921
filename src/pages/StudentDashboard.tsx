import { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BookOpen, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { AITutorButton } from '@/components/ai/AITutorButton';
import { useAchievements } from '@/hooks/useAchievements';

import { DashboardSidebar, DashboardSection } from '@/components/dashboard/DashboardSidebar';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { DashboardSuggestions } from '@/components/dashboard/DashboardSuggestions';

const OverviewSection = lazy(() =>
  import('@/components/dashboard/sections/overviewSection').then((m) => ({ default: m.OverviewSection }))
);
const MyCoursesSection = lazy(() =>
  import('@/components/dashboard/sections/myCoursesSection').then((m) => ({ default: m.MyCoursesSection }))
);
const MyClassesSection = lazy(() =>
  import('@/components/dashboard/sections/MyClassesSection').then((m) => ({ default: m.MyClassesSection }))
);
const FlashcardsSection = lazy(() =>
  import('@/components/dashboard/sections/FlashcardsSection').then((m) => ({ default: m.FlashcardsSection }))
);
const HistorySection = lazy(() =>
  import('@/components/dashboard/sections/HistorySection').then((m) => ({ default: m.HistorySection }))
);
const AchievementsSection = lazy(() =>
  import('@/components/dashboard/sections/AchievementsSection').then((m) => ({ default: m.AchievementsSection }))
);
const SettingsSection = lazy(() =>
  import('@/components/dashboard/sections/SettingsSection').then((m) => ({ default: m.SettingsSection }))
);

interface Stats {
  totalExamsTaken: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  points: number;
  level: number;
  flashcardsLearned: number;
}

interface WeeklyProgress {
  day: string;
  attempts: number;
  correct: number;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = usePermissionsContext();
  const { checkAndAwardAchievements, getUserProgress } = useAchievements();
  
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [stats, setStats] = useState<Stats>({
    totalExamsTaken: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    points: 0,
    level: 1,
    flashcardsLearned: 0,
  });
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const checkAchievements = useCallback(async () => {
    const progress = await getUserProgress();
    await checkAndAwardAchievements(progress);
  }, [getUserProgress, checkAndAwardAchievements]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch profile stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (profile) {
      setStats({
        totalExamsTaken: profile.total_exams_taken || 0,
        totalQuestionsAnswered: profile.total_questions_answered || 0,
        totalCorrectAnswers: profile.total_correct_answers || 0,
        points: profile.points || 0,
        level: profile.level || 1,
        flashcardsLearned: 0,
      });
    }

    // Fetch flashcard progress
    const { count: flashcardsCount } = await supabase
      .from('user_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('is_remembered', true);

    setStats(prev => ({
      ...prev,
      flashcardsLearned: flashcardsCount || 0,
    }));

    // Calculate weekly progress
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: weekAttempts } = await supabase
      .from('exam_attempts')
      .select('completed_at, correct_answers')
      .eq('user_id', user?.id)
      .gte('completed_at', weekAgo.toISOString());

    const progressByDay: Record<string, { attempts: number; correct: number }> = {};
    weekDays.forEach(day => {
      progressByDay[day] = { attempts: 0, correct: 0 };
    });

    weekAttempts?.forEach(attempt => {
      const date = new Date(attempt.completed_at);
      const dayName = weekDays[date.getDay()];
      progressByDay[dayName].attempts += 1;
      progressByDay[dayName].correct += attempt.correct_answers || 0;
    });

    setWeeklyProgress(weekDays.map(day => ({
      day,
      ...progressByDay[day],
    })));

    // Calculate streak
    let currentStreak = 0;
    const attemptDates = new Set(
      weekAttempts?.map(a => new Date(a.completed_at).toDateString()) || []
    );
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (attemptDates.has(checkDate.toDateString())) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    setStreak(currentStreak);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (user) {
      checkAchievements();
    }
  }, [user, checkAchievements]);

  const accuracy = useMemo(() => (
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100)
      : 0
  ), [stats.totalCorrectAnswers, stats.totalQuestionsAnswered]);

  const pointsToNextLevel = useMemo(() => (stats.level * 100) - (stats.points % 100), [stats.level, stats.points]);
  const levelProgress = useMemo(() => ((stats.points % 100) / 100) * 100, [stats.points]);

  // Render current section content
  const renderedSectionContent = useMemo(() => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            stats={stats}
            weeklyProgress={weeklyProgress}
            levelProgress={levelProgress}
            pointsToNextLevel={pointsToNextLevel}
            accuracy={accuracy}
          />
        );
      case 'my-courses':
        return <MyCoursesSection />;
      case 'my-classes':
        return <MyClassesSection />;
      case 'flashcards':
        return <FlashcardsSection />;
      case 'history':
        return <HistorySection />;
      case 'achievements':
        return <AchievementsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return null;
    }
  }, [activeSection, stats, weeklyProgress, levelProgress, pointsToNextLevel, accuracy]);

  const handleSectionChange = useCallback((section: DashboardSection) => {
    setActiveSection(section);
  }, []);

  // Not logged in
  if (!user) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Đăng nhập để xem Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Theo dõi tiến độ học tập và thống kê cá nhân của bạn
        </p>
        <Link to="/auth">
          <Button size="lg">Đăng nhập ngay</Button>
        </Link>
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-6 overflow-x-hidden">
      {/* Header - Hide on mobile when not on overview */}
        <div className={cn(
          "flex items-center justify-between gap-4 mb-6",
          activeSection !== 'overview' && "hidden lg:flex"
        )}>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi tiến độ học tập của bạn
            </p>
          </div>
          {(isAdmin || isTeacher) && (
            <Link to={isAdmin ? "/admin" : "/teacher"}>
              <Button variant="outline" size="sm">
                {isAdmin ? 'Admin Panel' : 'Teacher Panel'}
              </Button>
            </Link>
          )}
        </div>

        {/* 3-Column Layout: 2/6/4 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Sidebar Navigation (2/12 = ~16.6%) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-24">
              <DashboardSidebar 
                activeSection={activeSection} 
                onSectionChange={handleSectionChange}
              />
            </div>
          </div>

          {/* Middle Column - Main Content (6/12 = 50%) */}
          <div className="lg:col-span-6 pb-24 lg:pb-0">
            {/* Section Content */}
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/30" />}>
              {renderedSectionContent}
            </Suspense>
          </div>

          {/* Right Column - Suggestions (4/12 = ~33.3%) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <DashboardSuggestions
                streak={streak}
                level={stats.level}
                points={stats.points}
                pointsToNextLevel={pointsToNextLevel}
                levelProgress={levelProgress}
              />
            </div>
          </div>
        </div>
      </main>
      
      <MobileBottomNav 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
      />
      <AITutorButton />
    </>
  );
};

export default StudentDashboard;
