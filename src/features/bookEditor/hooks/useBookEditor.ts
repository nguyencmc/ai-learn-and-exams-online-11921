import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { BookCategory, Chapter } from '@/features/bookEditor/types';

const log = logger('BookEditor');

export function useBookEditor() {
  const { id } = useParams();
  const isEditing = !!id;
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const coverInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Book fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [pageCount, setPageCount] = useState(0);
  const [coverUrl, setCoverUrl] = useState('');
  const [content, setContent] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const canCreate = isAdmin || hasPermission('books.create');
  const canEdit = isAdmin || hasPermission('books.edit');
  const hasAccess = isEditing ? canEdit : canCreate;

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền " + (isEditing ? "chỉnh sửa" : "tạo") + " sách",
        variant: "destructive",
      });
    }
  }, [hasAccess, roleLoading, navigate, toast, isEditing]);

  const fetchBook = useCallback(async () => {
    setLoading(true);

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !book) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy sách",
        variant: "destructive",
      });
      navigate('/admin/books');
      return;
    }

    setTitle(book.title);
    setSlug(book.slug);
    setDescription(book.description || '');
    setAuthorName(book.author_name || '');
    setCategoryId(book.category_id || '');
    setDifficulty(book.difficulty || 'intermediate');
    setPageCount(book.page_count || 0);
    setCoverUrl(book.cover_url || '');
    setContent(book.content || '');

    // Fetch chapters
    const { data: chaptersData } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', id)
      .order('chapter_order');

    if (chaptersData) {
      setChapters(chaptersData.map(ch => ({
        id: ch.id,
        title: ch.title,
        content: (ch as Record<string, unknown>).content as string || '',
        chapter_order: ch.chapter_order,
      })));
    }

    setLoading(false);
  }, [id, toast, navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('book_categories').select('id, name');
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchBook();
    }
  }, [isEditing, fetchBook]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Chỉ hỗ trợ file ảnh",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File ảnh không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `books/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(fileName);

      setCoverUrl(publicUrl);

      toast({
        title: "Thành công",
        description: "Đã upload ảnh bìa",
      });
    } catch (error: unknown) {
      log.error('Upload error', error);
      toast({
        title: "Lỗi upload",
        description: getErrorMessage(error) || "Không thể upload ảnh",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  // Chapter management
  const addChapter = () => {
    setChapters([...chapters, {
      title: `Chương ${chapters.length + 1}`,
      content: '',
      chapter_order: chapters.length + 1,
    }]);
  };

  const updateChapter = (index: number, field: keyof Chapter, value: string | number) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const removeChapter = (index: number) => {
    const updated = chapters.filter((_, i) => i !== index);
    updated.forEach((ch, i) => {
      ch.chapter_order = i + 1;
    });
    setChapters(updated);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và slug",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let bookId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('books')
          .update({
            title,
            slug,
            description: description || null,
            author_name: authorName || null,
            category_id: categoryId || null,
            difficulty,
            page_count: pageCount,
            cover_url: coverUrl || null,
            content: content || null,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data: newBook, error } = await supabase
          .from('books')
          .insert({
            title,
            slug,
            description: description || null,
            author_name: authorName || null,
            category_id: categoryId || null,
            difficulty,
            page_count: pageCount,
            cover_url: coverUrl || null,
            content: content || null,
            creator_id: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        bookId = newBook.id;
      }

      // Save chapters
      if (bookId && chapters.length > 0) {
        if (isEditing) {
          await supabase.from('book_chapters').delete().eq('book_id', bookId);
        }

        const chaptersToInsert = chapters.map((ch, idx) => ({
          book_id: bookId,
          title: ch.title,
          content: ch.content || null,
          chapter_order: idx + 1,
          position: idx * 2000,
        }));

        const { error: chaptersError } = await supabase
          .from('book_chapters')
          .insert(chaptersToInsert);

        if (chaptersError) {
          log.error('Error saving chapters', chaptersError);
        }
      }

      await createAuditLog(
        isEditing ? 'update' : 'create',
        'book',
        bookId,
        isEditing ? { title, slug } : null,
        { title, slug, author_name: authorName, page_count: pageCount }
      );

      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật sách" : "Đã tạo sách mới",
      });

      navigate('/admin/books');
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error) || "Không thể lưu sách",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    // Meta state
    isEditing,
    loading,
    saving,
    uploadingCover,
    roleLoading,
    hasAccess,
    coverInputRef,

    // Book fields
    title,
    slug,
    description,
    authorName,
    categoryId,
    difficulty,
    pageCount,
    coverUrl,
    content,
    chapters,
    categories,

    // Setters
    setSlug,
    setDescription,
    setAuthorName,
    setCategoryId,
    setDifficulty,
    setPageCount,
    setCoverUrl,
    setContent,

    // Handlers
    handleTitleChange,
    handleCoverUpload,
    addChapter,
    updateChapter,
    removeChapter,
    handleSave,
  };
}
