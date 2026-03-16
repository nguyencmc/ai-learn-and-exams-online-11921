import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { WrongAnswerStats } from './types';

interface PracticeWrongAnswersCardProps {
  wrongAnswers: WrongAnswerStats;
  onReviewWrong: () => void;
}

export const PracticeWrongAnswersCard = ({ wrongAnswers, onReviewWrong }: PracticeWrongAnswersCardProps) => (
  <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Ôn câu sai</h4>
        {wrongAnswers.count > 0 ? (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <Badge variant="destructive" className="mr-1 text-[10px] sm:text-xs">{wrongAnswers.count}</Badge>câu sai cần ôn
            </p>
            <Button size="sm" variant="outline" onClick={onReviewWrong} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />Ôn ngay
            </Button>
          </>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />Chưa có câu sai
          </p>
        )}
      </div>
    </div>
  </div>
);
