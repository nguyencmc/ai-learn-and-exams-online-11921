import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils';
import type { TeacherStats, RecentItem, CourseWithStats } from '@/features/admin/types';

const log = logger('useTeacherData');

const INITIAL_STATS: TeacherStats = {
  totalExams: 0,
  totalQuestions: 0,
  totalFlashcardSets: 0,
  totalPodcasts: 0,
  totalCourses: 0,
  totalStudents: 0,
  totalClasses: 0,
  avgRating: 0,
};

export function useTeacherData(userId: string | undefined) {
  const [stats, setStats] = useState<TeacherStats>(INITIAL_STATS);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [myCourses, setMyCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch all stats in parallel
      const [
        { count: examsCount },
        { count: questionsCount },
        { count: flashcardsCount },
        { count: podcastsCount },
        { data: coursesData },
        { data: classesData },
      ] = await Promise.all([
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('flashcard_sets').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('podcasts').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('id, title, image_url, student_count, rating, is_published, created_at').eq('creator_id', userId).order('created_at', { ascending: false }),
        supabase.from('classes').select('id').eq('creator_id', userId),
      ]);

      // Calculate total students from enrollments
      let totalStudents = 0;
      let avgRating = 0;

      if (coursesData && coursesData.length > 0) {
        totalStudents = coursesData.reduce((sum, c) => sum + (c.student_count || 0), 0);
        const ratings = coursesData.filter(c => c.rating).map(c => c.rating!);
        if (ratings.length > 0) {
          avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        }
        setMyCourses(coursesData as CourseWithStats[]);
      }

      setStats({
        totalExams: examsCount || 0,
        totalQuestions: questionsCount || 0,
        totalFlashcardSets: flashcardsCount || 0,
        totalPodcasts: podcastsCount || 0,
        totalCourses: coursesData?.length || 0,
        totalStudents,
        totalClasses: classesData?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      });

      // Fetch recent items
      const { data: recentExams } = await supabase
        .from('exams')
        .select('id, title, created_at')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentCourses } = await supabase
        .from('courses')
        .select('id, title, created_at, student_count')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      const items: RecentItem[] = [
        ...(recentExams || []).map(e => ({
          id: e.id,
          title: e.title,
          type: 'exam' as const,
          created_at: e.created_at,
        })),
        ...(recentCourses || []).map(c => ({
          id: c.id,
          title: c.title,
          type: 'course' as const,
          created_at: c.created_at,
          stats: `${c.student_count || 0} học viên`,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      setRecentItems(items);
    } catch (error: unknown) {
      log.error('Failed to fetch teacher data', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { stats, recentItems, myCourses, loading, fetchData };
}
