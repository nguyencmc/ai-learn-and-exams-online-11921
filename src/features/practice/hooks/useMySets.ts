import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuestionSet } from '../types';

export function useMySets() {
  const { user } = useAuth();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMySets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('creator_id', user?.id)
      .order('created_at', { ascending: false });
    if (!error && data) setSets(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMySets();
  }, [user, fetchMySets]);

  const filteredSets = useMemo(
    () =>
      sets.filter((s) => {
        const matchSearch =
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchLevel = levelFilter === 'all' || s.level === levelFilter;
        return matchSearch && matchLevel;
      }),
    [sets, searchQuery, levelFilter],
  );

  const togglePublish = async (set: QuestionSet) => {
    const newStatus = !set.is_published;
    const { error } = await supabase
      .from('question_sets')
      .update({ is_published: newStatus })
      .eq('id', set.id);
    if (error) {
      toast.error('Không thể cập nhật trạng thái');
      return;
    }
    setSets((prev) => prev.map((s) => (s.id === set.id ? { ...s, is_published: newStatus } : s)));
    toast.success(newStatus ? 'Đã công khai bộ đề' : 'Đã chuyển riêng tư');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('practice_questions').delete().eq('set_id', deleteId);
    const { error } = await supabase.from('question_sets').delete().eq('id', deleteId);
    if (error) {
      toast.error('Không thể xóa bộ đề');
    } else {
      toast.success('Đã xóa bộ đề');
      setSets((prev) => prev.filter((s) => s.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  };

  return {
    user,
    sets,
    loading,
    filteredSets,
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    deleteId,
    setDeleteId,
    deleting,
    togglePublish,
    handleDelete,
  };
}
