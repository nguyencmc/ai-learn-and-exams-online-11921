import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';
import type { CourseTest, TestQuestion } from './types';

const log = logger('CourseTestEditor');

function createDefaultTest(lessonId: string, lessonTitle: string): CourseTest {
  return {
    lesson_id: lessonId,
    title: `Bài kiểm tra: ${lessonTitle}`,
    description: '',
    duration_minutes: 30,
    pass_percentage: 70,
    max_attempts: 3,
    is_required: false,
  };
}

export function useCourseTestEditor(lessonId: string, lessonTitle: string) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<CourseTest>(createDefaultTest(lessonId, lessonTitle));
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  const fetchTestData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: testData } = await supabase
        .from('course_tests')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (testData) {
        setTest(testData);

        const { data: questionsData } = await supabase
          .from('course_test_questions')
          .select('*')
          .eq('test_id', testData.id)
          .order('question_order');

        setQuestions(questionsData || []);
      } else {
        setTest(createDefaultTest(lessonId, lessonTitle));
        setQuestions([]);
      }
    } catch (error: unknown) {
      log.error('Error fetching test', error);
    } finally {
      setLoading(false);
    }
  }, [lessonId, lessonTitle]);

  useEffect(() => {
    if (open) {
      fetchTestData();
    }
  }, [open, fetchTestData]);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: '',
        question_order: prev.length,
      },
    ]);
  };

  const updateQuestion = (index: number, data: Partial<TestQuestion>) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!test.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên bài test",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let testId = test.id;

      if (test.id) {
        const { error } = await supabase
          .from('course_tests')
          .update({
            title: test.title,
            description: test.description,
            duration_minutes: test.duration_minutes,
            pass_percentage: test.pass_percentage,
            max_attempts: test.max_attempts,
            is_required: test.is_required,
          })
          .eq('id', test.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('course_tests')
          .insert({
            lesson_id: lessonId,
            title: test.title,
            description: test.description,
            duration_minutes: test.duration_minutes,
            pass_percentage: test.pass_percentage,
            max_attempts: test.max_attempts,
            is_required: test.is_required,
          })
          .select()
          .single();

        if (error) throw error;
        testId = data.id;
        setTest(prev => ({ ...prev, id: data.id }));
      }

      if (testId) {
        await supabase
          .from('course_test_questions')
          .delete()
          .eq('test_id', testId);

        if (questions.length > 0) {
          const questionsToInsert = questions.map((q, index) => ({
            test_id: testId,
            question_text: q.question_text,
            question_image: q.question_image,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            question_order: index,
          }));

          const { error } = await supabase
            .from('course_test_questions')
            .insert(questionsToInsert);

          if (error) throw error;
        }
      }

      toast({
        title: "Thành công",
        description: "Đã lưu bài test",
      });
    } catch (error: unknown) {
      log.error('Error saving test', error);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    setOpen,
    loading,
    saving,
    test,
    setTest,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    handleSave,
  };
}
