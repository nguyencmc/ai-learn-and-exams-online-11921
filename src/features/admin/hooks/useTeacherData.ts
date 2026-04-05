import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils';
import type {
  TeacherStats,
  RecentItem,
  CourseWithStats,
  ClassWithStats,
  StudentSummary,
} from '@/features/admin/types';

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
  const [myClasses, setMyClasses] = useState<ClassWithStats[]>([]);
  const [myStudents, setMyStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [
        { count: examsCount },
        { count: questionsCount },
        { count: flashcardsCount },
        { count: podcastsCount },
        { data: coursesData },
        { data: classesRaw },
      ] = await Promise.all([
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('flashcard_sets').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('podcasts').select('*', { count: 'exact', head: true }),
        supabase
          .from('courses')
          .select('id, title, image_url, student_count, rating, is_published, created_at')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('classes')
          .select('id, title, description, class_code, is_active, created_at')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      const courses = (coursesData || []) as CourseWithStats[];
      const classes = classesRaw || [];

      setMyCourses(courses);

      // ──────────────────────────────────────────────────
      // Build ClassWithStats (members + assignments + grading)
      // ──────────────────────────────────────────────────
      let classesWithStats: ClassWithStats[] = [];
      if (classes.length > 0) {
        const classIds = classes.map((c) => c.id);

        const [
          { data: membersData },
          { data: assignmentsData },
        ] = await Promise.all([
          supabase.from('class_members').select('class_id').in('class_id', classIds).eq('role', 'student'),
          supabase
            .from('class_assignments')
            .select('id, class_id')
            .in('class_id', classIds),
        ]);

        const memberCountMap: Record<string, number> = {};
        (membersData || []).forEach((m) => {
          memberCountMap[m.class_id] = (memberCountMap[m.class_id] || 0) + 1;
        });

        const assignmentsByClass: Record<string, string[]> = {};
        const allAssignmentIds: string[] = [];
        (assignmentsData || []).forEach((a) => {
          if (!assignmentsByClass[a.class_id]) assignmentsByClass[a.class_id] = [];
          assignmentsByClass[a.class_id].push(a.id);
          allAssignmentIds.push(a.id);
        });

        const pendingGradingByClass: Record<string, number> = {};
        if (allAssignmentIds.length > 0) {
          const { data: submissionsData } = await supabase
            .from('assignment_submissions')
            .select('assignment_id')
            .in('assignment_id', allAssignmentIds)
            .eq('status', 'submitted');

          (submissionsData || []).forEach((s) => {
            (assignmentsData || []).forEach((a) => {
              if (a.id === s.assignment_id) {
                pendingGradingByClass[a.class_id] = (pendingGradingByClass[a.class_id] || 0) + 1;
              }
            });
          });
        }

        classesWithStats = classes.map((c) => ({
          ...c,
          member_count: memberCountMap[c.id] || 0,
          total_assignments: (assignmentsByClass[c.id] || []).length,
          pending_grading: pendingGradingByClass[c.id] || 0,
        }));
        setMyClasses(classesWithStats);
      } else {
        setMyClasses([]);
      }

      // ──────────────────────────────────────────────────
      // Build StudentSummary (multi-source, no first-wins dedup)
      // ──────────────────────────────────────────────────
      const studentMap = new Map<string, StudentSummary>();

      const addOrMergeStudent = (
        userId: string,
        profile: { full_name: string | null; username: string | null; email: string | null; avatar_url?: string | null },
        source: { type: 'class' | 'course'; name: string; id: string; last_activity: string | null; progress: number }
      ) => {
        const existing = studentMap.get(userId);
        if (existing) {
          const alreadyHasSource = existing.sources.some(
            (s) => s.type === source.type && s.id === source.id
          );
          if (!alreadyHasSource) {
            existing.sources.push(source);
          }
          if (
            source.last_activity &&
            (!existing.last_activity || source.last_activity > existing.last_activity)
          ) {
            existing.last_activity = source.last_activity;
          }
        } else {
          studentMap.set(userId, {
            id: userId,
            full_name: profile.full_name ?? null,
            username: profile.username ?? null,
            email: profile.email ?? null,
            avatar_url: profile.avatar_url ?? null,
            sources: [source],
            last_activity: source.last_activity,
          });
        }
      };

      if (classesWithStats.length > 0) {
        const classIds = classesWithStats.map((c) => c.id);
        const { data: classMembersData } = await supabase
          .from('class_members')
          .select('user_id, class_id, joined_at')
          .in('class_id', classIds)
          .eq('role', 'student');

        if (classMembersData && classMembersData.length > 0) {
          const userIds = [...new Set(classMembersData.map((m) => m.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, email, avatar_url')
            .in('user_id', userIds);

          const profileMap: Record<string, { full_name: string | null; username: string | null; email: string | null; avatar_url: string | null }> = {};
          (profilesData || []).forEach((p) => {
            profileMap[p.user_id] = p;
          });

          classMembersData.forEach((member) => {
            const classInfo = classesWithStats.find((c) => c.id === member.class_id);
            if (!classInfo) return;
            const profile = profileMap[member.user_id] ?? { full_name: null, username: null, email: null, avatar_url: null };
            addOrMergeStudent(member.user_id, profile, {
              type: 'class',
              name: classInfo.title,
              id: classInfo.id,
              last_activity: member.joined_at ?? null,
              progress: 0,
            });
          });
        }
      }

      if (courses.length > 0) {
        const courseIds = courses.map((c) => c.id);
        const { data: enrollmentsData } = await supabase
          .from('user_course_enrollments')
          .select('user_id, course_id, enrolled_at, progress_percentage')
          .in('course_id', courseIds);

        if (enrollmentsData && enrollmentsData.length > 0) {
          const userIds = [...new Set(enrollmentsData.map((e) => e.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, email, avatar_url')
            .in('user_id', userIds);

          const profileMap: Record<string, { full_name: string | null; username: string | null; email: string | null; avatar_url: string | null }> = {};
          (profilesData || []).forEach((p) => {
            profileMap[p.user_id] = p;
          });

          enrollmentsData.forEach((enroll) => {
            const courseInfo = courses.find((c) => c.id === enroll.course_id);
            if (!courseInfo) return;
            const profile = profileMap[enroll.user_id] ?? { full_name: null, username: null, email: null, avatar_url: null };
            addOrMergeStudent(enroll.user_id, profile, {
              type: 'course',
              name: courseInfo.title,
              id: courseInfo.id,
              last_activity: enroll.enrolled_at ?? null,
              progress: enroll.progress_percentage ?? 0,
            });
          });
        }
      }

      const allStudents = Array.from(studentMap.values());
      setMyStudents(allStudents);

      // ──────────────────────────────────────────────────
      // Compute aggregate stats
      // ──────────────────────────────────────────────────
      const totalStudents = allStudents.length;
      const ratings = courses.filter((c) => c.rating).map((c) => c.rating!);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;

      setStats({
        totalExams: examsCount || 0,
        totalQuestions: questionsCount || 0,
        totalFlashcardSets: flashcardsCount || 0,
        totalPodcasts: podcastsCount || 0,
        totalCourses: courses.length,
        totalStudents,
        totalClasses: classes.length,
        avgRating,
      });

      // ──────────────────────────────────────────────────
      // Recent items
      // ──────────────────────────────────────────────────
      const [{ data: recentExams }, { data: recentCourses }] = await Promise.all([
        supabase
          .from('exams')
          .select('id, title, created_at')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('courses')
          .select('id, title, created_at, student_count')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const items: RecentItem[] = [
        ...(recentExams || []).map((e) => ({
          id: e.id,
          title: e.title,
          type: 'exam' as const,
          created_at: e.created_at,
        })),
        ...(recentCourses || []).map((c) => ({
          id: c.id,
          title: c.title,
          type: 'course' as const,
          created_at: c.created_at,
          stats: `${c.student_count || 0} học viên`,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentItems(items);
    } catch (error: unknown) {
      log.error('Failed to fetch teacher data', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { stats, recentItems, myCourses, myClasses, myStudents, loading, fetchData };
}
