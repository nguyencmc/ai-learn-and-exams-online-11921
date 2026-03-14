import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsePodcastProgressOptions {
  podcastId: string;
  currentTime: number;
  duration: number;
  onLoadProgress?: (time: number) => void;
}

export const usePodcastProgress = ({
  podcastId,
  currentTime,
  duration,
  onLoadProgress,
}: UsePodcastProgressOptions) => {
  const { user } = useAuth();
  const lastSavedTime = useRef<number>(0);
  const hasLoadedProgress = useRef(false);

  // Load saved progress when component mounts
  useEffect(() => {
    if (!user || !podcastId || hasLoadedProgress.current) return;

    const loadProgress = async () => {
      const { data } = await supabase
        .from("user_podcast_progress")
        .select("current_time_seconds")
        .eq("user_id", user.id)
        .eq("podcast_id", podcastId)
        .maybeSingle();

      if (data && data.current_time_seconds > 0) {
        hasLoadedProgress.current = true;
        onLoadProgress?.(Number(data.current_time_seconds));
      }
    };

    loadProgress();
  }, [user, podcastId, onLoadProgress]);

  // Save progress periodically (every 5 seconds of playback change)
  const saveProgress = useCallback(async () => {
    if (!user || !podcastId) return;
    if (Math.abs(currentTime - lastSavedTime.current) < 5) return;
    
    lastSavedTime.current = currentTime;
    const completed = duration > 0 && currentTime >= duration - 5;

    await supabase
      .from("user_podcast_progress")
      .upsert({
        user_id: user.id,
        podcast_id: podcastId,
        current_time_seconds: currentTime,
        completed,
        last_played_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,podcast_id",
      });
  }, [user, podcastId, currentTime, duration]);

  // Save on time change
  useEffect(() => {
    if (currentTime > 0) {
      saveProgress();
    }
  }, [currentTime, saveProgress]);

  return { saveProgress };
};
