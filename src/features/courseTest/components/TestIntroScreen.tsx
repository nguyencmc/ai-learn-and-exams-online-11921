import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { CourseTest, TestAttempt } from '../types';

interface TestIntroScreenProps {
  test: CourseTest;
  questionCount: number;
  previousAttempts: TestAttempt[];
  onStartTest: () => void;
}

export const TestIntroScreen = ({
  test,
  questionCount,
  previousAttempts,
  onStartTest,
}: TestIntroScreenProps) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{test.title}</CardTitle>
        {test.description && (
          <CardDescription>{test.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{questionCount}</p>
            <p className="text-sm text-muted-foreground">Câu hỏi</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{test.duration_minutes}</p>
            <p className="text-sm text-muted-foreground">Phút</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{test.pass_percentage}%</p>
            <p className="text-sm text-muted-foreground">Điểm đạt</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {test.max_attempts - previousAttempts.length}
            </p>
            <p className="text-sm text-muted-foreground">Lượt còn lại</p>
          </div>
        </div>

        {previousAttempts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Lịch sử làm bài</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {previousAttempts.map((attempt, index) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                  <span>Lần {previousAttempts.length - index}</span>
                  <div className="flex items-center gap-3">
                    <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                      {attempt.score}%
                    </span>
                    <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                      {attempt.passed ? 'Đạt' : 'Chưa đạt'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onStartTest}
            disabled={previousAttempts.length >= test.max_attempts}
            className="gap-2"
          >
            {previousAttempts.length >= test.max_attempts ? (
              'Đã hết lượt làm bài'
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Bắt đầu làm bài
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
