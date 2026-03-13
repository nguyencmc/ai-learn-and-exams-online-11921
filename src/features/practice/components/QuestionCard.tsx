import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Loader2 } from 'lucide-react';
import { ChoiceItem } from './ChoiceItem';
import { useAuth } from '@/contexts/AuthContext';
import { createFlashcardFromQuestion } from '@/features/flashcards/api';
import { toast } from 'sonner';
import type { PracticeQuestion } from '../types';
import { isMultiSelectQuestion } from '../types';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { logger } from '@/lib/logger';

const log = logger('QuestionCard');

interface QuestionCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  showResult: boolean;
  isCorrect: boolean | null;
  onSelectAnswer: (choiceId: string) => void;
}

interface Choice {
  id: string;
  text: string;
}

// Helper to convert question options to choices array
function getChoicesFromQuestion(question: PracticeQuestion): Choice[] {
  const choices: Choice[] = [];
  
  if (question.option_a) choices.push({ id: 'A', text: question.option_a });
  if (question.option_b) choices.push({ id: 'B', text: question.option_b });
  if (question.option_c) choices.push({ id: 'C', text: question.option_c });
  if (question.option_d) choices.push({ id: 'D', text: question.option_d });
  if (question.option_e) choices.push({ id: 'E', text: question.option_e });
  if (question.option_f) choices.push({ id: 'F', text: question.option_f });
  
  return choices;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showResult,
  isCorrect,
  onSelectAnswer,
}: QuestionCardProps) {
  const { user } = useAuth();
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [flashcardCreated, setFlashcardCreated] = useState(false);

  const getDifficultyBadge = (difficulty: string | null) => {
    if (!difficulty) return { label: 'Trung bình', variant: 'default' as const };
    if (difficulty === 'easy') return { label: 'Dễ', variant: 'secondary' as const };
    if (difficulty === 'hard') return { label: 'Khó', variant: 'destructive' as const };
    return { label: 'Trung bình', variant: 'default' as const };
  };

  const difficultyInfo = getDifficultyBadge(question.difficulty);
  const choices = getChoicesFromQuestion(question);
  const isMultiSelect = isMultiSelectQuestion(question.correct_answer);
  
  // Parse selected answers for multi-select display
  const selectedAnswers = selectedAnswer?.split(',').map(s => s.trim().toUpperCase()) || [];

  const handleCreateFlashcard = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tạo flashcard');
      return;
    }

    setIsCreatingFlashcard(true);
    try {
      // Find correct answer text
      const correctChoice = choices.find(c => c.id === question.correct_answer);
      const correctAnswerText = correctChoice ? correctChoice.text : question.correct_answer;

      await createFlashcardFromQuestion(
        user.id,
        question.question_text,
        correctAnswerText,
        question.explanation || null,
        question.id
      );
      
      setFlashcardCreated(true);
      toast.success('Đã thêm vào Mistakes (Flashcards)');
    } catch (error) {
      log.error('Failed to create flashcard', error);
      toast.error('Không thể tạo flashcard');
    } finally {
      setIsCreatingFlashcard(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Câu {questionNumber}/{totalQuestions}
            </span>
            <Badge variant={difficultyInfo.variant}>{difficultyInfo.label}</Badge>
          </div>
          {question.tags && question.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {question.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Multi-select indicator */}
        {isMultiSelect && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              📝 Câu hỏi nhiều đáp án - Chọn tất cả đáp án đúng
            </span>
          </div>
        )}

        {/* Question image */}
        {question.question_image && (
          <div className="flex justify-center">
            <img 
              src={question.question_image} 
              alt="Question" 
              className="max-w-full max-h-64 rounded-lg object-contain"
            />
          </div>
        )}

        {/* Question text */}
        <HtmlContent html={question.question_text} className="text-lg font-medium leading-relaxed" />

        {/* Choices */}
        <div className="space-y-3">
          {choices.map((choice, index) => (
            <ChoiceItem
              key={choice.id}
              id={choice.id}
              text={choice.text}
              label={CHOICE_LABELS[index]}
              isSelected={selectedAnswers.includes(choice.id.toUpperCase())}
              isCorrect={isCorrect}
              showResult={showResult}
              correctAnswer={question.correct_answer}
              disabled={showResult}
              isMultiSelect={isMultiSelect}
              onSelect={onSelectAnswer}
            />
          ))}
        </div>

        {/* Flashcard button for wrong answers (no explanation) */}
        {showResult && !isCorrect && (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateFlashcard}
              disabled={isCreatingFlashcard || flashcardCreated}
              className="gap-1.5"
            >
              {isCreatingFlashcard ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              {flashcardCreated ? 'Đã thêm vào Flashcards' : 'Tạo flashcard từ câu sai'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
