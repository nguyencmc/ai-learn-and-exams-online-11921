import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    Tag,
    Eye,
    ArrowRight,
    FileText,
    Calendar,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article, ArticleCategory } from '../types';

interface ArticleSidebarProps {
    featuredArticles?: Article[];
    popularTags?: { name: string; count: number }[];
    categories?: ArticleCategory[];
    className?: string;
}

export const ArticleSidebar = ({
    featuredArticles = [],
    popularTags = [],
    categories = [],
    className
}: ArticleSidebarProps) => {
    return (
        <aside className={cn("space-y-6", className)}>
            {/* Featured Articles Widget */}
            {featuredArticles.length > 0 && (
                <Card className="overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Bài viết nổi bật
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {featuredArticles.slice(0, 5).map((article, index) => (
                            <Link
                                key={article.id}
                                to={`/articles/${article.slug}`}
                                className="group flex gap-3"
                            >
                                {/* Thumbnail */}
                                <div className="relative shrink-0 w-20 h-14 rounded-md overflow-hidden bg-muted">
                                    {article.thumbnail_url ? (
                                        <img
                                            src={article.thumbnail_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-muted">
                                            <FileText className="w-5 h-5 text-primary/40" />
                                        </div>
                                    )}
                                    {/* Number indicator */}
                                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                        {article.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Eye className="w-3 h-3" />
                                        <span>{(article.view_count ?? 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Popular Tags Widget */}
            {popularTags.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary" />
                            Tags phổ biến
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {popularTags.map((tag) => (
                                <Link
                                    key={tag.name}
                                    to={`/articles?tag=${encodeURIComponent(tag.name)}`}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                                    >
                                        #{tag.name}
                                        <span className="ml-1 text-xs opacity-70">({tag.count})</span>
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Categories Widget */}
            {categories.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary" />
                            Danh mục
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/articles?category=${category.id}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                                >
                                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {category.name}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {category.article_count ?? 0}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Newsletter Widget */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-1">Đăng ký nhận bài mới</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                        Nhận thông báo khi có bài viết mới
                    </p>
                    <Button className="w-full gap-2" size="sm">
                        Đăng ký ngay
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </CardContent>
            </Card>
        </aside>
    );
};

export default ArticleSidebar;
