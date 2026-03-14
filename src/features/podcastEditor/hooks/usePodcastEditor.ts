import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { PodcastCategory } from '@/features/podcastEditor/types';

const log = logger('usePodcastEditor');

export function usePodcastEditor() {
  const { id } = useParams();
  const isEditing = !!id;
  const { hasPermission, loading: roleLoading } = usePermissionsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<PodcastCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);

  // Podcast fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [hostName, setHostName] = useState('AI-Exam.cloud');
  const [episodeNumber, setEpisodeNumber] = useState(1);

  const canCreate = hasPermission('podcasts.create');
  const canEdit = hasPermission('podcasts.edit');
  const hasAccess = isEditing ? (canEdit || hasPermission('podcasts.edit_own')) : canCreate;

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, roleLoading, navigate]);

  const fetchPodcast = useCallback(async () => {
    setLoading(true);

    const { data: podcast, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !podcast) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy podcast",
        variant: "destructive",
      });
      navigate('/admin/podcasts');
      return;
    }

    setTitle(podcast.title);
    setSlug(podcast.slug);
    setDescription(podcast.description || '');
    setCategoryId(podcast.category_id || '');
    setDifficulty(podcast.difficulty || 'intermediate');
    setAudioUrl(podcast.audio_url || '');
    setThumbnailUrl(podcast.thumbnail_url || '');
    setTranscript(podcast.transcript || '');
    setHostName(podcast.host_name || 'AI-Exam.cloud');
    setEpisodeNumber(podcast.episode_number || 1);

    const totalSeconds = podcast.duration_seconds || 0;
    setDurationMinutes(Math.floor(totalSeconds / 60));
    setDurationSeconds(totalSeconds % 60);

    setLoading(false);
  }, [id, toast, navigate]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPodcast();
    }
  }, [isEditing, fetchPodcast]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('podcast_categories').select('id, name');
    setCategories(data || []);
  };

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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      toast({
        title: "Lỗi",
        description: "Chỉ hỗ trợ file audio (MP3, WAV, OGG, M4A, AAC)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File audio không được vượt quá 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAudio(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `podcasts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('podcast-audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('podcast-audio')
        .getPublicUrl(filePath);

      setAudioUrl(publicUrl);

      // Try to get audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        const totalSeconds = Math.floor(audio.duration);
        setDurationMinutes(Math.floor(totalSeconds / 60));
        setDurationSeconds(totalSeconds % 60);
        URL.revokeObjectURL(audio.src);
      };

      toast({
        title: "Thành công",
        description: "Đã upload file audio",
      });
    } catch (error: unknown) {
      log.error('Upload error', error);
      toast({
        title: "Lỗi upload",
        description: getErrorMessage(error) || "Không thể upload file audio",
        variant: "destructive",
      });
    } finally {
      setUploadingAudio(false);
      setUploadProgress(0);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  const handleGenerateTranscript = async () => {
    if (!audioUrl) {
      toast({
        title: "Lỗi",
        description: "Vui lòng upload file audio trước khi tạo transcript",
        variant: "destructive",
      });
      return;
    }

    setGeneratingTranscript(true);

    try {
      const totalDurationSeconds = durationMinutes * 60 + durationSeconds;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audioUrl,
            duration: totalDurationSeconds
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Đã vượt quá giới hạn request. Vui lòng thử lại sau.');
        }
        if (response.status === 402) {
          throw new Error('Cần nạp thêm credits để sử dụng tính năng này.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo transcript');
      }

      const data = await response.json();

      if (data.transcript) {
        setTranscript(data.transcript);
        toast({
          title: "Thành công",
          description: `Đã tạo transcript với ${data.lineCount || 0} dòng timestamps`,
        });
      } else {
        throw new Error('Không nhận được transcript từ AI');
      }
    } catch (error: unknown) {
      log.error('Transcript generation error', error);
      toast({
        title: "Lỗi tạo transcript",
        description: getErrorMessage(error) || "Không thể tạo transcript tự động",
        variant: "destructive",
      });
    } finally {
      setGeneratingTranscript(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingThumbnail(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnails/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('podcast-audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('podcast-audio')
        .getPublicUrl(fileName);

      setThumbnailUrl(publicUrl);

      toast({
        title: "Thành công",
        description: "Đã upload thumbnail",
      });
    } catch (error: unknown) {
      log.error('Upload error', error);
      toast({
        title: "Lỗi upload",
        description: getErrorMessage(error) || "Không thể upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
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

    const totalDurationSeconds = (durationMinutes * 60) + durationSeconds;

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('podcasts')
          .update({
            title,
            slug,
            description: description || null,
            category_id: categoryId || null,
            difficulty,
            duration_seconds: totalDurationSeconds,
            audio_url: audioUrl || null,
            thumbnail_url: thumbnailUrl || null,
            transcript: transcript || null,
            host_name: hostName,
            episode_number: episodeNumber,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('podcasts')
          .insert({
            title,
            slug,
            description: description || null,
            category_id: categoryId || null,
            difficulty,
            duration_seconds: totalDurationSeconds,
            audio_url: audioUrl || null,
            thumbnail_url: thumbnailUrl || null,
            transcript: transcript || null,
            host_name: hostName,
            episode_number: episodeNumber,
            creator_id: user?.id,
          });

        if (error) throw error;
      }

      await createAuditLog(
        isEditing ? 'update' : 'create',
        'podcast',
        id,
        isEditing ? { title, slug } : null,
        { title, slug, difficulty, duration_seconds: (durationMinutes * 60) + durationSeconds }
      );

      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật podcast" : "Đã tạo podcast mới",
      });

      navigate('/admin/podcasts');
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error) || "Không thể lưu podcast",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    // Common state
    isEditing,
    hasAccess,
    roleLoading,
    loading,
    saving,
    handleSave,

    // Basic info
    title,
    slug,
    description,
    categoryId,
    difficulty,
    hostName,
    episodeNumber,
    durationMinutes,
    durationSeconds,
    categories,
    handleTitleChange,
    setSlug,
    setDescription,
    setCategoryId,
    setDifficulty,
    setHostName,
    setEpisodeNumber,
    setDurationMinutes,
    setDurationSeconds,

    // Media
    audioUrl,
    thumbnailUrl,
    uploadingAudio,
    uploadingThumbnail,
    uploadProgress,
    audioInputRef,
    thumbnailInputRef,
    handleAudioUpload,
    handleThumbnailUpload,
    setAudioUrl,
    setThumbnailUrl,

    // Transcript
    transcript,
    generatingTranscript,
    handleGenerateTranscript,
    setTranscript,
  };
}
