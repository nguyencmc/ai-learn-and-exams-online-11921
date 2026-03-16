import { ExamInfoStep } from '@/components/admin/exam/ExamInfoStep';
import { CreateQuestionsStep } from '@/components/admin/exam/CreateQuestionsStep';
import type { ExamEditorState, ExamEditorActions } from '../types';

type ExamEditorStepContentProps = Pick<
  ExamEditorState,
  | 'title'
  | 'slug'
  | 'description'
  | 'categoryId'
  | 'difficulty'
  | 'durationMinutes'
  | 'thumbnailUrl'
  | 'categories'
  | 'isEditing'
  | 'questions'
> &
  Pick<
    ExamEditorActions,
    | 'setTitle'
    | 'setSlug'
    | 'setDescription'
    | 'setCategoryId'
    | 'setDifficulty'
    | 'setDurationMinutes'
    | 'setQuestions'
    | 'handleThumbnailUpload'
    | 'handleThumbnailRemove'
    | 'handleImageUpload'
  >;

export function ExamEditorStepContent(props: ExamEditorStepContentProps) {
  const {
    title,
    slug,
    description,
    categoryId,
    difficulty,
    durationMinutes,
    thumbnailUrl,
    categories,
    isEditing,
    questions,
    setTitle,
    setSlug,
    setDescription,
    setCategoryId,
    setDifficulty,
    setDurationMinutes,
    setQuestions,
    handleThumbnailUpload,
    handleThumbnailRemove,
    handleImageUpload,
  } = props;

  return (
    <div className="space-y-8">
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
        onThumbnailRemove={handleThumbnailRemove}
      />

      <CreateQuestionsStep
        questions={questions}
        onQuestionsChange={setQuestions}
        onImageUpload={handleImageUpload}
        imageBucket="question-images"
      />
    </div>
  );
}
