import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import type { InProgressSession } from './types';

interface PracticeInProgressCardProps {
  inProgressSession: InProgressSession | null;
  onContinueExam: () => void;
}

export const PracticeInProgressCard = ({ inProgressSession, onContinueExam }: PracticeInProgressCardProps) => (
  <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Bài thi đang làm dở</h4>
        {inProgressSession ? (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              1 bài chưa hoàn thành ({inProgressSession.total_questions || 0} câu)
            </p>
            <Button size="sm" onClick={onContinueExam} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />Tiếp tục
            </Button>
          </>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
            Không có bài đang làm dở
          </p>
        )}
      </div>
    </div>
  </div>
);
