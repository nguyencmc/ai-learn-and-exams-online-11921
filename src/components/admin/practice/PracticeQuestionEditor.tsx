 import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
 import { 
   Trash2, 
   GripVertical, 
   ChevronDown, 
   ChevronUp,
   Plus,
   X
 } from 'lucide-react';
 import { SmartEditor } from '@/components/editor';
import { useToast } from '@/hooks/useToast';
import { stripHtml } from '@/lib/sanitize';

export interface PracticeQuestion {
  id?: string;
  question_text: string;
  question_image?: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string;
  option_f?: string;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  tags: string[];
  question_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface PracticeQuestionEditorProps {
  question: PracticeQuestion;
  index: number;
  onUpdate: (index: number, field: keyof PracticeQuestion, value: PracticeQuestion[keyof PracticeQuestion]) => void;
  onRemove: (index: number) => void;
  onImageUpload?: (file: File, questionIndex: number, field: string) => Promise<string>;
  imageBucket?: string;
}

export const PracticeQuestionEditor = ({ 
  question, 
  index, 
  onUpdate, 
  onRemove,
  onImageUpload,
  imageBucket,
}: PracticeQuestionEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [_uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadField, setCurrentUploadField] = useState<string>('');
  const { toast } = useToast();

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const getOptionField = (letter: string) => `option_${letter.toLowerCase()}` as keyof PracticeQuestion;

  // Parse correct answers (supports multiple)
  const correctAnswers = question.correct_answer.split(',').map(a => a.trim()).filter(Boolean);

  const isCorrectAnswer = (letter: string) => correctAnswers.includes(letter);

  // Toggle correct answer (supports multiple)
  const toggleCorrectAnswer = (letter: string) => {
    const letterIndex = correctAnswers.indexOf(letter);
    let newAnswers: string[];
    
    if (letterIndex === -1) {
      newAnswers = [...correctAnswers, letter].sort();
    } else {
      if (correctAnswers.length > 1) {
        newAnswers = correctAnswers.filter(a => a !== letter);
      } else {
        return;
      }
    }
    
    onUpdate(index, 'correct_answer', newAnswers.join(','));
  };

  const _handleImageSelect = (field: string) => {
    setCurrentUploadField(field);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'File ảnh không được vượt quá 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingField(currentUploadField);
    
    try {
      const url = await onImageUpload(file, index, currentUploadField);
      onUpdate(index, currentUploadField as keyof PracticeQuestion, url);
      toast({
        title: 'Thành công',
        description: 'Đã tải ảnh lên',
      });
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải ảnh lên',
        variant: 'destructive',
      });
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (field: string) => {
    onUpdate(index, field as keyof PracticeQuestion, '');
  };

   const handleEditorImageUpload = useCallback(async (file: File): Promise<string> => {
     if (!onImageUpload) throw new Error('Image upload not configured');
     return await onImageUpload(file, index, 'inline_image');
   }, [onImageUpload, index]);
 
   const getPreviewText = (html: string) => {
     return stripHtml(html);
   };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy': return { label: 'Dễ', variant: 'secondary' as const };
      case 'medium': return { label: 'TB', variant: 'default' as const };
      case 'hard': return { label: 'Khó', variant: 'destructive' as const };
      default: return { label: diff, variant: 'outline' as const };
    }
  };

  const diffInfo = getDifficultyBadge(question.difficulty);

  return (
    <Card className="border-border/50 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="py-3 px-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
                <Badge variant="secondary" className="font-mono flex-shrink-0">
                  Câu {index + 1}
                </Badge>
                <Badge variant={diffInfo.variant} className="flex-shrink-0">
                  {diffInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground truncate">
                   {getPreviewText(question.question_text) || 'Chưa nhập câu hỏi...'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 mr-2">
                <span className="text-xs text-muted-foreground mr-1">Đáp án:</span>
                {correctAnswers.map(answer => (
                  <span 
                    key={answer} 
                    className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium"
                  >
                    {answer}
                  </span>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-4 space-y-4">
             {/* Question Text */}
             <div className="space-y-2">
               <Label>Nội dung câu hỏi *</Label>
                <SmartEditor
                  content={question.question_text}
                  onChange={(value) => onUpdate(index, 'question_text', value)}
                  placeholder="Nhập câu hỏi..."
                  miniMinHeight="80px"
                  showImageUpload={!!onImageUpload}
                  onImageUpload={onImageUpload ? handleEditorImageUpload : undefined}
                  imageBucket={imageBucket}
                />
              {question.question_image && (
                <div className="relative inline-block">
                  <img 
                    src={question.question_image} 
                    alt="Question" 
                    className="max-h-32 rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage('question_image')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid gap-3">
              <Label>Đáp án (click vào chữ cái để chọn đáp án đúng)</Label>
              {optionLabels.slice(0, 4).map((letter) => (
                <OptionInput
                  key={letter}
                  letter={letter}
                  value={(question[getOptionField(letter)] as string) || ''}
                  isCorrect={isCorrectAnswer(letter)}
                  required={letter === 'A' || letter === 'B'}
                  onChange={(value) => onUpdate(index, getOptionField(letter), value)}
                  onToggleCorrect={() => toggleCorrectAnswer(letter)}
                  onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, `option_${letter.toLowerCase()}_image`) : undefined}
                  imageBucket={imageBucket}
                />
              ))}
              
              {/* More Options (E-F) */}
              {(question.option_e || question.option_f) && (
                optionLabels.slice(4).map((letter) => (
                  <OptionInput
                    key={letter}
                    letter={letter}
                    value={(question[getOptionField(letter)] as string) || ''}
                    isCorrect={isCorrectAnswer(letter)}
                    required={false}
                    onChange={(value) => onUpdate(index, getOptionField(letter), value)}
                    onToggleCorrect={() => toggleCorrectAnswer(letter)}
                    onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, `option_${letter.toLowerCase()}_image`) : undefined}
                    imageBucket={imageBucket}
                  />
                ))
              )}
              
              {/* Add More Options Button */}
              {!question.option_e && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => onUpdate(index, 'option_e', ' ')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Thêm đáp án E-F
                </Button>
              )}
            </div>

            {/* Difficulty & Explanation Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Độ khó</Label>
                <Select 
                  value={question.difficulty} 
                  onValueChange={(v) => onUpdate(index, 'difficulty', v)}
                >
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
                <Label>Giải thích (tùy chọn)</Label>
                 <SmartEditor
                   content={question.explanation}
                   onChange={(value) => onUpdate(index, 'explanation', value)}
                   placeholder="Giải thích đáp án đúng..."
                   miniMinHeight="60px"
                   showImageUpload={!!onImageUpload}
                   onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, 'explanation_image') : undefined}
                   imageBucket={imageBucket}
                 />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

 // Option Input Component
 interface OptionInputProps {
   letter: string;
   value: string;
   isCorrect: boolean;
   required: boolean;
   onChange: (value: string) => void;
   onToggleCorrect: () => void;
   onImageUpload?: (file: File) => Promise<string>;
   imageBucket?: string;
 }
 
 const OptionInput = ({
   letter,
   value,
   isCorrect,
   required,
   onChange,
   onToggleCorrect,
   onImageUpload,
   imageBucket,
 }: OptionInputProps) => {
   return (
     <div className="flex items-start gap-2">
       <button
         type="button"
         onClick={onToggleCorrect}
         className={`w-7 h-7 mt-1 rounded-full flex items-center justify-center font-semibold text-sm transition-all flex-shrink-0 ${
           isCorrect
             ? 'bg-green-600 text-white shadow-md'
             : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border'
         }`}
         title={isCorrect ? 'Click để bỏ chọn đáp án đúng' : 'Click để chọn làm đáp án đúng'}
       >
         {isCorrect ? <Check className="w-4 h-4" /> : letter}
       </button>
       <div className="flex-1">
          <SmartEditor
            content={value}
            onChange={onChange}
            placeholder={`Đáp án ${letter}${required ? ' *' : ''}`}
            className={isCorrect ? "border-green-600" : ""}
            miniMinHeight="40px"
            showImageUpload={!!onImageUpload}
            onImageUpload={onImageUpload}
            imageBucket={imageBucket}
          />
       </div>
     </div>
   );
 };
