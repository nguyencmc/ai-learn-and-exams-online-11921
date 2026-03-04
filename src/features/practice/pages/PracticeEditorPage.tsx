import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { StepIndicator } from '@/components/admin/exam/StepIndicator';
import { PracticeSetInfoStep } from '@/features/practice/components/PracticeSetInfoStep';
import { CreatePracticeQuestionsStep } from '@/components/admin/practice/CreatePracticeQuestionsStep';
import { PracticeReviewStep } from '@/features/practice/components/PracticeReviewStep';
import type { PracticeQuestion } from '@/components/admin/practice/PracticeQuestionEditor';

interface ExamCategory {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: 'Thông tin', description: 'Nhập thông tin bộ đề' },
  { id: 2, title: 'Tạo câu hỏi', description: 'Thêm câu hỏi vào bộ đề' },
  { id: 3, title: 'Xem lại', description: 'Kiểm tra và lưu' },
];

export default function PracticeEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  // Question Set fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<ExamCategory[]>([]);

  // Questions
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
    if (isEditMode && id) {
      fetchData();
    }
  }, [user, isEditMode, id]);

  // ── Image upload: lưu lên Supabase Storage "question-images" ───────────────
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

  const fetchCategories = async () => {
    const { data } = await supabase.from('exam_categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: setData, error: setError } = await supabase
      .from('question_sets')
      .select('*')
      .eq('id', id)
      .eq('creator_id', user?.id)
      .single();

    if (setError || !setData) {
      toast.error('Không tìm thấy bộ đề hoặc bạn không có quyền chỉnh sửa');
      navigate('/practice/my-sets');
      return;
    }

    setTitle(setData.title);
    setSlug(setData.slug || '');
    setDescription(setData.description || '');
    setLevel(setData.level || 'medium');
    setDurationMinutes(setData.duration_minutes || 60);
    setTags(setData.tags || []);
    setIsPublished(setData.is_published ?? false);
    setCategoryId(setData.category_id || '');

    const { data: questionsData } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('set_id', id)
      .order('question_order', { ascending: true });

    if (questionsData) {
      setQuestions(
        questionsData.map(q => ({
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
        }))
      );
    }

    setLoading(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditMode) {
      setSlug(generateSlug(value));
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && (!title.trim() || !slug.trim())) {
      toast.error('Vui lòng nhập tiêu đề và đường dẫn trước khi tiếp tục');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Vui lòng nhập tiêu đề và đường dẫn');
      setCurrentStep(1);
      return;
    }

    if (questions.filter(q => !q.isDeleted).length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
      setCurrentStep(2);
      return;
    }

    setSaving(true);

    try {
      let setId = id;

      if (isEditMode) {
        const { error } = await supabase
          .from('question_sets')
          .update({
            title,
            slug,
            description: description || null,
            level,
            duration_minutes: durationMinutes,
            tags,
            is_published: isPublished,
            category_id: categoryId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('question_sets')
          .insert({
            title,
            slug,
            description: description || null,
            level,
            duration_minutes: durationMinutes,
            tags,
            is_published: isPublished,
            category_id: categoryId || null,
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

      for (const q of deletedQuestions) {
        await supabase.from('practice_questions').delete().eq('id', q.id!);
      }

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

      if (newQuestions.length > 0) {
        const { error } = await supabase.from('practice_questions').insert(
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

      await supabase
        .from('question_sets')
        .update({ question_count: activeQuestions.length })
        .eq('id', setId);

      toast.success(isEditMode ? 'Đã cập nhật bộ đề' : 'Đã tạo bộ đề mới');
      navigate('/practice/my-sets');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Không thể lưu bộ đề: ${error?.message || 'Lỗi không xác định'}`);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = () => {
    return categories.find(c => c.id === categoryId)?.name;
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/practice/my-sets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Target className="w-7 h-7 text-primary" />
              {isEditMode ? 'Chỉnh sửa bộ đề' : 'Tạo bộ đề mới'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {title || 'Bộ đề chưa có tên'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 max-w-3xl mx-auto">
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(step) => {
              if (step < currentStep || (step === 2 && title && slug) || step === currentStep) {
                setCurrentStep(step);
              }
            }}
          />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <PracticeSetInfoStep
              title={title}
              slug={slug}
              description={description}
              categoryId={categoryId}
              difficulty={level}
              durationMinutes={durationMinutes}
              tags={tags}
              isPublished={isPublished}
              categories={categories}
              isEditing={isEditMode}
              onTitleChange={handleTitleChange}
              onSlugChange={setSlug}
              onDescriptionChange={setDescription}
              onCategoryChange={setCategoryId}
              onDifficultyChange={setLevel}
              onDurationChange={setDurationMinutes}
              onTagsChange={setTags}
              onPublishedChange={setIsPublished}
            />
          )}

          {currentStep === 2 && (
            <CreatePracticeQuestionsStep
              questions={questions}
              onQuestionsChange={setQuestions}
              defaultDifficulty={level}
              onImageUpload={handleImageUpload}
              imageBucket="question-images"
            />
          )}

          {currentStep === 3 && (
            <PracticeReviewStep
              title={title}
              description={description}
              categoryName={getCategoryName()}
              difficulty={level}
              durationMinutes={durationMinutes}
              tags={tags}
              isPublished={isPublished}
              questions={questions}
              onEditInfo={() => setCurrentStep(1)}
              onEditQuestions={() => setCurrentStep(2)}
              onUpdateQuestion={(index, field, value) => {
                setQuestions(prev =>
                  prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
                );
              }}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between max-w-3xl mx-auto pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button onClick={handleNext} className="gap-2">
                Tiếp theo
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu bộ đề
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
</div>
  );
}
