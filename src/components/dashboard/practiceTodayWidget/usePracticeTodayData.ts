import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils';
import { buildRecommendations, buildSummary, isToday, isWithinDays } from './buildRecommendations';
import type { InProgressSession, WrongAnswerStats, LastPracticeSet, Recommendation, UserStats } from './types';

const log = logger('PracticeTodayWidget');

export function usePracticeTodayData() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inProgressSession, setInProgressSession] = useState<InProgressSession | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerStats>({ count: 0, questionIds: [] });
  const [lastPracticeSet, setLastPracticeSet] = useState<LastPracticeSet | null>(null);

  const [smartRecs, setSmartRecs] = useState<Recommendation[]>([]);
  const [smartSummary, setSmartSummary] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);

  const fetchData = useCallback(async () => {
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
      let foundLastSet = false;
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
          if (set) {
            setLastPracticeSet(set);
            foundLastSet = true;
          }
        }
      }

      if (!foundLastSet) {
        const { data: fallbackSet } = await supabase
          .from('question_sets')
          .select('id, title')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackSet && fallbackSet.length > 0) setLastPracticeSet(fallbackSet[0]);
      }
    } catch (error: unknown) {
      log.error('Error fetching practice today data', getErrorMessage(error));
    }
    setLoading(false);
  }, [user]);

  const computeSmartRecommendations = useCallback(async () => {
    if (!user) return;
    setSmartLoading(true);
    try {
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

      const { count: flashcardsDue } = await supabase
        .from('user_flashcard_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());

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

      const { data: wrongData } = await supabase
        .from('practice_attempts')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_correct', false)
        .limit(50);
      const wrongAnswerCount = new Set((wrongData ?? []).map(a => a.question_id)).size;

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
    } catch (error: unknown) {
      log.error('Smart recommendations error', getErrorMessage(error));
    } finally {
      setSmartLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      computeSmartRecommendations();
    } else {
      setLoading(false);
    }
  }, [user, fetchData, computeSmartRecommendations]);

  return {
    user,
    loading,
    smartLoading,
    inProgressSession,
    wrongAnswers,
    lastPracticeSet,
    smartRecs,
    smartSummary,
    fetchData,
    computeSmartRecommendations,
  };
}
