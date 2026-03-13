import React, { useState, useEffect } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('SmartRecommendations');
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, BookOpen, Brain, Target, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Recommendation {
  type: 'exam' | 'flashcard' | 'practice' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  examId?: string;
}

interface SmartRecommendationsData {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: Recommendation[];
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
}

// Check if date is today
const isToday = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const SmartRecommendations: React.FC = () => {
  const [data, setData] = useState<SmartRecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load cached recommendations or fetch new ones if first login today
  const loadRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check for cached recommendations
      const { data: cached } = await supabase
        .from('user_smart_recommendations')
        .select('recommendations, generated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cached && isToday(cached.generated_at)) {
        // Use cached data if generated today
        setData(cached.recommendations as unknown as SmartRecommendationsData);
        setLastUpdated(cached.generated_at);
        setIsLoading(false);
        return;
      }

      // First login today - generate new recommendations
      await generateNewRecommendations();
    } catch (error) {
      log.error('Load recommendations error', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new AI recommendations and cache them
  const generateNewRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('smart-recommendations', {
        body: { userId: user.id },
      });

      if (error) throw error;
      setData(result);
      
      // Cache the recommendations
      const now = new Date().toISOString();
      const { error: upsertError } = await supabase
        .from('user_smart_recommendations')
        .upsert({
          user_id: user.id,
          recommendations: result,
          generated_at: now,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        log.error('Cache recommendations error', upsertError);
      } else {
        setLastUpdated(now);
      }
    } catch (error) {
      log.error('Smart recommendations error', error);
      toast({
        title: 'Lỗi',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    await generateNewRecommendations();
    toast({
      title: 'Đã cập nhật',
      description: 'Gợi ý học tập đã được làm mới',
    });
  };

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return <BookOpen className="w-4 h-4" />;
      case 'flashcard': return <Brain className="w-4 h-4" />;
      case 'practice': return <Target className="w-4 h-4" />;
      case 'review': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-muted';
    }
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    switch (rec.type) {
      case 'exam':
        if (rec.examId) navigate(`/exams/${rec.examId}`);
        else navigate('/exams');
        break;
      case 'flashcard':
        navigate('/flashcards');
        break;
      default:
        navigate('/dashboard');
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Đăng nhập để xem gợi ý học tập cá nhân hóa
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gợi ý học tập thông minh
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              AI phân tích và đưa ra gợi ý dựa trên tiến độ của bạn
              {lastUpdated && (
                <span className="text-xs">
                  • Cập nhật {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: vi })}
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Đang phân tích dữ liệu học tập...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border">
              <p className="text-sm">{data.summary}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline">
                  Độ khó phù hợp: {data.suggestedDifficulty === 'easy' ? 'Dễ' : data.suggestedDifficulty === 'medium' ? 'Trung bình' : 'Khó'}
                </Badge>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-700">✨ Điểm mạnh</h4>
                <ul className="space-y-1">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-orange-700">🎯 Cần cải thiện</h4>
                <ul className="space-y-1">
                  {data.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium mb-3">📚 Gợi ý học tập</h4>
              <div className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRecommendationClick(rec)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getTypeIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{rec.description}</p>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                      {rec.priority === 'high' ? 'Ưu tiên' : rec.priority === 'medium' ? 'Nên làm' : 'Tùy chọn'}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Chưa có dữ liệu gợi ý</p>
            <Button variant="outline" className="mt-4" onClick={generateNewRecommendations}>
              Tạo gợi ý
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
