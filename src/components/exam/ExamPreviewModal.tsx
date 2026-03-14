import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Play, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

const log = logger('ExamPreviewModal');

interface Question {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c?: string;
    option_d?: string;
}

interface ExamPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId: string;
    examSlug: string;
    examTitle: string;
    source: 'exam' | 'question_set';
}

export function ExamPreviewModal({
    open,
    onOpenChange,
    examId,
    examSlug,
    examTitle,
    source,
}: ExamPreviewModalProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (open && examId) {
            fetchQuestions();
        }
    }, [open, examId]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            if (source === 'question_set') {
                // Fetch from practice_questions
                const { data, error, count } = await supabase
                    .from('practice_questions')
                    .select('id, question_text, option_a, option_b, option_c, option_d', { count: 'exact' })
                    .eq('set_id', examId)
                    .order('question_order', { ascending: true })
                    .limit(5);

                if (error) throw error;
                setQuestions(data || []);
                setTotalQuestions(count || 0);
            } else {
                // Fetch from questions table
                const { data, error, count } = await supabase
                    .from('questions')
                    .select('id, question_text, option_a, option_b, option_c, option_d', { count: 'exact' })
                    .eq('exam_id', examId)
                    .order('question_order', { ascending: true })
                    .limit(5);

                if (error) throw error;
                setQuestions(data || []);
                setTotalQuestions(count || 0);
            }
        } catch (error) {
            log.error('Error fetching preview questions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = () => {
        onOpenChange(false);
        const url = source === 'question_set'
            ? `/exam/${examSlug}?type=practice`
            : `/exam/${examSlug}`;
        navigate(url);
    };

    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Xem trước: {examTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 border rounded-lg">
                                    <Skeleton className="h-5 w-3/4 mb-3" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Chưa có câu hỏi nào
                        </div>
                    ) : (
                        <>
                            {questions.map((q, idx) => (
                                <div key={q.id} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Badge variant="secondary" className="shrink-0">
                                            {idx + 1}
                                        </Badge>
                                        <p className="font-medium text-sm">
                                            {q.question_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                                        </p>
                                    </div>
                                    <div className="grid gap-2 ml-8">
                                        {[q.option_a, q.option_b, q.option_c, q.option_d]
                                            .filter(Boolean)
                                            .map((option, optIdx) => (
                                                <div
                                                    key={optIdx}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-background border"
                                                >
                                                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                        {optionLabels[optIdx]}
                                                    </span>
                                                    <span className="text-sm">{option}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}

                            {/* Hidden questions indicator */}
                            {totalQuestions > 5 && (
                                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground border-t">
                                    <Lock className="w-4 h-4" />
                                    <span>Còn {totalQuestions - 5} câu hỏi khác...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button onClick={handleStartExam}>
                        <Play className="w-4 h-4 mr-2" />
                        Làm bài ngay
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
