import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import {
    ArrowLeft,
    Calendar,
    Eye,
    User,
    Tag,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Article } from '../types';
import { HtmlContent } from '@/components/ui/HtmlContent';
import { logger } from '@/lib/logger';

const log = logger('ArticlePreviewPage');

const statusConfig = {
    draft: { label: 'Bản nháp', icon: AlertCircle, color: 'bg-gray-500' },
    pending: { label: 'Chờ duyệt', icon: Clock, color: 'bg-yellow-500' },
    approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'bg-green-500' },
    rejected: { label: 'Từ chối', icon: XCircle, color: 'bg-red-500' },
};

const ArticlePreviewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isAdmin, isModerator, loading: roleLoading } = usePermissionsContext();

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('articles')
                    .select(`
            *,
            author:profiles(user_id, full_name, username, avatar_url),
            category:article_categories(*)
          `)
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                setArticle(data as Article);
            } catch (err) {
                log.error('Error fetching article', err);
                setError('Không thể tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    // Check permissions
    if (roleLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    // Only admin, moderator, or author can preview
    const canPreview = isAdmin || isModerator || (article && article.author_id === user?.id);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/4" />
                        <div className="h-12 bg-muted rounded" />
                        <div className="h-64 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                            <p className="text-destructive">{error || 'Không tìm thấy bài viết'}</p>
                            <Button className="mt-4" onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!canPreview) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                            <p className="text-destructive">Bạn không có quyền xem bài viết này</p>
                            <Button className="mt-4" onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const status = statusConfig[article.status];
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Trang chủ', href: '/' },
                        { label: 'Quản trị', href: '/admin' },
                        { label: 'Duyệt bài viết', href: '/admin/articles' },
                        { label: 'Xem trước' },
                    ]}
                    backHref="/admin/articles"
                />

                {/* Preview Banner */}
                <div className="mt-6 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
                    <Eye className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Chế độ xem trước
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Đây là bản xem trước của bài viết. Bài viết này chưa được công khai.
                        </p>
                    </div>
                    <Badge className={`${status.color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                    </Badge>
                </div>

                {/* Article Content */}
                <article className="bg-card rounded-xl border overflow-hidden">
                    {/* Thumbnail */}
                    {article.thumbnail_url && (
                        <div className="aspect-video bg-muted">
                            <img
                                src={article.thumbnail_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-8">
                        {/* Category & Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {article.category && (
                                <Badge variant="default">
                                    {article.category.name}
                                </Badge>
                            )}
                            {article.tags?.map((tag) => (
                                <Badge key={tag} variant="outline">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold mb-6">{article.title}</h1>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={article.author?.avatar_url || ''} />
                                    <AvatarFallback>
                                        {article.author?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                    {article.author?.full_name || 'Ẩn danh'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(article.created_at), 'dd/MM/yyyy', { locale: vi })}
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {article.view_count || 0} lượt xem
                            </div>
                        </div>

                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8">
                                {article.excerpt}
                            </p>
                        )}

                        <Separator className="my-8" />

                        {/* Content */}
                        <HtmlContent
                            html={article.content}
                            className="prose-lg"
                        />
                    </div>
                </article>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/admin/articles')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ArticlePreviewPage;
