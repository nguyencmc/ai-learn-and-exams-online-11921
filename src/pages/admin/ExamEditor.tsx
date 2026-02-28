import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { StepIndicator } from '@/components/admin/exam/StepIndicator';
import { ExamInfoStep } from '@/components/admin/exam/ExamInfoStep';
import { CreateQuestionsStep } from '@/components/admin/exam/CreateQuestionsStep';
import { ReviewStep } from '@/components/admin/exam/ReviewStep';
import { type Question } from '@/components/admin/exam/QuestionEditor';
import { createAuditLog } from '@/hooks/useAuditLogs';

interface ExamCategory {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: 'Thông tin', description: 'Nhập thông tin đề thi' },
  { id: 2, title: 'Tạo câu hỏi', description: 'Thêm câu hỏi vào đề' },
  { id: 3, title: 'Xem lại', description: 'Kiểm tra và lưu' },
];

const ExamEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { isAdmin, hasPermission, canEditOwn, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
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

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchExam();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('exam_categories').select('id, name');
    setCategories(data || []);
  };

  const fetchExam = async () => {
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
    setThumbnailUrl(exam.thumbnail_url || '');

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

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và slug",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất 1 câu hỏi",
        variant: "destructive",
      });
      setCurrentStep(2);
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
        // Delete existing questions
        await supabase.from('questions').delete().eq('exam_id', examId);
      }

      // Insert questions
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

      // Create audit log
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
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu đề thi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && (!title.trim() || !slug.trim())) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề và slug trước khi tiếp tục",
        variant: "destructive",
      });
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

  const getCategoryName = () => {
    return categories.find(c => c.id === categoryId)?.name;
  };

  // Thumbnail upload handler
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

  // Image upload handler with date-based folder structure
  const handleImageUpload = async (file: File, questionIndex: number, field: string): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Generate unique filename
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
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
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/exams">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-7 h-7 text-primary" />
              {isEditing ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {title || 'Đề thi chưa có tên'}
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
            <ExamInfoStep
              title={title}
              slug={slug}
              description={description}
              categoryId={categoryId}
              difficulty={difficulty}
              durationMinutes={durationMinutes}
              thumbnailUrl={thumbnailUrl}
              categories={categories}
              isEditing={isEditing}
              onTitleChange={setTitle}
              onSlugChange={setSlug}
              onDescriptionChange={setDescription}
              onCategoryChange={setCategoryId}
              onDifficultyChange={setDifficulty}
              onDurationChange={setDurationMinutes}
              onThumbnailUpload={handleThumbnailUpload}
              onThumbnailRemove={() => setThumbnailUrl('')}
            />
          )}

          {currentStep === 2 && (
            <CreateQuestionsStep
              questions={questions}
              onQuestionsChange={setQuestions}
              onImageUpload={handleImageUpload}
              imageBucket="question-images"
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              title={title}
              description={description}
              categoryName={getCategoryName()}
              difficulty={difficulty}
              durationMinutes={durationMinutes}
              thumbnailUrl={thumbnailUrl}
              questions={questions}
              onEditInfo={() => setCurrentStep(1)}
              onEditQuestions={() => setCurrentStep(2)}
              onUpdateQuestion={(index, field, value) => {
                setQuestions(prev => prev.map((q, i) =>
                  i === index ? { ...q, [field]: value } : q
                ));
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
                    Lưu đề thi
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamEditor;
