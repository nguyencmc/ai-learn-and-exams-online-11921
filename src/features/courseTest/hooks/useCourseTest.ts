import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { CourseTest, TestQuestion, TestAttempt, TestResult, TestState } from '../types';

const log = logger('useCourseTest');

export function useCourseTest(lessonId: string, onComplete?: () => void) {
  const { user } = useAuth();
  const [test, setTest] = useState<CourseTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [testState, setTestState] = useState<TestState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<TestAttempt[]>([]);

  const fetchTestData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: testData, error: testError } = await supabase
        .from('course_tests')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (testError) throw testError;
      if (!testData) {
        setLoading(false);
        return;
      }

      setTest(testData);
      setTimeRemaining(testData.duration_minutes * 60);

      const { data: questionsData, error: questionsError } = await supabase
        .from('course_test_questions')
        .select('*')
        .eq('test_id', testData.id)
        .order('question_order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      if (user) {
        const { data: attemptsData } = await supabase
          .from('course_test_attempts')
          .select('*')
          .eq('test_id', testData.id)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        setPreviousAttempts((attemptsData || []).map(a => ({
          id: a.id,
          score: a.score || 0,
          total_questions: a.total_questions || 0,
          correct_answers: a.correct_answers || 0,
          passed: a.passed || false,
          completed_at: a.completed_at || a.started_at
        })));
      }
    } catch (error: unknown) {
      log.error('Error fetching test', error);
      toast.error('Không thể tải bài test');
    } finally {
      setLoading(false);
    }
  }, [lessonId, user]);

  useEffect(() => {
    fetchTestData();
  }, [fetchTestData]);

  const handleSubmitTest = useCallback(async () => {
    if (!user || !test) return;

    setSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      let correctCount = 0;
      const detailedAnswers: Record<string, { selected: string[]; correct: string[]; isCorrect: boolean }> = {};

      questions.forEach(q => {
        const selectedAnswers = (answers[q.id] || []).sort();
        const correctAnswers = q.correct_answer.split(',').map(a => a.trim()).sort();
        const isCorrect = JSON.stringify(selectedAnswers) === JSON.stringify(correctAnswers);

        if (isCorrect) correctCount++;

        detailedAnswers[q.id] = {
          selected: selectedAnswers,
          correct: correctAnswers,
          isCorrect
        };
      });

      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const passed = score >= test.pass_percentage;

      const answersJson: Record<string, string[]> = {};
      Object.keys(answers).forEach(key => {
        answersJson[key] = answers[key];
      });

      const { error } = await supabase
        .from('course_test_attempts')
        .insert({
          user_id: user.id,
          test_id: test.id,
          score,
          total_questions: totalQuestions,
          correct_answers: correctCount,
          passed,
          answers: answersJson,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setResult({
        score,
        correctCount,
        totalQuestions,
        passed,
        answers: detailedAnswers
      });
      setTestState('result');

      if (passed && onComplete) {
        onComplete();
      }
    } catch (error: unknown) {
      log.error('Error submitting test', error);
      toast.error('Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  }, [user, test, questions, answers, onComplete]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testState === 'taking' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testState, timeRemaining, handleSubmitTest]);

  const handleStartTest = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm bài test');
      return;
    }

    if (test && previousAttempts.length >= test.max_attempts) {
      toast.error(`Bạn đã hết lượt làm bài (tối đa ${test.max_attempts} lần)`);
      return;
    }

    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining((test?.duration_minutes || 30) * 60);
    setResult(null);
    setTestState('taking');
  };

  const handleSelectAnswer = (questionId: string, option: string, isMultiple: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [questionId]: [...current, option].sort() };
        }
      } else {
        return { ...prev, [questionId]: [option] };
      }
    });
  };

  const isMultipleAnswer = (question: TestQuestion) => {
    return question.correct_answer.includes(',');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key].length > 0).length;
  };

  const getOptionLabel = (option: string) => {
    const labels: Record<string, string> = {
      A: 'option_a', B: 'option_b', C: 'option_c', D: 'option_d',
      E: 'option_e', F: 'option_f', G: 'option_g', H: 'option_h'
    };
    return labels[option];
  };

  return {
    test,
    questions,
    loading,
    testState,
    currentQuestionIndex,
    answers,
    timeRemaining,
    submitting,
    showConfirmSubmit,
    result,
    previousAttempts,
    handleStartTest,
    handleSelectAnswer,
    handleSubmitTest,
    setCurrentQuestionIndex,
    setShowConfirmSubmit,
    setTestState,
    formatTime,
    getAnsweredCount,
    getOptionLabel,
    isMultipleAnswer,
  };
}
