import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { TestQuestion } from './types';

interface QuestionCardProps {
  question: TestQuestion;
  index: number;
  onUpdate: (index: number, data: Partial<TestQuestion>) => void;
  onRemove: (index: number) => void;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

export const QuestionCard = ({ question, index, onUpdate, onRemove }: QuestionCardProps) => {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Badge variant="outline">Câu {index + 1}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Nội dung câu hỏi</Label>
          <Textarea
            value={question.question_text}
            onChange={(e) => onUpdate(index, { question_text: e.target.value })}
            placeholder="Nhập nội dung câu hỏi..."
            rows={2}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {OPTION_KEYS.map((option) => (
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
                    onUpdate(index, {
                      correct_answer: newAnswer.sort().join(',') || 'A'
                    });
                  }}
                  className="w-4 h-4"
                />
                <Label className="text-sm">Đáp án {option}</Label>
              </div>
              <Input
                value={question[`option_${option.toLowerCase()}` as keyof TestQuestion] as string || ''}
                onChange={(e) => onUpdate(index, {
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
            onChange={(e) => onUpdate(index, { explanation: e.target.value })}
            placeholder="Giải thích đáp án đúng..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
