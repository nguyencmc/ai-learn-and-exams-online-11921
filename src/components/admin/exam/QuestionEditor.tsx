 import { useState, useCallback } from 'react';
 import { Card, CardContent, CardHeader } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Check } from 'lucide-react';
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
   Plus
 } from 'lucide-react';
 import { SmartEditor } from '@/components/editor';
 
 export interface Question {
   id?: string;
   question_text: string;
   question_image?: string;
   option_a: string;
   option_a_image?: string;
   option_b: string;
   option_b_image?: string;
   option_c: string;
   option_c_image?: string;
   option_d: string;
   option_d_image?: string;
   option_e: string;
   option_e_image?: string;
   option_f: string;
   option_f_image?: string;
   option_g: string;
   option_g_image?: string;
   option_h: string;
   option_h_image?: string;
   correct_answer: string;
   explanation: string;
   question_order: number;
 }
 
 interface QuestionEditorProps {
   question: Question;
   index: number;
   onUpdate: (index: number, field: keyof Question, value: string | number) => void;
   onRemove: (index: number) => void;
   onImageUpload?: (file: File, questionIndex: number, field: string) => Promise<string>;
 }
 
 export const QuestionEditor = ({ 
   question, 
   index, 
   onUpdate, 
   onRemove,
   onImageUpload 
 }: QuestionEditorProps) => {
   const [isExpanded, setIsExpanded] = useState(true);
 
   const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
   
   const getOptionField = (letter: string) => `option_${letter.toLowerCase()}` as keyof Question;
 
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
 
   const handleEditorImageUpload = useCallback(async (file: File): Promise<string> => {
     if (!onImageUpload) throw new Error('Image upload not configured');
     return await onImageUpload(file, index, 'inline_image');
   }, [onImageUpload, index]);
 
   // Strip HTML tags for preview
   const getPreviewText = (html: string) => {
     const tmp = document.createElement('div');
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || '';
   };
 
   return (
     <Card className="border-border/50 overflow-hidden">
       <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
         <CardHeader className="py-3 px-4 bg-muted/30">
           <div className="flex items-center justify-between">
             <CollapsibleTrigger asChild>
               <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                 <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                 <Badge variant="secondary" className="font-mono">
                   Câu {index + 1}
                 </Badge>
                 <span className="text-sm text-muted-foreground truncate max-w-md">
                   {getPreviewText(question.question_text) || 'Chưa nhập câu hỏi...'}
                 </span>
                 {isExpanded ? (
                   <ChevronUp className="w-4 h-4 text-muted-foreground" />
                 ) : (
                   <ChevronDown className="w-4 h-4 text-muted-foreground" />
                 )}
               </button>
             </CollapsibleTrigger>
             
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 mr-2">
                 <span className="text-xs text-muted-foreground mr-1">Đáp án:</span>
                 {correctAnswers.map(answer => (
                   <span 
                     key={answer} 
                     className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-medium"
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
                />
             </div>
 
             {/* Options */}
             <div className="grid gap-3">
               <Label>Đáp án (click vào chữ cái để chọn đáp án đúng)</Label>
               {optionLabels.slice(0, 4).map((letter) => (
                 <OptionInput
                   key={letter}
                   letter={letter}
                   value={question[getOptionField(letter)] as string}
                   isCorrect={isCorrectAnswer(letter)}
                   required={letter === 'A' || letter === 'B'}
                   onChange={(value) => onUpdate(index, getOptionField(letter), value)}
                   onToggleCorrect={() => toggleCorrectAnswer(letter)}
                   onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, `option_${letter.toLowerCase()}_image`) : undefined}
                 />
               ))}
               
               {/* More Options (E-H) */}
               {optionLabels.slice(4).some(letter => question[getOptionField(letter)]) && (
                 optionLabels.slice(4).map((letter) => {
                   if (!question[getOptionField(letter)] && 
                       optionLabels.slice(4).indexOf(letter) > 0 && 
                       !question[getOptionField(optionLabels[optionLabels.indexOf(letter) - 1])]) {
                     return null;
                   }
                   return (
                     <OptionInput
                       key={letter}
                       letter={letter}
                       value={question[getOptionField(letter)] as string}
                       isCorrect={isCorrectAnswer(letter)}
                       required={false}
                       onChange={(value) => onUpdate(index, getOptionField(letter), value)}
                       onToggleCorrect={() => toggleCorrectAnswer(letter)}
                       onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, `option_${letter.toLowerCase()}_image`) : undefined}
                     />
                   );
                 })
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
                   Thêm đáp án E-H
                 </Button>
               )}
             </div>
 
             {/* Explanation */}
             <div className="space-y-2">
               <Label>Giải thích (tùy chọn)</Label>
                <SmartEditor
                  content={question.explanation}
                  onChange={(value) => onUpdate(index, 'explanation', value)}
                  placeholder="Giải thích đáp án đúng..."
                  miniMinHeight="60px"
                  showImageUpload={!!onImageUpload}
                  onImageUpload={onImageUpload ? async (file: File) => onImageUpload(file, index, 'explanation_image') : undefined}
                />
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
 }
 
 const OptionInput = ({
   letter,
   value,
   isCorrect,
   required,
   onChange,
   onToggleCorrect,
   onImageUpload,
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
          />
       </div>
     </div>
   );
 };
