import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useArticle, useArticleCategories } from '../hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Send, X, Plus, FileText, Image } from 'lucide-react';
import { logger } from '@/lib/logger';

const log = logger('ArticleEditorPage');

const ArticleEditorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useArticleCategories();
  const isEditing = !!slug;
  const { article: existingArticle, loading: articleLoading } = useArticle(isEditing ? slug : undefined);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail_url: '',
    category_id: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  // ── Upload ảnh nội dung bài viết lên Supabase Storage ──────────────────
  const handleContentImageUpload = async (file: File): Promise<string> => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const ext = file.name.split('.').pop();
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const path = `article-images/${y}/${m}/${d}/${uid}.${ext}`;

    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (existingArticle && isEditing) {
      // Check if user is the author
      if (existingArticle.author_id !== user?.id) {
        toast({
          title: 'Không có quyền',
          description: 'Bạn không có quyền chỉnh sửa bài viết này',
          variant: 'destructive',
        });
        navigate('/articles');
        return;
      }

      setFormData({
        title: existingArticle.title,
        content: existingArticle.content,
        excerpt: existingArticle.excerpt || '',
        thumbnail_url: existingArticle.thumbnail_url || '',
        category_id: existingArticle.category_id || '',
        tags: existingArticle.tags || [],
      });
    }
  }, [existingArticle, isEditing, user, navigate, toast]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100)
      + '-' + Date.now().toString(36);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSave = async (status: 'draft' | 'pending') => {
    if (!formData.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề bài viết',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung bài viết',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.slice(0, 200).trim(),
        thumbnail_url: formData.thumbnail_url.trim() || null,
        category_id: formData.category_id || null,
        tags: formData.tags,
        status,
        author_id: user!.id,
      };

      if (isEditing && existingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', existingArticle.id);

        if (error) throw error;

        toast({
          title: 'Thành công',
          description: status === 'pending'
            ? 'Bài viết đã được gửi để duyệt'
            : 'Đã lưu bản nháp',
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert({
            ...articleData,
            slug: generateSlug(formData.title),
          });

        if (error) throw error;

        toast({
          title: 'Thành công',
          description: status === 'pending'
            ? 'Bài viết đã được gửi để duyệt'
            : 'Đã lưu bản nháp',
        });
      }

      navigate('/articles/my');
    } catch (err) {
      log.error('Error saving article', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu bài viết',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (articleLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Bài viết', href: '/articles' },
            { label: isEditing ? 'Chỉnh sửa' : 'Viết bài mới' },
          ]}
          backHref="/articles"
        />

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {isEditing ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài viết</CardTitle>
              <CardDescription>
                Điền thông tin chi tiết cho bài viết của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Chuyên mục</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Ảnh đại diện (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/image.jpg"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  />
                </div>
                {formData.thumbnail_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border aspect-video max-w-sm">
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Mô tả ngắn</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Mô tả ngắn về bài viết (tự động tạo nếu để trống)..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Nội dung *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Viết nội dung bài viết của bạn..."
                  onImageUpload={handleContentImageUpload}
                  imageBucket="public-assets"
                  imageBucketPrefix="article-images"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/articles')}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Lưu nháp
            </Button>
            <Button
              onClick={() => handleSave('pending')}
              disabled={loading}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Gửi duyệt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditorPage;
