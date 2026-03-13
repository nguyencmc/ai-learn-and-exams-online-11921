import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const log = logger('CourseQA');
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock,
  User,
  GraduationCap,
  Loader2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CourseQAProps {
  courseId: string;
  lessonId: string;
  instructorId?: string | null;
}

interface Question {
  id: string;
  title: string;
  content: string;
  user_id: string;
  is_answered: boolean;
  created_at: string;
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  answers_count: number;
}

interface Answer {
  id: string;
  content: string;
  user_id: string;
  is_instructor_answer: boolean;
  is_accepted: boolean;
  created_at: string;
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const CourseQA = ({ courseId, lessonId, instructorId }: CourseQAProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchQuestions();
  }, [courseId, lessonId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_questions')
        .select('*')
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles and answer counts
      const questionsWithProfiles = await Promise.all(
        (data || []).map(async (q) => {
          const [profileResult, answersResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', q.user_id)
              .single(),
            supabase
              .from('course_answers')
              .select('id', { count: 'exact' })
              .eq('question_id', q.id)
          ]);

          return {
            ...q,
            user_profile: profileResult.data,
            answers_count: answersResult.count || 0
          };
        })
      );

      setQuestions(questionsWithProfiles);
    } catch (error) {
      log.error('Error fetching questions', error);
      toast.error('Không thể tải câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    try {
      setLoadingAnswers(prev => ({ ...prev, [questionId]: true }));
      
      const { data, error } = await supabase
        .from('course_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('is_accepted', { ascending: false })
        .order('is_instructor_answer', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles for answers
      const answersWithProfiles = await Promise.all(
        (data || []).map(async (a) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', a.user_id)
            .single();

          return {
            ...a,
            user_profile: profile
          };
        })
      );

      setAnswers(prev => ({ ...prev, [questionId]: answersWithProfiles }));
    } catch (error) {
      log.error('Error fetching answers', error);
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmitQuestion = async () => {
    if (!user || !newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung câu hỏi');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('course_questions')
        .insert({
          course_id: courseId,
          lesson_id: lessonId,
          user_id: user.id,
          title: newQuestion.title.trim(),
          content: newQuestion.content.trim()
        });

      if (error) throw error;

      toast.success('Đã đăng câu hỏi thành công!');
      setNewQuestion({ title: '', content: '' });
      setShowAskForm(false);
      fetchQuestions();
    } catch (error) {
      log.error('Error submitting question', error);
      toast.error('Không thể đăng câu hỏi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const content = newAnswer[questionId]?.trim();
    if (!user || !content) {
      toast.error('Vui lòng nhập nội dung câu trả lời');
      return;
    }

    try {
      setSubmittingAnswer(prev => ({ ...prev, [questionId]: true }));
      
      const isInstructor = user.id === instructorId;
      
      const { error } = await supabase
        .from('course_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content: content,
          is_instructor_answer: isInstructor
        });

      if (error) throw error;

      // If instructor answers, mark question as answered
      if (isInstructor) {
        await supabase
          .from('course_questions')
          .update({ is_answered: true })
          .eq('id', questionId);
      }

      toast.success('Đã đăng câu trả lời!');
      setNewAnswer(prev => ({ ...prev, [questionId]: '' }));
      fetchAnswers(questionId);
      fetchQuestions();
    } catch (error) {
      log.error('Error submitting answer', error);
      toast.error('Không thể đăng câu trả lời');
    } finally {
      setSubmittingAnswer(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleQuestion = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
      if (!answers[questionId]) {
        fetchAnswers(questionId);
      }
    }
  };

  const handleAcceptAnswer = async (answerId: string, questionId: string) => {
    if (user?.id !== instructorId) return;

    try {
      // Reset all answers for this question
      await supabase
        .from('course_answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId);

      // Accept this answer
      await supabase
        .from('course_answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      // Mark question as answered
      await supabase
        .from('course_questions')
        .update({ is_answered: true })
        .eq('id', questionId);

      toast.success('Đã chấp nhận câu trả lời');
      fetchAnswers(questionId);
      fetchQuestions();
    } catch (error) {
      log.error('Error accepting answer', error);
      toast.error('Không thể chấp nhận câu trả lời');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Hỏi đáp ({questions.length})</h3>
        </div>
        {user && (
          <Button
            size="sm"
            onClick={() => setShowAskForm(!showAskForm)}
            variant={showAskForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-1" />
            Đặt câu hỏi
          </Button>
        )}
      </div>

      {/* Ask Question Form */}
      {showAskForm && user && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Đặt câu hỏi mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Tiêu đề câu hỏi..."
              value={newQuestion.title}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Mô tả chi tiết câu hỏi của bạn..."
              value={newQuestion.content}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAskForm(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitQuestion} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Đăng câu hỏi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có câu hỏi nào cho bài học này</p>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Hãy là người đầu tiên đặt câu hỏi!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleQuestion(question.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={question.user_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {question.user_profile?.full_name || 'Học viên'}
                      </span>
                      {question.user_id === instructorId && (
                        <Badge variant="secondary" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Giảng viên
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(question.created_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </span>
                    </div>
                    <h4 className="font-medium mt-1">{question.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {question.is_answered ? (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Đã trả lời
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Chờ trả lời
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {question.answers_count} câu trả lời
                      </span>
                    </div>
                  </div>
                  {expandedQuestion === question.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Answers Section */}
              {expandedQuestion === question.id && (
                <div className="border-t bg-muted/20">
                  {loadingAnswers[question.id] ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Full question content */}
                      <div className="bg-background rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{question.content}</p>
                      </div>

                      <Separator />

                      {/* Answers */}
                      {answers[question.id]?.length > 0 ? (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">
                            Câu trả lời ({answers[question.id].length})
                          </h5>
                          {answers[question.id].map((answer) => (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg border ${
                                answer.is_accepted 
                                  ? 'border-green-500 bg-green-500/5' 
                                  : 'bg-background'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={answer.user_profile?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    <User className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                      {answer.user_profile?.full_name || 'Người dùng'}
                                    </span>
                                    {answer.is_instructor_answer && (
                                      <Badge variant="secondary" className="text-xs">
                                        <GraduationCap className="h-3 w-3 mr-1" />
                                        Giảng viên
                                      </Badge>
                                    )}
                                    {answer.is_accepted && (
                                      <Badge variant="default" className="bg-green-500 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Chấp nhận
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(answer.created_at), { 
                                        addSuffix: true, 
                                        locale: vi 
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1 whitespace-pre-wrap">
                                    {answer.content}
                                  </p>
                                  {user?.id === instructorId && !answer.is_accepted && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcceptAnswer(answer.id, question.id);
                                      }}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Chấp nhận câu trả lời
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Chưa có câu trả lời
                        </p>
                      )}

                      {/* Answer Form */}
                      {user && (
                        <div className="pt-2">
                          <Separator className="mb-3" />
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Viết câu trả lời của bạn..."
                              value={newAnswer[question.id] || ''}
                              onChange={(e) => setNewAnswer(prev => ({ 
                                ...prev, 
                                [question.id]: e.target.value 
                              }))}
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitAnswer(question.id);
                              }}
                              disabled={submittingAnswer[question.id] || !newAnswer[question.id]?.trim()}
                            >
                              {submittingAnswer[question.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Login prompt */}
      {!user && (
        <Card className="bg-muted/50">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập để đặt câu hỏi hoặc trả lời
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
