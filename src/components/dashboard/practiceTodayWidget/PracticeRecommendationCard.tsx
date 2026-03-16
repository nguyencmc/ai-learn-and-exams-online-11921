import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Trophy,
  Flame,
  Star,
  BookOpen,
} from 'lucide-react';
import type { Recommendation } from './types';

interface PracticeRecommendationCardProps {
  smartRecs: Recommendation[];
  smartSummary: string;
  smartLoading: boolean;
  onRefresh: () => void;
}

const getIcon = (icon: Recommendation['icon']): React.ReactNode => {
  const map: Record<string, React.ReactNode> = {
    target: <Target className="w-4 h-4" />,
    brain: <Brain className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
    book: <BookOpen className="w-4 h-4" />,
    trophy: <Trophy className="w-4 h-4" />,
    flame: <Flame className="w-4 h-4" />,
    star: <Star className="w-4 h-4" />,
  };
  return map[icon] ?? <Sparkles className="w-4 h-4" />;
};

const getPriorityStyle = (priority: Recommendation['priority']) => ({
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400',
  low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400',
}[priority]);

const getPriorityLabel = (priority: Recommendation['priority']) =>
  ({ high: 'Ưu tiên', medium: 'Nên làm', low: 'Tùy chọn' }[priority]);

export const PracticeRecommendationCard = ({ smartRecs, smartSummary, smartLoading, onRefresh }: PracticeRecommendationCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="pt-3 sm:pt-4 border-t border-border/50">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h4 className="font-medium text-foreground text-sm sm:text-base truncate">Gợi ý cho bạn</h4>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={onRefresh}
          disabled={smartLoading}
          className="h-7 w-7 p-0"
          title="Làm mới gợi ý"
        >
          <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${smartLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {smartLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : smartRecs.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          <div className="p-2 sm:p-3 bg-primary/5 rounded-lg text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {smartSummary}
          </div>

          {smartRecs.map((rec, i) => (
            <div
              key={i}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border/50 hover:bg-accent/5 cursor-pointer transition-colors"
              onClick={() => navigate(rec.href)}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {getIcon(rec.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm truncate">{rec.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{rec.description}</p>
              </div>
              <Badge variant="outline" className={`${getPriorityStyle(rec.priority)} text-[9px] sm:text-xs hidden xs:inline-flex`}>
                {getPriorityLabel(rec.priority)}
              </Badge>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 sm:py-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Bắt đầu luyện tập để nhận gợi ý cá nhân hoá</p>
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="mt-2 text-xs h-8 gap-1.5">
              <Target className="w-3 h-3" />Bắt đầu ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
