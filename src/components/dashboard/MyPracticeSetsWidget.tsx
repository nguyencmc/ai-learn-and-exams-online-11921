import { memo, useState, useEffect, useCallback} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  Plus,
  FileQuestion,
  ChevronRight,
} from 'lucide-react';

export const MyPracticeSetsWidget = memo(function MyPracticeSetsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalSets, setTotalSets] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    
    // Fetch total sets count
    const { count: setsCount } = await supabase
      .from('question_sets')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user?.id);

    // Fetch total questions count from user's sets
    const { data: sets } = await supabase
      .from('question_sets')
      .select('question_count')
      .eq('creator_id', user?.id);

    const questionsTotal = sets?.reduce((acc, set) => acc + (set.question_count || 0), 0) || 0;

    setTotalSets(setsCount || 0);
    setTotalQuestions(questionsTotal);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  if (loading) {
    return (
      <Skeleton className="h-32 w-full rounded-xl" />
    );
  }

  return (
    <Link to="/practice/question-bank" className="block group">
      <Card className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Target className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                      Bộ đề của tôi
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{totalSets}</span> bộ đề
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{totalQuestions}</span> câu hỏi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hidden sm:flex"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/practice/create');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tạo mới
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Empty state hint */}
              {totalSets === 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileQuestion className="w-4 h-4" />
                  <span>Nhấn để tạo bộ đề đầu tiên</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

MyPracticeSetsWidget.displayName = 'MyPracticeSetsWidget';
