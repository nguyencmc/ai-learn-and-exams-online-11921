import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  badge_color: string;
  display_order: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
}

interface UserProgress {
  exams_completed: number;
  perfect_scores: number;
  streak_days: number;
  questions_answered: number;
  points_earned: number;
  flashcards_mastered: number;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .order('display_order', { ascending: true });
    
    setAchievements(data || []);
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);
    
    setUserAchievements(data || []);
  }, [user]);

  const checkAndAwardAchievements = useCallback(async (progress: UserProgress) => {
    if (!user) return;

    const unearned = achievements.filter(
      a => !userAchievements.some(ua => ua.achievement_id === a.id)
    );

    const newlyEarned: Achievement[] = [];

    for (const achievement of unearned) {
      let earned = false;

      switch (achievement.requirement_type) {
        case 'exams_completed':
          earned = progress.exams_completed >= achievement.requirement_value;
          break;
        case 'perfect_score':
          earned = progress.perfect_scores >= achievement.requirement_value;
          break;
        case 'streak_days':
          earned = progress.streak_days >= achievement.requirement_value;
          break;
        case 'questions_answered':
          earned = progress.questions_answered >= achievement.requirement_value;
          break;
        case 'points_earned':
          earned = progress.points_earned >= achievement.requirement_value;
          break;
        case 'flashcards_mastered':
          earned = progress.flashcards_mastered >= achievement.requirement_value;
          break;
      }

      if (earned) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({ user_id: user.id, achievement_id: achievement.id });

        if (!error) {
          newlyEarned.push(achievement);
        }
      }
    }

    if (newlyEarned.length > 0) {
      // Refresh user achievements
      await fetchUserAchievements();

      // Show toast for each new achievement
      newlyEarned.forEach(a => {
        toast({
          title: `🎉 Thành tựu mới: ${a.name}`,
          description: `${a.description} (+${a.points_reward} điểm)`,
        });
      });
    }

    return newlyEarned;
  }, [user, achievements, userAchievements, fetchUserAchievements, toast]);

  const getUserProgress = useCallback(async (): Promise<UserProgress> => {
    if (!user) {
      return {
        exams_completed: 0,
        perfect_scores: 0,
        streak_days: 0,
        questions_answered: 0,
        points_earned: 0,
        flashcards_mastered: 0,
      };
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch perfect scores count
    const { count: perfectScores } = await supabase
      .from('exam_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('score', 100);

    // Fetch flashcards mastered
    const { count: flashcardsMastered } = await supabase
      .from('user_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_remembered', true);

    // Calculate streak
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: attempts } = await supabase
      .from('exam_attempts')
      .select('completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', weekAgo.toISOString())
      .order('completed_at', { ascending: false });

    let streakDays = 0;
    if (attempts && attempts.length > 0) {
      const attemptDates = new Set(
        attempts.map(a => new Date(a.completed_at).toDateString())
      );
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        if (attemptDates.has(checkDate.toDateString())) {
          streakDays++;
        } else if (i > 0) {
          break;
        }
      }
    }

    return {
      exams_completed: profile?.total_exams_taken || 0,
      perfect_scores: perfectScores || 0,
      streak_days: streakDays,
      questions_answered: profile?.total_questions_answered || 0,
      points_earned: profile?.points || 0,
      flashcards_mastered: flashcardsMastered || 0,
    };
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAchievements();
      await fetchUserAchievements();
      setLoading(false);
    };

    init();
  }, [user, fetchAchievements, fetchUserAchievements]);

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
  
  const earnedAchievements = achievements.filter(a => earnedAchievementIds.has(a.id));
  const unearnedAchievements = achievements.filter(a => !earnedAchievementIds.has(a.id));

  return {
    achievements,
    userAchievements,
    earnedAchievements,
    unearnedAchievements,
    loading,
    checkAndAwardAchievements,
    getUserProgress,
    refreshAchievements: fetchUserAchievements,
  };
};
