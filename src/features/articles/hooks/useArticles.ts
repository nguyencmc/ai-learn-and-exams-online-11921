import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleStatus } from '../types';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('useArticles');

interface UseArticlesOptions {
  status?: ArticleStatus | 'all';
  categoryId?: string;
  authorId?: string;
  featured?: boolean;
  limit?: number;
  searchQuery?: string;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('articles')
        .select(`
          *,
          author:profiles(user_id, full_name, username, avatar_url),
          category:article_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.searchQuery) {
        query = query.or(`title.ilike.%${options.searchQuery}%,content.ilike.%${options.searchQuery}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setArticles((data as Article[]) || []);
    } catch (err) {
      setError(err as Error);
      log.error('Error fetching articles', err);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.categoryId, options.authorId, options.featured, options.limit, options.searchQuery]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const approveArticle = async (articleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) {
        log.error('Approve article error', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description: 'Bài viết đã được duyệt và công khai',
      });

      fetchArticles();
    } catch (err: unknown) {
      log.error('Approve article exception', err);
      toast({
        title: 'Lỗi duyệt bài viết',
        description: getErrorMessage(err) || 'Không thể duyệt bài viết. Vui lòng kiểm tra quyền admin.',
        variant: 'destructive',
      });
    }
  };

  const rejectArticle = async (articleId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', articleId);

      if (error) {
        log.error('Reject article error', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description: 'Đã từ chối bài viết',
      });

      fetchArticles();
    } catch (err: unknown) {
      log.error('Reject article exception', err);
      toast({
        title: 'Lỗi từ chối bài viết',
        description: getErrorMessage(err) || 'Không thể từ chối bài viết. Vui lòng kiểm tra quyền admin.',
        variant: 'destructive',
      });
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã xóa bài viết',
      });

      fetchArticles();
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bài viết',
        variant: 'destructive',
      });
    }
  };

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    approveArticle,
    rejectArticle,
    deleteArticle,
  };
}
