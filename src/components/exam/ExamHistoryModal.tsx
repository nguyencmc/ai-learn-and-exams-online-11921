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
import { History, Clock, Calendar, Eye, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const log = logger('ExamHistoryModal');

interface AttemptEntry {
    id: string;
    score: number;
    time_spent_seconds: number;
    completed_at: string;
    total_questions: number;
    correct_answers: number;
}

interface ExamHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId: string;
    examTitle: string;
}

export function ExamHistoryModal({
    open,
    onOpenChange,
    examId,
    examTitle,
}: ExamHistoryModalProps) {
    const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (open && examId && user) {
            fetchHistory();
        }
    }, [open, examId, user]);

    const fetchHistory = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('exam_attempts')
                .select('id, score, time_spent_seconds, completed_at, total_questions, correct_answers')
                .eq('exam_id', examId)
                .eq('user_id', user.id)
                .not('completed_at', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setAttempts((data || []) as AttemptEntry[]);
        } catch (error) {
            log.error('Error fetching history', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleViewResult = (attemptId: string) => {
        onOpenChange(false);
        navigate(`/attempt/${attemptId}`);
    };

    if (!user) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Lịch sử làm bài
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Vui lòng đăng nhập để xem lịch sử làm bài</p>
                        <Button className="mt-4" onClick={() => navigate('/login')}>
                            Đăng nhập
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-green-500" />
                        Lịch sử làm bài: {examTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 border rounded-lg">
                                    <Skeleton className="h-5 w-1/3 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Bạn chưa làm bài thi này</p>
                        </div>
                    ) : (
                        attempts.map((attempt, idx) => (
                            <div
                                key={attempt.id}
                                className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Lần {attempts.length - idx}</Badge>
                                        <Badge
                                            variant={attempt.score >= 50 ? 'default' : 'destructive'}
                                            className={attempt.score >= 80 ? 'bg-green-500' : ''}
                                        >
                                            {attempt.score}%
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewResult(attempt.id)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Xem chi tiết
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        {attempt.correct_answers}/{attempt.total_questions} đúng
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatTime(attempt.time_spent_seconds)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(attempt.completed_at)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
