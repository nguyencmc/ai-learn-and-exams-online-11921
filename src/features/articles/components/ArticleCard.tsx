import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Eye, MessageSquare, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Article } from '../types';

interface ArticleCardProps {
    article: Article;
    variant?: 'default' | 'compact' | 'featured';
    className?: string;
}

export const ArticleCard = ({ article, variant = 'default', className }: ArticleCardProps) => {
    const isCompact = variant === 'compact';
    const isFeatured = variant === 'featured';

    return (
        <Link to={`/articles/${article.slug}`} className={cn("group block", className)}>
            <Card className={cn(
                "h-full overflow-hidden transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1",
                "bg-card border-border/50",
                isFeatured && "ring-2 ring-primary/20"
            )}>
                {/* Thumbnail */}
                <div className={cn(
                    "relative overflow-hidden bg-muted",
                    isCompact ? "aspect-[16/10]" : "aspect-video"
                )}>
                    {article.thumbnail_url ? (
                        <img
                            src={article.thumbnail_url}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                            <FileText className="w-12 h-12 text-primary/40" />
                        </div>
                    )}

                    {/* Category Badge */}
                    {article.category && (
                        <Badge
                            className="absolute top-3 left-3 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm"
                        >
                            {article.category.name}
                        </Badge>
                    )}

                    {/* Featured Badge */}
                    {article.is_featured && (
                        <Badge
                            variant="secondary"
                            className="absolute top-3 right-3 bg-amber-500/90 text-white"
                        >
                            Nổi bật
                        </Badge>
                    )}
                </div>

                <CardContent className={cn("p-4", isCompact && "p-3")}>
                    {/* Title */}
                    <h3 className={cn(
                        "font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors",
                        isCompact ? "text-sm" : "text-base",
                        isFeatured && "text-lg"
                    )}>
                        {article.title}
                    </h3>

                    {/* Excerpt - only for non-compact */}
                    {!isCompact && article.excerpt && (
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                            {article.excerpt}
                        </p>
                    )}

                    {/* Meta Info */}
                    <div className={cn(
                        "flex items-center gap-3 text-muted-foreground mt-3",
                        isCompact ? "text-xs" : "text-sm"
                    )}>
                        {/* Author */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar className={cn(isCompact ? "w-5 h-5" : "w-6 h-6")}>
                                <AvatarImage src={article.author?.avatar_url || ''} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {article.author?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[80px]">
                                {article.author?.full_name || 'Ẩn danh'}
                            </span>
                        </div>

                        {/* Divider */}
                        <span className="text-border">|</span>

                        {/* Date */}
                        <div className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>
                                {formatDistanceToNow(new Date(article.published_at || article.created_at), {
                                    addSuffix: true,
                                    locale: vi
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Stats - only for non-compact */}
                    {!isCompact && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {(article.view_count ?? 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {article.comment_count ?? 0}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};

export default ArticleCard;
