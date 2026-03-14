import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HtmlContent } from '@/components/ui/HtmlContent';
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import type { CourseTest, TestQuestion, TestResult } from '../types';

interface TestResultScreenProps {
  test: CourseTest;
  questions: TestQuestion[];
  result: TestResult;
  previousAttempts: { length: number };
  onStartTest: () => void;
  onBackToIntro: () => void;
  getOptionLabel: (option: string) => string | undefined;
  isMultipleAnswer: (question: TestQuestion) => boolean;
}

export const TestResultScreen = ({
  test,
  questions,
  result,
  previousAttempts,
  onStartTest,
  onBackToIntro,
  getOptionLabel,
  isMultipleAnswer,
}: TestResultScreenProps) => {
  return (
    <div className="space-y-6">
      {/* Result Summary */}
      <Card className={`border-2 ${result.passed ? 'border-green-500' : 'border-red-500'}`}>
        <CardContent className="py-8 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            result.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.passed ? (
              <Trophy className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            result.passed ? 'text-green-600' : 'text-red-600'
          }`}>
            {result.passed ? 'Chúc mừng! Bạn đã đạt!' : 'Chưa đạt yêu cầu'}
          </h2>
          <p className="text-4xl font-bold mb-4">{result.score}%</p>
          <p className="text-muted-foreground">
            Đúng {result.correctCount}/{result.totalQuestions} câu
            {' • '}Yêu cầu: {test.pass_percentage}%
          </p>
        </CardContent>
      </Card>

      {/* Retry button */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onBackToIntro}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>
        {previousAttempts.length < test.max_attempts && (
          <Button onClick={onStartTest}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Làm lại
          </Button>
        )}
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chi tiết kết quả</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {questions.map((question, index) => {
                const questionResult = result.answers[question.id];
                const isCorrect = questionResult?.isCorrect;
                const isMultiple = isMultipleAnswer(question);

                const availableOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(opt => {
                  const key = getOptionLabel(opt) as keyof TestQuestion;
                  return question[key];
                });

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Câu {index + 1}
                          {isMultiple && <Badge variant="outline" className="ml-2 text-xs">Nhiều đáp án</Badge>}
                        </p>
                        <HtmlContent html={question.question_text} className="font-medium" />
                      </div>
                    </div>

                    <div className="ml-8 space-y-2">
                      {availableOptions.map(opt => {
                        const key = getOptionLabel(opt) as keyof TestQuestion;
                        const optionText = question[key] as string;
                        const isSelected = questionResult?.selected.includes(opt);
                        const isCorrectAnswer = questionResult?.correct.includes(opt);

                        let bgClass = 'bg-muted/50';
                        if (isCorrectAnswer && isSelected) {
                          bgClass = 'bg-green-100 border-green-300';
                        } else if (isCorrectAnswer) {
                          bgClass = 'bg-green-100 border-green-300';
                        } else if (isSelected) {
                          bgClass = 'bg-red-100 border-red-300';
                        }

                        return (
                          <div
                            key={opt}
                            className={`flex items-center gap-2 p-2 rounded border ${bgClass}`}
                          >
                            <span className="font-medium w-6">{opt}.</span>
                            <HtmlContent html={optionText} className="flex-1" />
                            {isCorrectAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {isSelected && !isCorrectAnswer && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        );
                      })}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Giải thích:</p>
                          <HtmlContent html={question.explanation} className="text-sm text-blue-700" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
