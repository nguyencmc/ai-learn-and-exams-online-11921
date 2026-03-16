import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen, Zap } from 'lucide-react';
import type { LastPracticeSet } from './types';

interface PracticeQuickActionsProps {
  lastPracticeSet: LastPracticeSet | null;
  onQuickPractice: () => void;
}

export const PracticeQuickActions = ({ lastPracticeSet, onQuickPractice }: PracticeQuickActionsProps) => (
  <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">Luyện nhanh 10 câu</h4>
        {lastPracticeSet ? (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 truncate">{lastPracticeSet.title}</p>
            <Button size="sm" variant="secondary" onClick={onQuickPractice} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />Luyện ngay
            </Button>
          </>
        ) : (
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />Chưa có bộ đề
            </p>
            <Link to="/practice">
              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />Khám phá
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
);
