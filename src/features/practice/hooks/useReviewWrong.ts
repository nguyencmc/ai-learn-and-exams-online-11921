import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWrongAttempts, fetchQuestionsByIds } from '../api';
import { supabase } from '@/integrations/supabase/client';
import type { PracticeQuestion } from '../types';

export function useReviewWrong() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const wrongAttemptsQuery = useQuery({
    queryKey: ['wrong-attempts', user?.id],
    queryFn: () => fetchWrongAttempts(user!.id),
    enabled: !!user,
  });

  // Get unique question IDs from wrong attempts (stable reference)
  const questionIds = useMemo(
    () =>
      wrongAttemptsQuery.data
        ? [...new Set(wrongAttemptsQuery.data.map((a) => a.question_id))]
        : [],
    [wrongAttemptsQuery.data]
  );

  const questionsQuery = useQuery({
    queryKey: ['wrong-questions', questionIds],
    queryFn: () => fetchQuestionsByIds(questionIds),
    enabled: questionIds.length > 0,
  });

  // Shuffle once when data arrives (stable with useMemo)
  const shuffledQuestions: PracticeQuestion[] = useMemo(() => {
    if (!questionsQuery.data) return [];
    return [...questionsQuery.data].sort(() => Math.random() - 0.5);
  }, [questionsQuery.data]);

  /** Đánh dấu câu hỏi đã nhớ — xóa tất cả wrong attempts của câu đó */
  const markAsMastered = async (questionId: string) => {
    if (!user) return;
    await supabase
      .from('practice_attempts')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .eq('is_correct', false);

    // Invalidate để refetch danh sách câu sai
    queryClient.invalidateQueries({ queryKey: ['wrong-attempts', user.id] });
  };

  return {
    questions: shuffledQuestions,
    isLoading: wrongAttemptsQuery.isLoading || questionsQuery.isLoading,
    error: wrongAttemptsQuery.error || questionsQuery.error,
    wrongCount: questionIds.length,
    markAsMastered,
  };
}
