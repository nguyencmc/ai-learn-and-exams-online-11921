import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger('AIExplanation');

interface AIExplanationProps {
  question: {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string | null;
    option_d: string | null;
    correct_answer: string;
    explanation: string | null;
  };
  userAnswer?: string;
}

export const AIExplanation = ({ question, userAnswer }: AIExplanationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleGetExplanation = async () => {
    if (explanation) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-answer', {
        body: {
          question: question.question_text,
          options: {
            a: question.option_a,
            b: question.option_b,
            c: question.option_c,
            d: question.option_d,
          },
          correctAnswer: question.correct_answer,
          userAnswer: userAnswer,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setExplanation(data.explanation);
      setIsExpanded(true);
    } catch (error) {
      log.error('Error getting AI explanation', error);
      toast.error('Không thể lấy giải thích từ AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGetExplanation}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang phân tích...
          </>
        ) : explanation ? (
          <>
            <Sparkles className="w-4 h-4 text-primary" />
            Giải thích AI
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Giải thích bằng AI
          </>
        )}
      </Button>

      {explanation && isExpanded && (
        <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-primary">Giải thích từ AI</span>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
};
