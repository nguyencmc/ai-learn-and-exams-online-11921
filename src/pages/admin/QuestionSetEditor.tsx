import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  Plus,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { CreatePracticeQuestionsStep } from '@/components/admin/practice/CreatePracticeQuestionsStep';
import type { PracticeQuestion } from '@/components/admin/practice/PracticeQuestionEditor';
import { logger } from '@/lib/logger';

const log = logger('QuestionSetEditor');

const QuestionSetEditor = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { hasPermission, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  
  // Question Set fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  
  const [categoryId, setCategoryId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Questions
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);

  const canCreate = hasPermission('question_sets.create');
  const canEdit = hasPermission('question_sets.edit');
  const hasAccess = isEditMode ? canEdit : canCreate;

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền thực hiện thao tác này",
        variant: "destructive",
      });
    }
  }, [hasAccess, roleLoading, navigate, toast]);

  useEffect(() => {
    if (hasAccess) {
      fetchCategories();
      if (isEditMode && id) {
        fetchData();
      }
    }
  }, [hasAccess, isEditMode, id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('exam_categories').select('id, name').order('name');
    setCategories(data || []);
  };


  const fetchData = async () => {
    setLoading(true);
    
    // Fetch question set
    const { data: setData, error: setError } = await supabase
      .from('question_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (setError || !setData) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy bộ đề",
        variant: "destructive",
      });
      navigate('/admin/question-sets');
      return;
    }

    setTitle(setData.title);
    setDescription(setData.description || '');
    setLevel(setData.level || 'medium');
    setTags(setData.tags || []);
    setIsPublished(setData.is_published ?? true);
    setCategoryId(setData.category_id || null);

    // Fetch questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('set_id', id)
      .order('question_order', { ascending: true });

    if (!questionsError && questionsData) {
      setQuestions(questionsData.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_image: q.question_image,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        option_e: q.option_e || '',
        option_f: q.option_f || '',
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        tags: q.tags || [],
        question_order: q.question_order || 0,
      })));
    }

    setLoading(false);
  };

  // ── Image upload handler: lưu lên Supabase Storage "question-images" ───────
  const handleImageUpload = async (file: File, _questionIndex: number, _field: string): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${year}/${month}/${day}/${uniqueId}.${ext}`;

    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };
  // ──────────────────────────────────────────────────────────────────────────

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên bộ đề",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let setId = id;

      // Create or update question set
      if (isEditMode) {
        const { error } = await supabase
          .from('question_sets')
          .update({
            title,
            description: description || null,
            level,
            tags,
            is_published: isPublished,
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('question_sets')
          .insert({
            title,
            description: description || null,
            level,
            tags,
            is_published: isPublished,
            
            category_id: categoryId,
            question_count: 0,
            creator_id: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setId = data.id;
      }

      // Handle questions
      const activeQuestions = questions.filter(q => !q.isDeleted);
      const deletedQuestions = questions.filter(q => q.isDeleted && q.id);
      const newQuestions = activeQuestions.filter(q => q.isNew);
      const existingQuestions = activeQuestions.filter(q => !q.isNew && q.id);

      // Delete marked questions
      for (const q of deletedQuestions) {
        await supabase.from('practice_questions').delete().eq('id', q.id!);
      }

      // Update existing questions
      for (const q of existingQuestions) {
        await supabase
          .from('practice_questions')
          .update({
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c || null,
            option_d: q.option_d || null,
            option_e: q.option_e || null,
            option_f: q.option_f || null,
            correct_answer: q.correct_answer,
            explanation: q.explanation || null,
            difficulty: q.difficulty,
            tags: q.tags,
            question_order: q.question_order,
          })
          .eq('id', q.id!);
      }

      // Insert new questions
      if (newQuestions.length > 0) {
        const { error } = await supabase
          .from('practice_questions')
          .insert(
            newQuestions.map(q => ({
              set_id: setId,
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c || null,
              option_d: q.option_d || null,
              option_e: q.option_e || null,
              option_f: q.option_f || null,
              correct_answer: q.correct_answer,
              explanation: q.explanation || null,
              difficulty: q.difficulty,
              tags: q.tags,
              question_order: q.question_order,
              creator_id: user?.id,
            }))
          );

        if (error) throw error;
      }

      // Update question count
      await supabase
        .from('question_sets')
        .update({ question_count: activeQuestions.length })
        .eq('id', setId);

      // Create audit log
      await createAuditLog(
        isEditMode ? 'update' : 'create',
        'question_set',
        setId,
        isEditMode ? { title, level, question_count: activeQuestions.length } : null,
        { title, level, is_published: isPublished, question_count: activeQuestions.length }
      );

      toast({
        title: "Thành công",
        description: isEditMode ? "Đã cập nhật bộ đề" : "Đã tạo bộ đề mới",
      });

      navigate('/admin/question-sets');
    } catch (error) {
      log.error('Save error', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu bộ đề",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/question-sets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                {isEditMode ? 'Chỉnh sửa bộ đề' : 'Tạo bộ đề mới'}
              </h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu bộ đề'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Question Set Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin bộ đề</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên bộ đề *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên bộ đề..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về bộ đề..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select 
                    value={categoryId || 'none'} 
                    onValueChange={(v) => setCategoryId(v === 'none' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không chọn --</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Danh mục giúp phân loại bộ đề (dùng chung với Đề thi)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Độ khó</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="hard">Khó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Thêm tag..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>


                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="published">Công khai</Label>
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Questions Editor */}
          <div className="lg:col-span-2">
            <CreatePracticeQuestionsStep
              questions={questions}
              onQuestionsChange={setQuestions}
              defaultDifficulty={level}
              onImageUpload={handleImageUpload}
              imageBucket="question-images"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionSetEditor;
