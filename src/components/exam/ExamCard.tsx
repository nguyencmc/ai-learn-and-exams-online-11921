import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Heart,
    Eye,
    Trophy,
    History,
    Star,
    Clock,
    FileText,

} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamPreviewModal } from './ExamPreviewModal';
import { ExamLeaderboardModal } from './ExamLeaderboardModal';
import { ExamHistoryModal } from './ExamHistoryModal';

// Category gradient configurations
const CATEGORY_GRADIENTS = [
    'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600',
    'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
    'bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500',
    'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500',
    'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500',
    'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500',
    'bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500',
    'bg-gradient-to-br from-red-500 via-rose-500 to-pink-500',
];

interface ExamCardProps {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    questionCount?: number | null;
    attemptCount?: number | null;
    durationMinutes?: number | null;
    difficulty?: string | null;
    categoryName?: string;
    categoryIndex?: number;
    creatorName?: string | null;
    creatorAvatar?: string | null;
    thumbnailUrl?: string | null;
    source: 'exam' | 'question_set';
    isSaved?: boolean;
    onToggleSave?: (id: string) => void;
    rating?: number;
    reviewCount?: number;
}

export function ExamCard({
    id,
    title,
    slug,
    description,
    questionCount = 0,
    _attemptCount = 0,
    durationMinutes = 60,
    difficulty,
    categoryName,
    categoryIndex = 0,
    creatorName = 'Ẩn danh',
    creatorAvatar,
    thumbnailUrl,
    source,
    isSaved = false,
    onToggleSave,
    rating = 5.0,
    reviewCount = 0,
}: ExamCardProps) {
    const navigate = useNavigate();
    const gradient = CATEGORY_GRADIENTS[categoryIndex % CATEGORY_GRADIENTS.length];

    // Modal states
    const [previewOpen, setPreviewOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const _handleStartExam = () => {
        const url = source === 'question_set'
            ? `/exam/${slug || id}?type=practice`
            : `/exam/${slug}`;
        navigate(url);
    };

    const getBadgeLabel = () => {
        if (source === 'question_set') return 'CỘNG ĐỒNG';
        if (categoryName) return categoryName.toUpperCase();
        return 'ĐỀ THI';
    };

    return (
        <>
            <Card className="group relative overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                    {/* Left Gradient Panel with Icon or Thumbnail */}
                    <div className={cn(
                        "relative w-full md:w-56 h-40 md:h-auto shrink-0 flex items-center justify-center overflow-hidden",
                        !thumbnailUrl && gradient
                    )}>
                        {thumbnailUrl ? (
                            /* Thumbnail Image */
                            <>
                                <img
                                    src={thumbnailUrl}
                                    alt={title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                {/* Badge on thumbnail */}
                                <div className="absolute top-3 left-3 z-10">
                                    <Badge className="bg-white/90 text-foreground border-white/30 backdrop-blur-sm text-xs font-semibold px-2.5 py-1">
                                        {getBadgeLabel()}
                                    </Badge>
                                </div>
                            </>
                        ) : (
                            /* Default Gradient with Icon */
                            <>
                                {/* Decorative elements */}
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white/30 rounded-lg transform rotate-12" />
                                    <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-white/30 rounded-lg transform -rotate-12" />
                                </div>

                                {/* Badge */}
                                <div className="absolute top-3 left-3">
                                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-2.5 py-1">
                                        {getBadgeLabel()}
                                    </Badge>
                                </div>

                                {/* Icon Stack */}
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="relative">
                                        {/* Stacked papers effect */}
                                        <div className="absolute -bottom-2 -right-2 w-16 h-20 bg-white/20 rounded-lg transform rotate-6" />
                                        <div className="absolute -bottom-1 -right-1 w-16 h-20 bg-white/30 rounded-lg transform rotate-3" />
                                        <div className="relative w-16 h-20 bg-white/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <div className="text-center">
                                                <span className="text-xs font-bold text-white/90 block">TEST</span>
                                                <div className="mt-1 space-y-0.5">
                                                    <div className="w-8 h-0.5 bg-white/50 mx-auto" />
                                                    <div className="w-6 h-0.5 bg-white/50 mx-auto" />
                                                    <div className="w-7 h-0.5 bg-white/50 mx-auto" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Content Panel */}
                    <CardContent className="flex-1 p-5">
                        {/* Title */}
                        <Link
                            to={source === 'question_set' ? `/exam/${slug || id}` : `/exam/${slug}`}
                            className="block"
                        >
                            <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer hover:underline">
                                {title}
                            </h3>
                        </Link>

                        {/* Description */}
                        {description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                            </p>
                        )}

                        {/* Creator */}
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={creatorAvatar || undefined} alt={creatorName || ''} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {creatorName?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{creatorName}</span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-semibold text-amber-500">{rating.toFixed(1)}</span>
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-4 w-4",
                                            i < Math.floor(rating)
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-muted-foreground/30"
                                        )}
                                    />
                                ))}
                            </div>
                            {reviewCount > 0 && (
                                <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
                            )}
                        </div>

                        {/* Tags and Actions Row */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            {/* Meta tags */}
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs gap-1 font-normal">
                                    <Clock className="h-3 w-3" />
                                    {durationMinutes} phút
                                </Badge>
                                <Badge variant="outline" className="text-xs gap-1 font-normal">
                                    <FileText className="h-3 w-3" />
                                    {questionCount} câu
                                </Badge>
                                {difficulty && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-normal capitalize",
                                            difficulty === 'beginner' && "border-green-500/50 text-green-600",
                                            difficulty === 'intermediate' && "border-blue-500/50 text-blue-600",
                                            difficulty === 'advanced' && "border-red-500/50 text-red-600"
                                        )}
                                    >
                                        {difficulty === 'beginner' ? 'Cơ bản' :
                                            difficulty === 'intermediate' ? 'Trung bình' :
                                                difficulty === 'advanced' ? 'Nâng cao' : difficulty}
                                    </Badge>
                                )}
                            </div>

                            {/* Action icons */}
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className={cn(
                                                "p-2 rounded-full transition-colors",
                                                isSaved
                                                    ? "text-red-500 bg-red-500/10"
                                                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleSave?.(id);
                                            }}
                                        >
                                            <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isSaved ? 'Bỏ yêu thích' : 'Yêu thích'}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewOpen(true);
                                            }}
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Xem trước</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLeaderboardOpen(true);
                                            }}
                                        >
                                            <Trophy className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Bảng xếp hạng</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="p-2 rounded-full text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setHistoryOpen(true);
                                            }}
                                        >
                                            <History className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Lịch sử làm bài</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Modals */}
            <ExamPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                examId={id}
                examSlug={slug}
                examTitle={title}
                source={source}
            />
            <ExamLeaderboardModal
                open={leaderboardOpen}
                onOpenChange={setLeaderboardOpen}
                examId={id}
                examTitle={title}
            />
            <ExamHistoryModal
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                examId={id}
                examTitle={title}
            />
        </>
    );
}

export default ExamCard;
