import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useArticles } from '../hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Article } from '../types';

const ArticleModerationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isModerator, loading: roleLoading } = usePermissionsContext();
  const { toast: _toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { articles, loading, approveArticle, rejectArticle, refetch: _refetch } = useArticles({
    status: activeTab,
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    navigate('/');
    return null;
  }

  const handleApprove = async (article: Article) => {
    setProcessing(true);
    await approveArticle(article.id, user!.id);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedArticle || !rejectReason.trim()) return;
    setProcessing(true);
    await rejectArticle(selectedArticle.id, rejectReason.trim());
    setRejectDialogOpen(false);
    setSelectedArticle(null);
    setRejectReason('');
    setProcessing(false);
  };

  const openRejectDialog = (article: Article) => {
    setSelectedArticle(article);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản trị', href: '/admin' },
            { label: 'Duyệt bài viết' },
          ]}
          backHref="/admin"
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Duyệt bài viết
              </h1>
              <p className="text-muted-foreground mt-1">
                Xem xét và phê duyệt các bài viết từ người dùng
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Chờ duyệt
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Đã duyệt
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="w-4 h-4" />
                Từ chối
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {activeTab === 'pending' && 'Không có bài viết nào chờ duyệt'}
                      {activeTab === 'approved' && 'Chưa có bài viết nào được duyệt'}
                      {activeTab === 'rejected' && 'Chưa có bài viết nào bị từ chối'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {articles.map((article) => (
                    <Card key={article.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Thumbnail */}
                          <div className="shrink-0">
                            {article.thumbnail_url ? (
                              <img 
                                src={article.thumbnail_url} 
                                alt={article.title}
                                className="w-full lg:w-48 aspect-video object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full lg:w-48 aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-semibold line-clamp-2">
                                  {article.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={article.author?.avatar_url || ''} />
                                      <AvatarFallback className="text-xs">
                                        {article.author?.full_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    {article.author?.full_name || 'Ẩn danh'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDistanceToNow(new Date(article.created_at), { 
                                      addSuffix: true, 
                                      locale: vi 
                                    })}
                                  </span>
                                  {article.category && (
                                    <Badge variant="outline">{article.category.name}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {article.excerpt && (
                              <p className="text-muted-foreground mt-3 line-clamp-2">
                                {article.excerpt}
                              </p>
                            )}

                            {article.rejection_reason && (
                              <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                <p className="text-sm text-destructive">
                                  <strong>Lý do từ chối:</strong> {article.rejection_reason}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Open preview in new tab
                                  window.open(`/articles/preview/${article.id}`, '_blank');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Xem trước
                              </Button>
                              
                              {activeTab === 'pending' && (
                                <>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleApprove(article)}
                                    disabled={processing}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Duyệt
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openRejectDialog(article)}
                                    disabled={processing}
                                    className="gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Từ chối
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối bài viết</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho tác giả
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleModerationPage;
