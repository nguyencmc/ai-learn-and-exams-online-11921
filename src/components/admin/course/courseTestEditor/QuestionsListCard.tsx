import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ClipboardList } from 'lucide-react';
import type { TestQuestion } from './types';
import { QuestionCard } from './QuestionCard';

interface QuestionsListCardProps {
  questions: TestQuestion[];
  onAdd: () => void;
  onUpdate: (index: number, data: Partial<TestQuestion>) => void;
  onRemove: (index: number) => void;
}

export const QuestionsListCard = ({ questions, onAdd, onUpdate, onRemove }: QuestionsListCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Câu hỏi</CardTitle>
          <CardDescription>{questions.length} câu hỏi</CardDescription>
        </div>
        <Button onClick={onAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Thêm câu hỏi
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có câu hỏi nào</p>
            <Button onClick={onAdd} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              index={index}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
