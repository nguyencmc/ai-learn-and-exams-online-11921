import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassLesson {
  id: string;
  class_id: string;
  lesson_id: string;
  is_published: boolean;
  due_at: string | null;
  assigned_at: string;
  lesson?: {
    id: string;
    title: string;
    content: string | null;
    cover_image: string | null;
    visibility: string;
  };
}

export interface ClassResource {
  id: string;
  class_id: string;
  resource_id: string;
  assigned_at: string;
  resource?: {
    id: string;
    title: string;
    description: string | null;
    type: 'document' | 'video' | 'link';
    url: string | null;
    file_path: string | null;
    file_size: number | null;
    mime_type: string | null;
  };
}

export interface ClassExamAssignment {
  id: string;
  class_id: string;
  exam_id: string;
  assigned_at: string;
  exam?: {
    id: string;
    title: string;
    subject: string | null;
  };
}

export interface ClassCourseAssignment {
  id: string;
  class_id: string;
  course_id: string;
  assigned_at: string;
  course?: {
    id: string;
    title: string;
    image_url: string | null;
  };
}

export interface ClassFlashcardAssignment {
  id: string;
  class_id: string;
  flashcard_set_id: string;
  assigned_at: string;
  flashcard_set?: {
    id: string;
    title: string;
  };
}

export interface ClassPodcastAssignment {
  id: string;
  class_id: string;
  podcast_id: string;
  assigned_at: string;
  podcast?: {
    id: string;
    title: string;
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useClassLessons = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-lessons', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_lesson_assignments')
        .select(`
          id, class_id, lesson_id, is_published, due_at, assigned_at,
          lesson:teacher_lessons(id, title, content, cover_image, visibility)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassLesson[];
    },
    enabled: !!classId,
  });
};

export const useClassResources = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-resources', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_resource_assignments')
        .select(`
          id, class_id, resource_id, assigned_at,
          resource:teacher_resources(id, title, description, type, url, file_path, file_size, mime_type)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassResource[];
    },
    enabled: !!classId,
  });
};

export const useClassExamAssignments = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-exams', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_exam_assignments')
        .select(`
          id, class_id, exam_id, assigned_at,
          exam:exams(id, title, subject)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassExamAssignment[];
    },
    enabled: !!classId,
  });
};

export const useClassCourseAssignments = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-courses', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_course_assignments')
        .select(`
          id, class_id, course_id, assigned_at,
          course:courses(id, title, image_url)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassCourseAssignment[];
    },
    enabled: !!classId,
  });
};

export const useClassFlashcardAssignments = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-flashcards', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_flashcard_assignments')
        .select(`
          id, class_id, flashcard_set_id, assigned_at,
          flashcard_set:flashcard_sets(id, title)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassFlashcardAssignment[];
    },
    enabled: !!classId,
  });
};

export const useClassPodcastAssignments = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-library-podcasts', classId],
    queryFn: async () => {
      if (!classId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('class_podcast_assignments')
        .select(`
          id, class_id, podcast_id, assigned_at,
          podcast:podcasts(id, title)
        `)
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClassPodcastAssignment[];
    },
    enabled: !!classId,
  });
};

// ─── Remove mutations ──────────────────────────────────────────────────────────

export const useRemoveClassLesson = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_lesson_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-lessons', classId] });
      toast({ title: 'Đã gỡ bài giảng' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};

export const useRemoveClassResource = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_resource_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-resources', classId] });
      toast({ title: 'Đã gỡ tài liệu' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};

export const useRemoveClassExamAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_exam_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-exams', classId] });
      toast({ title: 'Đã gỡ đề thi' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};

export const useRemoveClassCourseAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_course_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-courses', classId] });
      toast({ title: 'Đã gỡ khoá học' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};

export const useRemoveClassFlashcardAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_flashcard_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-flashcards', classId] });
      toast({ title: 'Đã gỡ flashcard' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};

export const useRemoveClassPodcastAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, classId }: { id: string; classId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('class_podcast_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return classId;
    },
    onSuccess: (classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-library-podcasts', classId] });
      toast({ title: 'Đã gỡ podcast' });
    },
    onError: (e: Error) => toast({ title: 'Lỗi', description: e.message, variant: 'destructive' }),
  });
};
