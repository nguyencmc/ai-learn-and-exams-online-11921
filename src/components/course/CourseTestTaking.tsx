import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const log = logger('CourseTestTaking');
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HtmlContent } from '@/components/ui/HtmlContent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Trophy,
  RotateCcw,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseTest {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  is_required: boolean;
}

interface TestQuestion {
  id: string;
  question_text: string;
  question_image: string | null;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  option_f: string | null;
  option_g: string | null;
  option_h: string | null;
  correct_answer: string;
  explanation: string | null;
  question_order: number;
}

interface TestAttempt {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  completed_at: string;
}

interface CourseTestTakingProps {
  lessonId: string;
  onComplete?: () => void;
}

export const CourseTestTaking = ({ lessonId, onComplete }: CourseTestTakingProps) => {
  const { user } = useAuth();
  const [test, setTest] = useState<CourseTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [testState, setTestState] = useState<'intro' | 'taking' | 'result'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    passed: boolean;
    answers: Record<string, { selected: string[], correct: string[], isCorrect: boolean }>;
  } | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    fetchTestData();
  }, [lessonId]);

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
  }, [testState, timeRemaining]);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      // Fetch test info
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

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('course_test_questions')
        .select('*')
        .eq('test_id', testData.id)
        .order('question_order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch previous attempts
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
    } catch (error) {
      log.error('Error fetching test', error);
      toast.error('Không thể tải bài test');
    } finally {
      setLoading(false);
    }
  };

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
        // Multi-select
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [questionId]: [...current, option].sort() };
        }
      } else {
        // Single select
        return { ...prev, [questionId]: [option] };
      }
    });
  };

  const isMultipleAnswer = (question: TestQuestion) => {
    return question.correct_answer.includes(',');
  };

  const handleSubmitTest = useCallback(async () => {
    if (!user || !test) return;
    
    setSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      // Calculate results
      let correctCount = 0;
      const detailedAnswers: Record<string, { selected: string[], correct: string[], isCorrect: boolean }> = {};

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

      // Save attempt to database
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
    } catch (error) {
      log.error('Error submitting test', error);
      toast.error('Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  }, [user, test, questions, answers, onComplete]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Bài học này chưa có bài test</p>
        </CardContent>
      </Card>
    );
  }

  // Intro screen
  if (testState === 'intro') {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{test.title}</CardTitle>
          {test.description && (
            <CardDescription>{test.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Câu hỏi</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{test.duration_minutes}</p>
              <p className="text-sm text-muted-foreground">Phút</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{test.pass_percentage}%</p>
              <p className="text-sm text-muted-foreground">Điểm đạt</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {test.max_attempts - previousAttempts.length}
              </p>
              <p className="text-sm text-muted-foreground">Lượt còn lại</p>
            </div>
          </div>

          {previousAttempts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Lịch sử làm bài</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {previousAttempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <span>Lần {previousAttempts.length - index}</span>
                    <div className="flex items-center gap-3">
                      <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                        {attempt.score}%
                      </span>
                      <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                        {attempt.passed ? 'Đạt' : 'Chưa đạt'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStartTest}
              disabled={previousAttempts.length >= test.max_attempts}
              className="gap-2"
            >
              {previousAttempts.length >= test.max_attempts ? (
                'Đã hết lượt làm bài'
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Bắt đầu làm bài
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Taking test
  if (testState === 'taking') {
    const currentQuestion = questions[currentQuestionIndex];
    const isMultiple = isMultipleAnswer(currentQuestion);
    const selectedAnswers = answers[currentQuestion.id] || [];

    const availableOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(opt => {
      const key = getOptionLabel(opt) as keyof TestQuestion;
      return currentQuestion[key];
    });

    return (
      <div className="space-y-4">
        {/* Header with timer and progress */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-mono text-lg ${
                  timeRemaining < 60 ? 'text-red-500 animate-pulse' : 
                  timeRemaining < 300 ? 'text-orange-500' : ''
                }`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
                <Badge variant="outline">
                  {getAnsweredCount()}/{questions.length} đã trả lời
                </Badge>
              </div>
              <Button 
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
              >
                Nộp bài
              </Button>
            </div>
            <Progress 
              value={(currentQuestionIndex + 1) / questions.length * 100} 
              className="mt-3 h-1" 
            />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Câu {currentQuestionIndex + 1}/{questions.length}
                </Badge>
                {isMultiple && (
                  <Badge variant="outline" className="ml-2 mb-2">
                    Chọn nhiều đáp án
                  </Badge>
                )}
                <CardTitle className="text-lg font-medium leading-relaxed">
                  <HtmlContent html={currentQuestion.question_text} />
                </CardTitle>
              </div>
            </div>
            {currentQuestion.question_image && (
              <img 
                src={currentQuestion.question_image} 
                alt="Question" 
                className="mt-4 max-w-full rounded-lg"
              />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {isMultiple ? (
              // Multiple choice with checkbox
              <div className="space-y-3">
                {availableOptions.map(opt => {
                  const key = getOptionLabel(opt) as keyof TestQuestion;
                  const optionText = currentQuestion[key] as string;
                  const isSelected = selectedAnswers.includes(opt);

                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectAnswer(currentQuestion.id, opt, true)}
                      />
                      <span className="font-medium text-primary">{opt}.</span>
                      <span className="flex-1">{optionText}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              // Single choice with radio
              <RadioGroup
                value={selectedAnswers[0] || ''}
                onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value, false)}
                className="space-y-3"
              >
                {availableOptions.map(opt => {
                  const key = getOptionLabel(opt) as keyof TestQuestion;
                  const optionText = currentQuestion[key] as string;

                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedAnswers[0] === opt 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={opt} id={`opt-${opt}`} />
                      <span className="font-medium text-primary">{opt}.</span>
                      <span className="flex-1">{optionText}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Câu trước
          </Button>

          {/* Question dots */}
          <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-md">
            {questions.map((q, index) => {
              const hasAnswer = (answers[q.id] || []).length > 0;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : hasAnswer
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Câu sau
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Confirm submit dialog */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn đã trả lời {getAnsweredCount()}/{questions.length} câu hỏi.
                {getAnsweredCount() < questions.length && (
                  <span className="text-orange-600 block mt-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Còn {questions.length - getAnsweredCount()} câu chưa trả lời!
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitTest} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Nộp bài'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Result screen
  if (testState === 'result' && result) {
    return (
      <div className="space-y-6">
        {/* Result Summary */}
        <Card className={`border-2 ${result.passed ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="py-8 text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.passed ? (
                <Trophy className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              result.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.passed ? 'Chúc mừng! Bạn đã đạt!' : 'Chưa đạt yêu cầu'}
            </h2>
            <p className="text-4xl font-bold mb-4">{result.score}%</p>
            <p className="text-muted-foreground">
              Đúng {result.correctCount}/{result.totalQuestions} câu
              {' • '}Yêu cầu: {test.pass_percentage}%
            </p>
          </CardContent>
        </Card>

        {/* Retry button */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => setTestState('intro')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Quay lại
          </Button>
          {previousAttempts.length < test.max_attempts && (
            <Button onClick={handleStartTest}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Làm lại
            </Button>
          )}
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chi tiết kết quả</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const questionResult = result.answers[question.id];
                  const isCorrect = questionResult?.isCorrect;
                  const isMultiple = isMultipleAnswer(question);

                  const availableOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(opt => {
                    const key = getOptionLabel(opt) as keyof TestQuestion;
                    return question[key];
                  });

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-muted-foreground mb-1">
                            Câu {index + 1}
                            {isMultiple && <Badge variant="outline" className="ml-2 text-xs">Nhiều đáp án</Badge>}
                          </p>
                          <HtmlContent html={question.question_text} className="font-medium" />
                        </div>
                      </div>

                      <div className="ml-8 space-y-2">
                        {availableOptions.map(opt => {
                          const key = getOptionLabel(opt) as keyof TestQuestion;
                          const optionText = question[key] as string;
                          const isSelected = questionResult?.selected.includes(opt);
                          const isCorrectAnswer = questionResult?.correct.includes(opt);

                          let bgClass = 'bg-muted/50';
                          if (isCorrectAnswer && isSelected) {
                            bgClass = 'bg-green-100 border-green-300';
                          } else if (isCorrectAnswer) {
                            bgClass = 'bg-green-100 border-green-300';
                          } else if (isSelected) {
                            bgClass = 'bg-red-100 border-red-300';
                          }

                          return (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 p-2 rounded border ${bgClass}`}
                            >
                              <span className="font-medium w-6">{opt}.</span>
                              <HtmlContent html={optionText} className="flex-1" />
                              {isCorrectAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {isSelected && !isCorrectAnswer && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          );
                        })}

                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-1">Giải thích:</p>
                            <HtmlContent html={question.explanation} className="text-sm text-blue-700" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
