import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { getErrorMessage } from '@/lib/utils';
import type { ExamCategory, ExamEditorState, ExamEditorActions, Question } from '../types';

export function useExamEditor(): ExamEditorState & ExamEditorActions {
  const { id } = useParams();
  const isEditing = !!id;
  const { hasPermission, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Exam fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  const canCreate = hasPermission('exams.create');
  const canEdit = hasPermission('exams.edit');
  const hasAccess = isEditing ? (canEdit || hasPermission('exams.edit_own')) : canCreate;

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, roleLoading, navigate]);

  const fetchExam = useCallback(async () => {
    setLoading(true);

    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !exam) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy đề thi",
        variant: "destructive",
      });
      navigate('/admin/exams');
      return;
    }

    setTitle(exam.title);
    setSlug(exam.slug);
    setDescription(exam.description || '');
    setCategoryId(exam.category_id || '');
    setDifficulty(exam.difficulty || 'medium');
    setDurationMinutes(exam.duration_minutes || 60);
    setThumbnailUrl((exam as Record<string, unknown>).thumbnail_url as string || '');

    // Fetch questions
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', id)
      .order('question_order', { ascending: true });

    setQuestions(questionsData?.map(q => ({
      ...q,
      option_e: q.option_e || '',
      option_f: q.option_f || '',
      option_g: q.option_g || '',
      option_h: q.option_h || '',
    })) || []);
    setLoading(false);
  }, [id, toast, navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('exam_categories').select('id, name');
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchExam();
    }
  }, [isEditing, fetchExam]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và slug",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất 1 câu hỏi",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let examId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('exams')
          .update({
            title,
            slug,
            description: description || null,
            category_id: categoryId || null,
            difficulty,
            duration_minutes: durationMinutes,
            question_count: questions.length,
            thumbnail_url: thumbnailUrl || null,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('exams')
          .insert({
            title,
            slug,
            description: description || null,
            category_id: categoryId || null,
            difficulty,
            duration_minutes: durationMinutes,
            question_count: questions.length,
            creator_id: user?.id,
            thumbnail_url: thumbnailUrl || null,
          })
          .select()
          .single();

        if (error) throw error;
        examId = data.id;
      }

      // Handle questions
      if (isEditing) {
        await supabase.from('questions').delete().eq('exam_id', examId);
      }

      if (questions.length > 0) {
        const questionsToInsert = questions.map((q, index) => ({
          exam_id: examId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c || null,
          option_d: q.option_d || null,
          option_e: q.option_e || null,
          option_f: q.option_f || null,
          option_g: q.option_g || null,
          option_h: q.option_h || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          question_order: index + 1,
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      await createAuditLog(
        isEditing ? 'update' : 'create',
        'exam',
        examId,
        isEditing ? { title, slug, question_count: questions.length } : null,
        { title, slug, difficulty, duration_minutes: durationMinutes, question_count: questions.length }
      );

      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật đề thi" : "Đã tạo đề thi mới",
      });

      navigate('/admin/exams');
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error) || "Không thể lưu đề thi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (file: File): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const ext = file.name.split('.').pop();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `exam-thumbnails/${year}/${month}/${day}/${uniqueId}.${ext}`;

    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(data.path);

    setThumbnailUrl(urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleThumbnailRemove = () => setThumbnailUrl('');

  const handleImageUpload = async (file: File, _questionIndex: number, _field: string): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const ext = file.name.split('.').pop();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${year}/${month}/${day}/${uniqueId}.${ext}`;

    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  return {
    // State
    categories,
    loading,
    saving,
    isEditing,
    hasAccess,
    roleLoading,
    title,
    slug,
    description,
    categoryId,
    difficulty,
    durationMinutes,
    thumbnailUrl,
    questions,

    // Actions
    setTitle,
    setSlug,
    setDescription,
    setCategoryId,
    setDifficulty,
    setDurationMinutes,
    setQuestions,
    handleSave,
    handleThumbnailUpload,
    handleThumbnailRemove,
    handleImageUpload,
  };
}
