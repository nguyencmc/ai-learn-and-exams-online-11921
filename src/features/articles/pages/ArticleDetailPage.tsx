import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useArticle, useArticleComments, useArticles } from '../hooks';
import { ArticleCard, ArticleSidebar } from '../components';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  Reply,
  MoreVertical,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ArrowUp,
  BookOpen,
  Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { HtmlContent } from '@/components/ui/HtmlContent';

const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { article, loading, error } = useArticle(slug);
  const { comments, addComment, deleteComment } = useArticleComments(article?.id);

  // Get related articles
  const { articles: allArticles } = useArticles({ status: 'approved' });
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return allArticles
      .filter(a => a.id !== article.id && a.category_id === article.category_id)
      .slice(0, 4);
  }, [allArticles, article]);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show back to top button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const success = await addComment(newComment.trim());
    if (success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const success = await addComment(replyContent.trim(), parentId);
    if (success) {
      setReplyContent('');
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const title = article?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <main className="flex-1 max-w-4xl">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="aspect-video bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            </main>
            <aside className="w-full lg:w-80 shrink-0">
              <div className="animate-pulse space-y-4">
                <div className="h-40 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Bài viết', href: '/articles' },
              { label: 'Không tìm thấy' },
            ]}
            backHref="/articles"
          />
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy bài viết</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/articles')}
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === article.author_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Bài viết', href: '/articles' },
            { label: article.title },
          ]}
          backHref="/articles"
        />

        {/* Main Content - 2 Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Article Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            <article>
              {/* Article Header */}
              <header className="mb-6">
                {/* Tags and Category */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.category && (
                    <Badge className="bg-primary/90">
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
                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {article.title}
                </h1>

                {/* Author and Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Link to={article.author?.username ? `/@${article.author.username}` : '#'}>
                      <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                        <AvatarImage src={article.author?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {article.author?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        to={article.author?.username ? `/@${article.author.username}` : '#'}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {article.author?.full_name || 'Ẩn danh'}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(article.published_at || article.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {(article.view_count ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {article.comment_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isAuthor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/articles/edit/${article.slug}`)}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </Button>
                    )}
                  </div>
                </div>
              </header>

              {/* Thumbnail */}
              {article.thumbnail_url && (
                <div className="aspect-video rounded-xl overflow-hidden mb-8 shadow-lg">
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <HtmlContent
                html={article.content}
                className="prose-lg mb-8"
              />

              {/* Tags at bottom */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-2 py-4 border-t border-b mb-6">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link key={tag} to={`/articles?tag=${tag}`}>
                        <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Share Buttons */}
              <Card className="mb-8">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Chia sẻ bài viết:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-blue-600 hover:text-white hover:border-blue-600"
                        onClick={() => handleShare('facebook')}
                      >
                        <Facebook className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-sky-500 hover:text-white hover:border-sky-500"
                        onClick={() => handleShare('twitter')}
                      >
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-blue-700 hover:text-white hover:border-blue-700"
                        onClick={() => handleShare('linkedin')}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShare()}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Bài viết liên quan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedArticles.map((related) => (
                      <ArticleCard
                        key={related.id}
                        article={related}
                        variant="compact"
                      />
                    ))}
                  </div>
                </section>
              )}

              <Separator className="my-8" />

              {/* Comments Section */}
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Bình luận ({article.comment_count ?? 0})
                </h2>

                {/* New Comment Form */}
                {user ? (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Viết bình luận của bạn..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={handleSubmitComment}
                              disabled={!newComment.trim() || submitting}
                              className="gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Gửi bình luận
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mb-6">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground mb-2">Đăng nhập để bình luận</p>
                      <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={comment.author?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {comment.author?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-medium">
                                  {comment.author?.full_name || 'Ẩn danh'}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                    locale: vi
                                  })}
                                  {comment.is_edited && ' (đã chỉnh sửa)'}
                                </span>
                              </div>
                              {(user?.id === comment.user_id) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Xóa
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Bình luận này sẽ bị xóa vĩnh viễn.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteComment(comment.id)}
                                          >
                                            Xóa
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <p className="mt-1 text-foreground">{comment.content}</p>

                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-muted-foreground"
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              >
                                <Reply className="w-3 h-3 mr-1" />
                                Trả lời
                              </Button>
                            )}

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                              <div className="mt-3 pl-4 border-l-2">
                                <Textarea
                                  placeholder="Viết trả lời..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  rows={2}
                                  className="mb-2"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyContent.trim() || submitting}
                                  >
                                    Gửi
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 space-y-4">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-3">
                                    <Avatar className="w-8 h-8 shrink-0">
                                      <AvatarImage src={reply.author?.avatar_url || ''} />
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {reply.author?.full_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {reply.author?.full_name || 'Ẩn danh'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(reply.created_at), {
                                            addSuffix: true,
                                            locale: vi
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-sm mt-1">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có bình luận nào. Hãy là người đầu tiên!
                    </div>
                  )}
                </div>
              </section>
            </article>
          </main>

          {/* Sidebar */}
          <ArticleSidebar
            featuredArticles={relatedArticles}
            className="w-full lg:w-80 shrink-0"
          />
        </div>
      </div>

      {/* Back to Top Button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 rounded-full shadow-lg transition-all duration-300 z-50",
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={scrollToTop}
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ArticleDetailPage;
