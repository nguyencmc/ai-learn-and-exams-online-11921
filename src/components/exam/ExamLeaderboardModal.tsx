import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Clock, Calendar, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger('ExamLeaderboardModal');

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    score: number;
    time_spent_seconds: number;
    completed_at: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
}

interface ExamLeaderboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId: string;
    examTitle: string;
}

export function ExamLeaderboardModal({
    open,
    onOpenChange,
    examId,
    examTitle,
}: ExamLeaderboardModalProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && examId) {
            fetchLeaderboard();
        }
    }, [open, examId]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data: attempts, error } = await supabase
                .from('exam_attempts')
                .select('user_id, score, time_spent_seconds, completed_at')
                .eq('exam_id', examId)
                .not('completed_at', 'is', null)
                .order('score', { ascending: false })
                .order('time_spent_seconds', { ascending: true })
                .limit(20);

            if (error) throw error;

            if (!attempts || attempts.length === 0) {
                setEntries([]);
                setLoading(false);
                return;
            }

            const userIds = [...new Set(attempts.map(a => a.user_id).filter(Boolean))];

            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, username, avatar_url')
                .in('user_id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            const leaderboard: LeaderboardEntry[] = attempts.map((attempt, index) => {
                const profile = profileMap.get(attempt.user_id);
                return {
                    rank: index + 1,
                    user_id: attempt.user_id || '',
                    score: attempt.score || 0,
                    time_spent_seconds: attempt.time_spent_seconds || 0,
                    completed_at: attempt.completed_at || '',
                    full_name: profile?.full_name || null,
                    username: profile?.username || null,
                    avatar_url: profile?.avatar_url || null,
                };
            });

            setEntries(leaderboard);
        } catch (error) {
            log.error('Error fetching leaderboard', error);
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
        });
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Bảng xếp hạng: {examTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Chưa có ai làm bài thi này</p>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div
                                key={`${entry.user_id}-${entry.completed_at}`}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${entry.rank <= 3 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                                    }`}
                            >
                                <div className="w-8 flex justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={entry.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {(entry.full_name || entry.username || 'U').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {entry.full_name || entry.username || 'Ẩn danh'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(entry.time_spent_seconds)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(entry.completed_at)}
                                        </span>
                                    </div>
                                </div>
                                <Badge
                                    variant={entry.rank <= 3 ? 'default' : 'secondary'}
                                    className={entry.rank === 1 ? 'bg-yellow-500' : ''}
                                >
                                    {entry.score}%
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
