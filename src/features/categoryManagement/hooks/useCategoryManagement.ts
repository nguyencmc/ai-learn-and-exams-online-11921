import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { logger } from '@/lib/logger';
import type {
  CategoryType,
  ExamCategory,
  PodcastCategory,
  BookCategory,
  BaseCategory,
  CategoryFormData,
} from '../types';
import { DEFAULT_FORM_DATA } from '../types';

const log = logger('CategoryManagement');

export function useCategoryManagement() {
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<CategoryType>('exam');
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [podcastCategories, setPodcastCategories] = useState<PodcastCategory[]>([]);
  const [bookCategories, setBookCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BaseCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);

  const canView = hasPermission('categories.view');
  const canCreate = hasPermission('categories.create');

  useEffect(() => {
    if (!roleLoading && !canView) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền xem danh mục",
        variant: "destructive",
      });
    }
  }, [canView, roleLoading, navigate, toast]);

  const getTableName = (type: CategoryType) => {
    switch (type) {
      case 'exam': return 'exam_categories' as const;
      case 'podcast': return 'podcast_categories' as const;
      case 'book': return 'book_categories' as const;
    }
  };

  const fetchAllCategories = useCallback(async () => {
    setLoading(true);

    const [
      { data: examData },
      { data: podcastData },
      { data: bookData }
    ] = await Promise.all([
      supabase.from('exam_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('podcast_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('book_categories').select('*').order('display_order', { ascending: true }),
    ]);

    setExamCategories((examData || []) as ExamCategory[]);
    setPodcastCategories((podcastData || []) as PodcastCategory[]);
    setBookCategories((bookData || []) as BookCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canView) {
      fetchAllCategories();
    }
  }, [canView, fetchAllCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const getCurrentCategories = useCallback(() => {
    switch (activeTab) {
      case 'exam': return examCategories;
      case 'podcast': return podcastCategories;
      case 'book': return bookCategories;
    }
  }, [activeTab, examCategories, podcastCategories, bookCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ ...DEFAULT_FORM_DATA });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: BaseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon_url: category.icon_url || '',
      display_order: category.display_order || 0,
      is_featured: category.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên danh mục",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const tableName = getTableName(activeTab);
    const slug = formData.slug || generateSlug(formData.name);

    if (editingCategory) {
      const { error } = await supabase
        .from(tableName)
        .update({
          name: formData.name,
          slug,
          description: formData.description || null,
          icon_url: formData.icon_url || null,
          display_order: formData.display_order,
          is_featured: formData.is_featured,
        })
        .eq('id', editingCategory.id);

      if (error) {
        log.error('Failed to update category', error);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật danh mục",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục",
      });

      await createAuditLog(
        'update',
        `${activeTab}_category`,
        editingCategory.id,
        { name: editingCategory.name, slug: editingCategory.slug },
        { name: formData.name, slug, is_featured: formData.is_featured }
      );
    } else {
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          name: formData.name,
          slug,
          description: formData.description || null,
          icon_url: formData.icon_url || null,
          display_order: formData.display_order,
          is_featured: formData.is_featured,
        })
        .select()
        .single();

      if (error) {
        log.error('Failed to create category', error);
        toast({
          title: "Lỗi",
          description: error.message.includes('duplicate') ? "Slug đã tồn tại" : "Không thể tạo danh mục",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới",
      });

      await createAuditLog(
        'create',
        `${activeTab}_category`,
        data?.id,
        null,
        { name: formData.name, slug, is_featured: formData.is_featured }
      );
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAllCategories();
  };

  const handleDelete = async (categoryId: string) => {
    const tableName = getTableName(activeTab);
    const categoryToDelete = getCurrentCategories()?.find(c => c.id === categoryId);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', categoryId);

    if (error) {
      log.error('Failed to delete category', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa danh mục. Có thể danh mục đang được sử dụng.",
        variant: "destructive",
      });
      return;
    }

    await createAuditLog(
      'delete',
      `${activeTab}_category`,
      categoryId,
      { name: categoryToDelete?.name, slug: categoryToDelete?.slug },
      null
    );

    toast({
      title: "Thành công",
      description: "Đã xóa danh mục",
    });

    fetchAllCategories();
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    saving,
    dialogOpen,
    setDialogOpen,
    editingCategory,
    formData,
    setFormData,
    categories: getCurrentCategories(),
    examCategoryCount: examCategories.length,
    podcastCategoryCount: podcastCategories.length,
    bookCategoryCount: bookCategories.length,
    canView,
    canCreate,
    roleLoading,
    isAdmin,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleDelete,
    generateSlug,
  };
}
