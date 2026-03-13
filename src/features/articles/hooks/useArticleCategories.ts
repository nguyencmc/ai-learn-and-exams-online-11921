import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArticleCategory } from '../types';
import { logger } from '@/lib/logger';

const log = logger('useArticleCategories');

export function useArticleCategories() {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('article_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories((data as ArticleCategory[]) || []);
    } catch (err) {
      setError(err as Error);
      log.error('Error fetching article categories', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
