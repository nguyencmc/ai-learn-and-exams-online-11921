import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Trophy, Target, BrainCircuit } from 'lucide-react';
import type { PracticeQuestion } from '../types';

interface PracticeResultsProps {
  questions: PracticeQuestion[];
  stats: { correct: number; wrong: number };
  onRestart: () => void;
  onNavigateReview: () => void;
  onNavigatePractice: () => void;
}

export function PracticeResults({
  questions,
  stats,
  onRestart,
  onNavigateReview,
  onNavigatePractice,
}: PracticeResultsProps) {
  const total = questions.length;
  const pct = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              pct >= 70 ? 'bg-green-500/15' : 'bg-orange-500/15'
            }`}
          >
            {pct >= 70 ? (
              <Trophy className="h-10 w-10 text-green-500" />
            ) : (
              <Target className="h-10 w-10 text-orange-500" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {pct >= 90 ? '🎉' : pct >= 70 ? '👏' : pct >= 50 ? '👍' : '💪'} Kết quả luyện tập
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {questions.length} câu · Chế độ luyện tập
            </p>
          </div>
          <div>
            <div
              className={`text-5xl font-bold mb-2 ${
                pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}
            >
              {pct}%
            </div>
            <Progress value={pct} className="h-2 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-sm text-muted-foreground">Câu đúng</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
                <div className="text-sm text-muted-foreground">Câu sai</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {stats.wrong > 0 && (
              <Button
                variant="outline"
                onClick={onNavigateReview}
                className="w-full gap-2"
              >
                <BrainCircuit className="h-4 w-4" />
                Ôn lại {stats.wrong} câu sai
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Làm lại
              </Button>
              <Button className="flex-1" onClick={onNavigatePractice}>
                Xong
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
