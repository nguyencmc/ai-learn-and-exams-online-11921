import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, CheckCircle, XCircle } from 'lucide-react';

interface PracticeHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  stats: { correct: number; wrong: number };
  onBack: () => void;
}

export function PracticeHeader({
  currentIndex,
  totalQuestions,
  progress,
  stats,
  onBack,
}: PracticeHeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1 h-9 w-9 p-0 sm:w-auto sm:px-3"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground hidden sm:block truncate max-w-[160px] lg:max-w-none text-sm">
              Luyện tập
            </h1>
          </div>

          {/* Center: counter + progress */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {currentIndex + 1}{' '}
              <span className="text-muted-foreground font-normal">/ {totalQuestions}</span>
            </span>
            {/* mini progress bar on mobile */}
            <div className="w-24 h-1 rounded-full bg-muted overflow-hidden lg:hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <strong className="text-green-600">{stats.correct}</strong>
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <strong className="text-red-600">{stats.wrong}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
