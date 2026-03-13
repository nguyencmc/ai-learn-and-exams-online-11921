import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '../types';
import { logger } from '@/lib/logger';

const log = logger('useArticle');

export function useArticle(slug: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(user_id, full_name, username, avatar_url),
          category:article_categories(*)
        `)
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;

      // Increment view count
      await supabase
        .from('articles')
        .update({ view_count: ((data.view_count as number) || 0) + 1 })
        .eq('id', data.id);

      setArticle(data as Article);
    } catch (err) {
      setError(err as Error);
      log.error('Error fetching article', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  return {
    article,
    loading,
    error,
    refetch: fetchArticle,
  };
}
