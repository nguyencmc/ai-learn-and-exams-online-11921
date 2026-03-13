import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('CourseTestEditor');
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Save, 
  ClipboardList,
  Settings,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface TestQuestion {
  id?: string;
  question_text: string;
  question_image?: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  explanation?: string;
  question_order: number;
}

interface CourseTest {
  id?: string;
  lesson_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  is_required: boolean;
}

interface CourseTestEditorProps {
  lessonId: string;
  lessonTitle: string;
}

export const CourseTestEditor = ({ lessonId, lessonTitle }: CourseTestEditorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<CourseTest>({
    lesson_id: lessonId,
    title: `Bài kiểm tra: ${lessonTitle}`,
    description: '',
    duration_minutes: 30,
    pass_percentage: 70,
    max_attempts: 3,
    is_required: false,
  });
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  useEffect(() => {
    if (open) {
      fetchTestData();
    }
  }, [open, lessonId]);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      // Fetch test
      const { data: testData } = await supabase
        .from('course_tests')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (testData) {
        setTest(testData);
        
        // Fetch questions
        const { data: questionsData } = await supabase
          .from('course_test_questions')
          .select('*')
          .eq('test_id', testData.id)
          .order('question_order');
        
        setQuestions(questionsData || []);
      } else {
        setTest({
          lesson_id: lessonId,
          title: `Bài kiểm tra: ${lessonTitle}`,
          description: '',
          duration_minutes: 30,
          pass_percentage: 70,
          max_attempts: 3,
          is_required: false,
        });
        setQuestions([]);
      }
    } catch (error) {
      log.error('Error fetching test', error);
    } finally {
      setLoading(false);
    }
  };

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

      // Save or update test
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

      // Delete existing questions and re-insert
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <ClipboardList className="w-3 h-3" />
          Quản lý bài test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Quản lý bài test - {lessonTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Test Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Cài đặt bài test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên bài test</Label>
                    <Input
                      value={test.title}
                      onChange={(e) => setTest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Tên bài test"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thời gian (phút)</Label>
                    <Input
                      type="number"
                      value={test.duration_minutes}
                      onChange={(e) => setTest(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Điểm đạt (%)</Label>
                    <Input
                      type="number"
                      value={test.pass_percentage}
                      onChange={(e) => setTest(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) || 70 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số lần làm tối đa</Label>
                    <Input
                      type="number"
                      value={test.max_attempts}
                      onChange={(e) => setTest(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={test.is_required}
                      onCheckedChange={(checked) => setTest(prev => ({ ...prev, is_required: checked }))}
                    />
                    <Label>Bắt buộc hoàn thành</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={test.description || ''}
                    onChange={(e) => setTest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả về bài test..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Câu hỏi</CardTitle>
                  <CardDescription>{questions.length} câu hỏi</CardDescription>
                </div>
                <Button onClick={addQuestion} size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Thêm câu hỏi
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có câu hỏi nào</p>
                    <Button onClick={addQuestion} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm câu hỏi đầu tiên
                    </Button>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <Card key={index} className="border-border/50">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <Badge variant="outline">Câu {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Nội dung câu hỏi</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                            placeholder="Nhập nội dung câu hỏi..."
                            rows={2}
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map((option) => (
                            <div key={option} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={question.correct_answer.includes(option)}
                                  onChange={(e) => {
                                    let newAnswer = question.correct_answer.split(',').filter(a => a);
                                    if (e.target.checked) {
                                      if (!newAnswer.includes(option)) {
                                        newAnswer.push(option);
                                      }
                                    } else {
                                      newAnswer = newAnswer.filter(a => a !== option);
                                    }
                                    updateQuestion(index, { 
                                      correct_answer: newAnswer.sort().join(',') || 'A' 
                                    });
                                  }}
                                  className="w-4 h-4"
                                />
                                <Label className="text-sm">Đáp án {option}</Label>
                              </div>
                              <Input
                                value={question[`option_${option.toLowerCase()}` as keyof TestQuestion] as string || ''}
                                onChange={(e) => updateQuestion(index, { 
                                  [`option_${option.toLowerCase()}`]: e.target.value 
                                })}
                                placeholder={`Nhập đáp án ${option}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>Giải thích (tùy chọn)</Label>
                          <Textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                            placeholder="Giải thích đáp án đúng..."
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Đóng
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu bài test
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
