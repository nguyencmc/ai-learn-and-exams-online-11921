import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils';
import type {
  TeacherLesson,
  TeacherResource,
  LibraryItem,
  ContentVisibility,
  LibraryContentType,
  ClassOption,
} from '../types';

const log = logger('useTeacherLibrary');

export function useTeacherLibrary(teacherId: string | undefined) {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [exams, setExams] = useState<LibraryItem[]>([]);
  const [courses, setCourses] = useState<LibraryItem[]>([]);
  const [flashcards, setFlashcards] = useState<LibraryItem[]>([]);
  const [podcasts, setPodcasts] = useState<LibraryItem[]>([]);
  const [myClasses, setMyClasses] = useState<ClassOption[]>([]);
  const [lessonUsageCounts, setLessonUsageCounts] = useState<Record<string, number>>({});
  const [resourceUsageCounts, setResourceUsageCounts] = useState<Record<string, number>>({});
  const [examUsageCounts, setExamUsageCounts] = useState<Record<string, number>>({});
  const [courseUsageCounts, setCourseUsageCounts] = useState<Record<string, number>>({});
  const [flashcardUsageCounts, setFlashcardUsageCounts] = useState<Record<string, number>>({});
  const [podcastUsageCounts, setPodcastUsageCounts] = useState<Record<string, number>>({});
  const [lessonCoverUrls, setLessonCoverUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [
        { data: lessonsData },
        { data: resourcesData },
        { data: examsData },
        { data: coursesData },
        { data: flashcardsData },
        { data: podcastsData },
        { data: classesData },
      ] = await Promise.all([
        supabase
          .from('teacher_lessons')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_resources')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('exams')
          .select('id, title, created_at, visibility, tags')
          .eq('creator_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('id, title, created_at, student_count, visibility, tags')
          .eq('creator_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('flashcard_sets')
          .select('id, title, created_at, visibility, tags')
          .eq('creator_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('podcasts')
          .select('id, title, created_at, visibility, tags')
          .eq('creator_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('classes')
          .select('id, title, class_code')
          .eq('creator_id', teacherId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      const lessonList = (lessonsData as unknown as TeacherLesson[]) || [];
      const resourceList = (resourcesData as unknown as TeacherResource[]) || [];
      setLessons(lessonList);
      setResources(resourceList);

      // Generate signed URLs for lesson covers
      const coversWithPath = lessonList.filter((l) => l.cover_image);
      if (coversWithPath.length > 0) {
        const signedEntries = await Promise.all(
          coversWithPath.map(async (l) => {
            const { data } = await supabase.storage
              .from('class-materials')
              .createSignedUrl(l.cover_image!, 3600);
            return [l.id, data?.signedUrl ?? ''] as [string, string];
          })
        );
        setLessonCoverUrls(Object.fromEntries(signedEntries.filter(([, url]) => url)));
      } else {
        setLessonCoverUrls({});
      }

      type ExamRow = { id: string; title: string; created_at: string; visibility?: string; tags?: string[] };
      type CourseRow = { id: string; title: string; created_at: string; student_count?: number; visibility?: string; tags?: string[] };
      type FlashcardRow = { id: string; title: string; created_at: string; visibility?: string; tags?: string[] };
      type PodcastRow = { id: string; title: string; created_at: string; visibility?: string; tags?: string[] };

      setExams(
        ((examsData || []) as ExamRow[]).map((e) => ({
          id: e.id,
          contentType: 'exam' as const,
          title: e.title,
          visibility: (e.visibility as ContentVisibility) || 'private',
          tags: e.tags || [],
          created_at: e.created_at,
          raw: e as unknown as Record<string, unknown>,
        }))
      );

      setCourses(
        ((coursesData || []) as CourseRow[]).map((c) => ({
          id: c.id,
          contentType: 'course' as const,
          title: c.title,
          subtitle: `${c.student_count || 0} học viên`,
          visibility: (c.visibility as ContentVisibility) || 'private',
          tags: c.tags || [],
          created_at: c.created_at,
          raw: c as unknown as Record<string, unknown>,
        }))
      );

      setFlashcards(
        ((flashcardsData || []) as FlashcardRow[]).map((f) => ({
          id: f.id,
          contentType: 'flashcard' as const,
          title: f.title,
          visibility: (f.visibility as ContentVisibility) || 'private',
          tags: f.tags || [],
          created_at: f.created_at,
          raw: f as unknown as Record<string, unknown>,
        }))
      );

      setPodcasts(
        ((podcastsData || []) as PodcastRow[]).map((p) => ({
          id: p.id,
          contentType: 'podcast' as const,
          title: p.title,
          visibility: (p.visibility as ContentVisibility) || 'private',
          tags: p.tags || [],
          created_at: p.created_at,
          raw: p as unknown as Record<string, unknown>,
        }))
      );

      setMyClasses(
        (classesData || []).map((c) => ({
          id: c.id,
          title: c.title,
          class_code: c.class_code,
        }))
      );

      // Fetch usage counts for lessons and resources
      if (lessonList.length > 0) {
        const lessonIds = lessonList.map((l) => l.id);
        const { data: usageData } = await supabase
          .from('class_lesson_assignments')
          .select('lesson_id')
          .in('lesson_id', lessonIds);
        const counts: Record<string, number> = {};
        (usageData || []).forEach((row: { lesson_id: string }) => {
          counts[row.lesson_id] = (counts[row.lesson_id] || 0) + 1;
        });
        setLessonUsageCounts(counts);
      } else {
        setLessonUsageCounts({});
      }

      if (resourceList.length > 0) {
        const resourceIds = resourceList.map((r) => r.id);
        const { data: usageData } = await supabase
          .from('class_resource_assignments')
          .select('resource_id')
          .in('resource_id', resourceIds);
        const counts: Record<string, number> = {};
        (usageData || []).forEach((row: { resource_id: string }) => {
          counts[row.resource_id] = (counts[row.resource_id] || 0) + 1;
        });
        setResourceUsageCounts(counts);
      } else {
        setResourceUsageCounts({});
      }

      // Fetch usage counts for existing content types
      const buildCounts = (data: { [k: string]: string }[] | null, idCol: string) => {
        const m: Record<string, number> = {};
        (data || []).forEach((r) => { const id = r[idCol]; if (id) m[id] = (m[id] || 0) + 1; });
        return m;
      };

      const [examIdsArr, courseIdsArr, flashcardIdsArr, podcastIdsArr] = [
        (examsData || []).map((e: { id: string }) => e.id),
        (coursesData || []).map((c: { id: string }) => c.id),
        (flashcardsData || []).map((f: { id: string }) => f.id),
        (podcastsData || []).map((p: { id: string }) => p.id),
      ];

      const [
        { data: examUsage },
        { data: courseUsage },
        { data: flashcardUsage },
        { data: podcastUsage },
      ] = await Promise.all([
        examIdsArr.length > 0
          ? supabase.from('class_exam_assignments').select('exam_id').in('exam_id', examIdsArr)
          : Promise.resolve({ data: [] }),
        courseIdsArr.length > 0
          ? supabase.from('class_course_assignments').select('course_id').in('course_id', courseIdsArr)
          : Promise.resolve({ data: [] }),
        flashcardIdsArr.length > 0
          ? supabase.from('class_flashcard_assignments').select('flashcard_set_id').in('flashcard_set_id', flashcardIdsArr)
          : Promise.resolve({ data: [] }),
        podcastIdsArr.length > 0
          ? supabase.from('class_podcast_assignments').select('podcast_id').in('podcast_id', podcastIdsArr)
          : Promise.resolve({ data: [] }),
      ]);

      setExamUsageCounts(buildCounts(examUsage as { [k: string]: string }[] | null, 'exam_id'));
      setCourseUsageCounts(buildCounts(courseUsage as { [k: string]: string }[] | null, 'course_id'));
      setFlashcardUsageCounts(buildCounts(flashcardUsage as { [k: string]: string }[] | null, 'flashcard_set_id'));
      setPodcastUsageCounts(buildCounts(podcastUsage as { [k: string]: string }[] | null, 'podcast_id'));
    } catch (error: unknown) {
      log.error('Failed to fetch teacher library data', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const createLesson = useCallback(
    async (data: Partial<TeacherLesson>): Promise<TeacherLesson | null> => {
      if (!teacherId) return null;
      const { data: created, error } = await supabase
        .from('teacher_lessons')
        .insert({ ...data, teacher_id: teacherId })
        .select()
        .single();
      if (error) throw error;
      const lesson = created as unknown as TeacherLesson;
      setLessons((prev) => [lesson, ...prev]);
      return lesson;
    },
    [teacherId]
  );

  const updateLesson = useCallback(
    async (id: string, data: Partial<TeacherLesson>): Promise<void> => {
      const { error } = await supabase
        .from('teacher_lessons')
        .update(data as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...data } : l))
      );
    },
    []
  );

  const deleteLesson = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('teacher_lessons')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const toggleLessonVisibility = useCallback(
    async (id: string, current: ContentVisibility): Promise<void> => {
      const next = current === 'private' ? 'public' : 'private';
      await updateLesson(id, { visibility: next });
    },
    [updateLesson]
  );

  const createResource = useCallback(
    async (data: Partial<TeacherResource>): Promise<TeacherResource | null> => {
      if (!teacherId) return null;
      const { data: created, error } = await supabase
        .from('teacher_resources')
        .insert({ ...data, teacher_id: teacherId })
        .select()
        .single();
      if (error) throw error;
      const resource = created as unknown as TeacherResource;
      setResources((prev) => [resource, ...prev]);
      return resource;
    },
    [teacherId]
  );

  const updateResource = useCallback(
    async (id: string, data: Partial<TeacherResource>): Promise<void> => {
      const { error } = await supabase
        .from('teacher_resources')
        .update(data as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      );
    },
    []
  );

  const deleteResource = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('teacher_resources')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleResourceVisibility = useCallback(
    async (id: string, current: ContentVisibility): Promise<void> => {
      const next = current === 'private' ? 'public' : 'private';
      await updateResource(id, { visibility: next });
    },
    [updateResource]
  );

  const toggleExistingContentVisibility = useCallback(
    async (
      contentType: Exclude<LibraryContentType, 'lesson' | 'resource'>,
      id: string,
      current: ContentVisibility
    ): Promise<void> => {
      const next = current === 'private' ? 'public' : 'private';
      const tableMap: Record<string, string> = {
        exam: 'exams',
        course: 'courses',
        flashcard: 'flashcard_sets',
        podcast: 'podcasts',
      };
      const table = tableMap[contentType];
      const { error } = await supabase
        .from(table as 'exams')
        .update({ visibility: next } as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
      const updater = (items: LibraryItem[]) =>
        items.map((item) =>
          item.id === id ? { ...item, visibility: next } : item
        );
      if (contentType === 'exam') setExams(updater);
      else if (contentType === 'course') setCourses(updater);
      else if (contentType === 'flashcard') setFlashcards(updater);
      else if (contentType === 'podcast') setPodcasts(updater);
    },
    []
  );

  const getAssignedClassIds = useCallback(
    async (
      contentType: LibraryContentType,
      contentId: string
    ): Promise<string[]> => {
      const config: Partial<Record<LibraryContentType, { table: string; idCol: string }>> = {
        lesson:    { table: 'class_lesson_assignments',    idCol: 'lesson_id' },
        resource:  { table: 'class_resource_assignments',  idCol: 'resource_id' },
        exam:      { table: 'class_exam_assignments',      idCol: 'exam_id' },
        course:    { table: 'class_course_assignments',    idCol: 'course_id' },
        flashcard: { table: 'class_flashcard_assignments', idCol: 'flashcard_set_id' },
        podcast:   { table: 'class_podcast_assignments',   idCol: 'podcast_id' },
      };
      const cfg = config[contentType];
      if (!cfg) return [];
      const { data } = await supabase
        .from(cfg.table as 'class_lesson_assignments')
        .select('class_id')
        .eq(cfg.idCol as 'lesson_id', contentId);
      return (data || []).map((r: { class_id: string }) => r.class_id);
    },
    []
  );

  const assignToClass = useCallback(
    async (
      contentType: LibraryContentType,
      contentId: string,
      classId: string
    ): Promise<void> => {
      if (!teacherId) return;
      type InsertRow = { class_id: string; assigned_by: string; [key: string]: string };

      const config: Partial<Record<LibraryContentType, { table: string; idCol: string }>> = {
        lesson:    { table: 'class_lesson_assignments',    idCol: 'lesson_id' },
        resource:  { table: 'class_resource_assignments',  idCol: 'resource_id' },
        exam:      { table: 'class_exam_assignments',      idCol: 'exam_id' },
        course:    { table: 'class_course_assignments',    idCol: 'course_id' },
        flashcard: { table: 'class_flashcard_assignments', idCol: 'flashcard_set_id' },
        podcast:   { table: 'class_podcast_assignments',   idCol: 'podcast_id' },
      };
      const cfg = config[contentType];
      if (!cfg) return;

      const row: InsertRow = {
        class_id: classId,
        assigned_by: teacherId,
        [cfg.idCol]: contentId,
      };
      const { error } = await supabase
        .from(cfg.table as 'class_lesson_assignments')
        .insert(row as unknown as Record<string, unknown>);
      if (error && error.code !== '23505') throw error;

      const countUpdaters: Partial<Record<LibraryContentType, Dispatch<SetStateAction<Record<string, number>>>>> = {
        lesson:    setLessonUsageCounts,
        resource:  setResourceUsageCounts,
        exam:      setExamUsageCounts,
        course:    setCourseUsageCounts,
        flashcard: setFlashcardUsageCounts,
        podcast:   setPodcastUsageCounts,
      };
      const updater = countUpdaters[contentType];
      if (updater) {
        updater((prev) => ({ ...prev, [contentId]: (prev[contentId] || 0) + 1 }));
      }
    },
    [teacherId]
  );

  return {
    lessons,
    resources,
    exams,
    courses,
    flashcards,
    podcasts,
    myClasses,
    lessonUsageCounts,
    resourceUsageCounts,
    examUsageCounts,
    courseUsageCounts,
    flashcardUsageCounts,
    podcastUsageCounts,
    lessonCoverUrls,
    loading,
    fetchData,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonVisibility,
    createResource,
    updateResource,
    deleteResource,
    toggleResourceVisibility,
    toggleExistingContentVisibility,
    getAssignedClassIds,
    assignToClass,
  };
}
