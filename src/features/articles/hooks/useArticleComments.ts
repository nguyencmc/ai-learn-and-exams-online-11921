import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArticleComment } from '../types';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const log = logger('useArticleComments');

export function useArticleComments(articleId: string | undefined) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!articleId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('article_comments')
        .select(`
          *,
          author:profiles(user_id, full_name, username, avatar_url)
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Organize comments into tree structure
      const commentsMap = new Map<string, ArticleComment>();
      const rootComments: ArticleComment[] = [];

      (data || []).forEach((comment: ArticleComment) => {
        commentsMap.set(comment.id, { ...comment, replies: [] });
      });

      commentsMap.forEach((comment) => {
        if (comment.parent_id && commentsMap.has(comment.parent_id)) {
          commentsMap.get(comment.parent_id)!.replies?.push(comment);
        } else if (!comment.parent_id) {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (err) {
      setError(err as Error);
      log.error('Error fetching comments', err);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user || !articleId) {
      toast({
        title: 'Lỗi',
        description: 'Bạn cần đăng nhập để bình luận',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã thêm bình luận',
      });

      fetchComments();
      return true;
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm bình luận',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('article_comments')
        .update({ content, is_edited: true })
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bình luận',
      });

      fetchComments();
      return true;
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật bình luận',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã xóa bình luận',
      });

      fetchComments();
      return true;
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bình luận',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    addComment,
    updateComment,
    deleteComment,
  };
}
