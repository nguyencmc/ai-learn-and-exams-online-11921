import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

export interface PodcastBookmark {
  id: string;
  time_seconds: number;
  label: string | null;
  created_at: string;
}

export const usePodcastBookmarks = (podcastId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<PodcastBookmark[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookmarks
  useEffect(() => {
    if (!user || !podcastId) return;

    const fetchBookmarks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("podcast_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("podcast_id", podcastId)
        .order("time_seconds", { ascending: true });

      if (!error && data) {
        setBookmarks(data);
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, [user, podcastId]);

  // Add bookmark
  const addBookmark = useCallback(async (timeSeconds: number, label?: string) => {
    if (!user || !podcastId) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm bookmark",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("podcast_bookmarks")
      .insert({
        user_id: user.id,
        podcast_id: podcastId,
        time_seconds: timeSeconds,
        label: label || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm bookmark",
        variant: "destructive",
      });
      return;
    }

    setBookmarks((prev) => [...prev, data].sort((a, b) => a.time_seconds - b.time_seconds));
    toast({
      title: "Đã thêm bookmark",
      description: `Đánh dấu tại ${formatTime(timeSeconds)}`,
    });
  }, [user, podcastId, toast]);

  // Remove bookmark
  const removeBookmark = useCallback(async (bookmarkId: string) => {
    const { error } = await supabase
      .from("podcast_bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bookmark",
        variant: "destructive",
      });
      return;
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    toast({
      title: "Đã xóa bookmark",
    });
  }, [toast]);

  return { bookmarks, loading, addBookmark, removeBookmark };
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
