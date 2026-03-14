import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AIExplanation } from '@/components/exam/AIExplanation';
import { CameraPreview } from '@/components/exam/CameraPreview';
import { useExamProctoring } from '@/features/exams/hooks/useExamProctoring';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  RotateCcw,
  Home,
  Flag,
  Lock,
  LogIn,
  HelpCircle,
  User,
  Send,
  Info,
  CheckCircle,
  Circle,
  Shield,
} from 'lucide-react';
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
import { toast } from 'sonner';

interface Question {
  id: string;
  question_text: string;
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

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  question_count: number;
  difficulty: string | null;
}

const ExamTaking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check if this is a practice/community exam
  const isPracticeMode = searchParams.get('type') === 'practice';
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime] = useState(Date.now());

  // Fetch exam details - supports both official exams and question_sets
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', slug, isPracticeMode],
    queryFn: async () => {
      if (isPracticeMode) {
        // Fetch from question_sets table - try slug first, then ID
        const query = supabase
          .from('question_sets')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        let { data, error } = await query;
        
        // If not found by slug, try by ID
        if (!data && !error) {
          const idQuery = await supabase
            .from('question_sets')
            .select('*')
            .eq('id', slug)
            .maybeSingle();
          data = idQuery.data;
          error = idQuery.error;
        }
        
        if (error) throw error;
        if (!data) return null;
        
        return {
          id: data.id,
          title: data.title,
          duration_minutes: data.duration_minutes || 60,
          question_count: data.question_count || 0,
          difficulty: data.level,
        } as Exam;
      } else {
        // Fetch from exams table (official exams)
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        if (error) throw error;
        return data as Exam | null;
      }
    },
  });

  // Fetch questions - supports both sources
  const { data: allQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', exam?.id, isPracticeMode],
    queryFn: async () => {
      if (!exam?.id) return [];
      
      if (isPracticeMode) {
        // Fetch from practice_questions table
        const { data, error } = await supabase
          .from('practice_questions')
          .select('*')
          .eq('set_id', exam.id)
          .order('question_order', { ascending: true });
        
        if (error) throw error;
        
        // Map practice_questions to Question format
        return (data || []).map((q, idx) => ({
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          option_f: q.option_f,
          option_g: null,
          option_h: null,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          question_order: q.question_order ?? idx,
        })) as Question[];
      } else {
        // Fetch from questions table (official exams)
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('question_order', { ascending: true });
        
        if (error) throw error;
        return data as Question[];
      }
    },
    enabled: !!exam?.id,
  });

  // Proctoring hook
  const proctoring = useExamProctoring({
    examId: exam?.id || '',
    userId: user?.id || '',
    enabled: !!user && !!exam?.id && !isSubmitted,
    snapshotInterval: 30000, // 30 seconds
    onViolation: (event) => {
      toast.warning(`Vi phạm: ${event.type === 'tab_switch' ? 'Chuyển tab' : 'Mất focus cửa sổ'}`, {
        description: 'Hành vi này đã được ghi nhận',
      });
    },
  });

  // Limit questions to 5 for non-authenticated users
  const MAX_GUEST_QUESTIONS = 5;
  const isGuest = !user;
  const questions = isGuest && allQuestions 
    ? allQuestions.slice(0, MAX_GUEST_QUESTIONS) 
    : allQuestions;
  const totalQuestionsInExam = allQuestions?.length || 0;
  const isLimitedAccess = isGuest && totalQuestionsInExam > MAX_GUEST_QUESTIONS;

  // Initialize timer
  useEffect(() => {
    if (exam?.duration_minutes && !isSubmitted) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [exam?.duration_minutes, isSubmitted]);

  // Start proctoring session
  useEffect(() => {
    if (exam?.id && user?.id && !isSubmitted) {
      proctoring.startSession();
    }
  }, [exam?.id, user?.id, isSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  // Helper function to check if answer is correct
  const isAnswerCorrect = (question: Question, userAnswers: string[] | undefined) => {
    if (!userAnswers || userAnswers.length === 0) return false;
    const correctAnswers = question.correct_answer?.split(',').map(a => a.trim()).sort() || [];
    const sortedUserAnswers = [...userAnswers].sort();
    return JSON.stringify(correctAnswers) === JSON.stringify(sortedUserAnswers);
  };

  // Auto submit when time runs out
  useEffect(() => {
    if (isSubmitted && timeLeft === 0 && exam && questions && questions.length > 0) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const correctCount = questions.filter(
        (q) => isAnswerCorrect(q, answers[q.id])
      ).length;
      const score = Math.round((correctCount / questions.length) * 100);

      if (isPracticeMode && user?.id) {
        // Save to practice tables
        (async () => {
          // Create exam session
          const { data: session } = await supabase
            .from('practice_exam_sessions')
            .insert({
              user_id: user.id,
              set_id: exam.id,
              duration_sec: timeSpent,
              status: 'submitted',
              ended_at: new Date().toISOString(),
              score,
              correct_count: correctCount,
              total_questions: questions.length,
            })
            .select()
            .single();

          if (session) {
            // Create attempts for each question
            const attempts = questions.map((q) => ({
              user_id: user.id,
              question_id: q.id,
              mode: 'exam',
              exam_session_id: session.id,
              selected: (answers[q.id] || []).join(','),
              is_correct: isAnswerCorrect(q, answers[q.id]),
              time_spent_sec: 0,
            }));
            await supabase.from('practice_attempts').insert(attempts);
          }
        })();
      } else {
        // Save to official exam tables
        supabase.from('exam_attempts').insert({
          exam_id: exam.id,
          user_id: user?.id || null,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          time_spent_seconds: timeSpent,
          answers: answers,
        });
      }
      
      proctoring.endSession();
    }
  }, [isSubmitted, timeLeft, exam, questions, answers, startTime, user?.id, isPracticeMode]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      const question = questions?.find(q => q.id === questionId);
      const correctAnswers = question?.correct_answer?.split(',').map(a => a.trim()) || [];
      const isMultiAnswer = correctAnswers.length > 1;
      
      if (isMultiAnswer) {
        if (currentAnswers.includes(answer)) {
          return { ...prev, [questionId]: currentAnswers.filter(a => a !== answer) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, answer].sort() };
        }
      } else {
        return { ...prev, [questionId]: [answer] };
      }
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!questions || !exam) return;
    
    setIsSubmitted(true);
    setShowSubmitDialog(false);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const correctCount = questions.filter(
      (q) => isAnswerCorrect(q, answers[q.id])
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);

    if (isPracticeMode && user?.id) {
      // Save to practice tables
      const { data: session } = await supabase
        .from('practice_exam_sessions')
        .insert({
          user_id: user.id,
          set_id: exam.id,
          duration_sec: timeSpent,
          status: 'submitted',
          ended_at: new Date().toISOString(),
          score,
          correct_count: correctCount,
          total_questions: questions.length,
        })
        .select()
        .single();

      if (session) {
        // Create attempts for each question
        const attempts = questions.map((q) => ({
          user_id: user.id,
          question_id: q.id,
          mode: 'exam',
          exam_session_id: session.id,
          selected: (answers[q.id] || []).join(','),
          is_correct: isAnswerCorrect(q, answers[q.id]),
          time_spent_sec: 0,
        }));
        await supabase.from('practice_attempts').insert(attempts);
      }
    } else {
      // Save to official exam tables
      await supabase.from('exam_attempts').insert({
        exam_id: exam.id,
        user_id: user?.id || null,
        score,
        total_questions: questions.length,
        correct_answers: correctCount,
        time_spent_seconds: timeSpent,
        answers: answers,
      });
    }

    await proctoring.endSession();
  }, [questions, exam, answers, startTime, user?.id, proctoring, isPracticeMode]);

  const currentQuestion = questions?.[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter(id => answers[id]?.length > 0).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = questions ? questions.length - answeredCount : 0;
  const progress = questions ? (answeredCount / questions.length) * 100 : 0;

  // Calculate results
  const correctCount = questions?.filter(
    (q) => isAnswerCorrect(q, answers[q.id])
  ).length || 0;
  const scorePercent = questions ? Math.round((correctCount / questions.length) * 100) : 0;

  const getQuestionStatus = (questionId: string, index: number) => {
    const isAnswered = answers[questionId]?.length > 0;
    const isCurrent = index === currentQuestionIndex;
    const isFlagged = flaggedQuestions.has(questionId);
    return { isAnswered, isCurrent, isFlagged };
  };

  // Loading state
  if (examLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!exam || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy đề thi</h1>
          <Link to="/exams">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Results screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30">
        {/* Results Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                scorePercent >= 70 ? 'bg-green-500/20' : scorePercent >= 50 ? 'bg-yellow-500/20' : 'bg-destructive/20'
              }`}>
                <Trophy className={`w-8 h-8 ${
                  scorePercent >= 70 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-destructive'
                }`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Kết quả bài thi</h1>
                <p className="text-muted-foreground">{exam.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">{scorePercent}%</div>
              <div className="text-sm text-muted-foreground">Điểm số</div>
            </div>
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">{correctCount}</div>
              <div className="text-sm text-muted-foreground">Câu đúng</div>
            </div>
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-destructive mb-2">{questions.length - correctCount}</div>
              <div className="text-sm text-muted-foreground">Câu sai</div>
            </div>
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-muted-foreground mb-2">{proctoring.violationCount}</div>
              <div className="text-sm text-muted-foreground">Vi phạm</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate('/exams')}>
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Làm lại
            </Button>
          </div>

          {/* Review Answers */}
          <h2 className="text-xl font-bold text-foreground mb-4">Xem lại đáp án</h2>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswers = answers[question.id] || [];
              const isCorrect = isAnswerCorrect(question, userAnswers);
              const correctAnswers = question.correct_answer?.split(',').map(a => a.trim()) || [];
              
              return (
                <div key={question.id} className="bg-card border rounded-xl overflow-hidden">
                  <div className={`px-4 py-3 flex items-center gap-3 ${
                    isCorrect ? 'bg-green-500/10' : 'bg-destructive/10'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-medium">Câu {index + 1}</span>
                  </div>
                  <div className="p-4">
                    <div className="font-medium mb-4 prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question_text) }} />
                    <div className="grid gap-2">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((option) => {
                        const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                        const optionText = question[optionKey];
                        if (!optionText) return null;
                        
                        const isCorrectOption = correctAnswers.includes(option);
                        const isUserSelected = userAnswers.includes(option);
                        
                        return (
                          <div
                            key={option}
                            className={`p-3 rounded-lg border-2 flex items-start gap-2 ${
                              isCorrectOption
                                ? 'border-green-500 bg-green-500/10'
                                : isUserSelected
                                ? 'border-destructive bg-destructive/10'
                                : 'border-border'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm flex-shrink-0 ${
                              isCorrectOption
                                ? 'bg-green-500 text-white'
                                : isUserSelected
                                ? 'bg-destructive text-white'
                                : 'bg-muted'
                            }`}>
                              {option}
                            </span>
                            <span className="prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(optionText as string) }} />
                          </div>
                        );
                      })}
                    </div>
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Giải thích:</p>
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.explanation) }} />
                      </div>
                    )}
                    <AIExplanation question={question} userAnswer={userAnswers.join(', ')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main exam taking screen
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Top Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-foreground hidden sm:block truncate max-w-[200px] lg:max-w-none">
                {exam.title}
              </h1>
            </div>

            {/* Center: Question Counter */}
            <div className="text-sm text-muted-foreground">
              Câu <span className="font-semibold text-foreground">{currentQuestionIndex + 1}</span> / {questions.length}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Trợ giúp</span>
              </Button>
              
              {/* User Info with Camera Preview */}
              <div className="flex items-center gap-2">
                <CameraPreview
                  cameraEnabled={proctoring.cameraEnabled}
                  cameraStream={proctoring.cameraStream}
                  violationCount={proctoring.violationCount}
                  isProcessing={proctoring.isProcessing}
                  onToggleCamera={proctoring.cameraEnabled ? proctoring.stopCamera : proctoring.startCamera}
                  compact
                />
                {user && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
          {/* Left Sidebar - Question Navigation */}
          <aside className="hidden lg:block">
            <div className="bg-card border rounded-xl p-4 sticky top-24">
              <h3 className="font-semibold text-foreground mb-2">Điều hướng câu hỏi</h3>
              <p className="text-xs text-muted-foreground mb-4">Nhấn vào câu để chuyển</p>
              
              {/* Legend */}
              <div className="flex flex-col gap-1 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-muted-foreground">Đã trả lời ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-3 h-3 text-orange-500" />
                  <span className="text-muted-foreground">Đánh dấu ({flaggedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Chưa làm ({unansweredCount})</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const { isAnswered, isCurrent, isFlagged } = getQuestionStatus(q.id, index);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                        ${isCurrent
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                          : isFlagged
                          ? 'bg-orange-500 text-white'
                          : isAnswered
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                        }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Question Area */}
          <main className="min-w-0">
            {/* Question Card */}
            <div className="bg-card border rounded-xl overflow-hidden">
              {/* Question Header */}
              <div className="px-6 py-4 border-b flex items-center gap-3">
                {exam.difficulty && (
                  <Badge variant="outline" className="uppercase text-xs">
                    {exam.difficulty}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {(() => {
                    const correctAnswers = currentQuestion?.correct_answer?.split(',').map(a => a.trim()) || [];
                    return correctAnswers.length > 1 ? 'Nhiều đáp án' : 'Một đáp án';
                  })()}
                </Badge>
              </div>

              {/* Question Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Câu {currentQuestionIndex + 1}</h2>
                <p className="text-muted-foreground mb-6">Chọn đáp án đúng nhất từ các lựa chọn bên dưới.</p>

                {/* Question Text */}
                <div className="bg-muted/50 rounded-xl p-6 mb-6">
                  <div className="text-lg prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion?.question_text ?? '') }} />
                </div>

                {/* Answer Options */}
                {currentQuestion && (
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                      const optionText = currentQuestion[optionKey];
                      if (!optionText) return null;
                      
                      const userAnswers = answers[currentQuestion.id] || [];
                      const isSelected = userAnswers.includes(option);
                      
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {option}
                          </span>
                          <span className="flex-1 prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md" dangerouslySetInnerHTML={{ __html: sanitizeHtml(optionText as string) }} />
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Câu trước
                </Button>

                <Button
                  variant={currentQuestion && flaggedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                  onClick={() => currentQuestion && toggleFlag(currentQuestion.id)}
                  className={currentQuestion && flaggedQuestions.has(currentQuestion.id) ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {currentQuestion && flaggedQuestions.has(currentQuestion.id) ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                </Button>

                <Button
                  onClick={() => {
                    if (currentQuestionIndex === questions.length - 1) {
                      setShowSubmitDialog(true);
                    } else {
                      setCurrentQuestionIndex((prev) => prev + 1);
                    }
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Guest Access Banner */}
            {isLimitedAccess && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Bạn đang làm bản dùng thử</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Đăng nhập để làm toàn bộ {totalQuestionsInExam} câu hỏi của đề thi này.
                    </p>
                    <Link to="/auth">
                      <Button size="sm">
                        <LogIn className="w-4 h-4 mr-2" />
                        Đăng nhập ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar - Timer & Progress */}
          <aside className="hidden lg:block">
            <div className="space-y-4 sticky top-24">
              {/* Timer Card */}
              <div className="bg-card border rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Thời gian còn lại</p>
                <div className={`text-4xl font-mono font-bold text-center py-4 ${
                  timeLeft <= 60 ? 'text-destructive' : timeLeft <= 300 ? 'text-orange-500' : 'text-foreground'
                }`}>
                  {formatTime(timeLeft)}
                </div>
                <Progress value={(timeLeft / (exam.duration_minutes * 60)) * 100} className="h-2" />
              </div>

              {/* Progress Card */}
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tiến độ</p>
                  <span className="text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {answeredCount} / {questions.length} câu đã trả lời
                </p>
                {flaggedCount > 0 && (
                  <p className="text-sm text-orange-500 mt-1">
                    {flaggedCount} câu đánh dấu xem lại
                  </p>
                )}
              </div>

              {/* Camera Card */}
              <CameraPreview
                cameraEnabled={proctoring.cameraEnabled}
                cameraStream={proctoring.cameraStream}
                violationCount={proctoring.violationCount}
                isProcessing={proctoring.isProcessing}
                onToggleCamera={proctoring.cameraEnabled ? proctoring.stopCamera : proctoring.startCamera}
              />

              {/* Info Card */}
              <div className="bg-muted/50 border rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Bạn có thể quay lại bất kỳ câu hỏi nào bằng cách sử dụng bảng điều hướng bên trái. Đáp án được tự động lưu.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={() => setShowSubmitDialog(true)} 
                className="w-full h-12 text-base"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                Nộp bài
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Bằng việc nộp bài, bạn xác nhận đã hoàn thành và sẵn sàng kết thúc bài thi.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            timeLeft <= 60 ? 'bg-destructive/20 text-destructive' : 'bg-muted'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
          
          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{answeredCount}/{questions.length}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Submit */}
          <Button onClick={() => setShowSubmitDialog(true)}>
            Nộp bài
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nộp bài?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Bạn đã trả lời {answeredCount}/{questions.length} câu hỏi.</p>
                {unansweredCount > 0 && (
                  <p className="mt-2 text-orange-500 font-medium">
                    ⚠️ Còn {unansweredCount} câu chưa trả lời!
                  </p>
                )}
                {flaggedCount > 0 && (
                  <p className="mt-1 text-muted-foreground">
                    📌 {flaggedCount} câu được đánh dấu xem lại.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Nộp bài ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamTaking;
