import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePodcastProgress } from "@/features/podcasts/hooks/usePodcastProgress";
import { usePodcastBookmarks } from "@/features/podcasts/hooks/usePodcastBookmarks";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { Podcast, PodcastCategory } from "../types";
import { sampleAudioUrl, formatTime } from "../types";

export const usePodcastDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const miniPlayer = useMiniPlayer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // A-B Repeat state
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);
  const abRepeatActive = pointA !== null && pointB !== null;

  // Fetch podcast
  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Podcast | null;
    },
  });

  // Progress hook is used for its side effects (auto-save on time change)
  const { saveProgress: _saveProgress } = usePodcastProgress({
    podcastId: podcast?.id || "",
    currentTime,
    duration,
    onLoadProgress: useCallback((time: number) => {
      if (audioRef.current && time > 0) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        toast({
          title: "Tiếp tục nghe",
          description: `Tiếp tục từ ${formatTime(time)}`,
        });
      }
    }, [toast]),
  });

  const { bookmarks, addBookmark, removeBookmark } = usePodcastBookmarks(podcast?.id || "");

  // Fetch category
  const { data: category } = useQuery({
    queryKey: ["podcast-category", podcast?.category_id],
    queryFn: async () => {
      if (!podcast?.category_id) return null;
      const { data, error } = await supabase
        .from("podcast_categories")
        .select("*")
        .eq("id", podcast.category_id)
        .maybeSingle();
      if (error) throw error;
      return data as PodcastCategory | null;
    },
    enabled: !!podcast?.category_id,
  });

  // Fetch related podcasts
  const { data: relatedPodcasts } = useQuery({
    queryKey: ["related-podcasts", podcast?.category_id, podcast?.id],
    queryFn: async () => {
      if (!podcast?.category_id) return [];
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("category_id", podcast.category_id)
        .neq("id", podcast.id)
        .limit(5);
      if (error) throw error;
      return data as Podcast[];
    },
    enabled: !!podcast?.category_id,
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Handle A-B repeat
      if (abRepeatActive && pointB !== null && time >= pointB) {
        audio.currentTime = pointA!;
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isRepeat, abRepeatActive, pointA, pointB]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };

  // A-B Repeat handlers
  const handleSetPointA = () => {
    setPointA(currentTime);
    setPointB(null);
    toast({ title: "Đã đặt điểm A", description: formatTime(currentTime) });
  };

  const handleSetPointB = () => {
    if (pointA !== null && currentTime > pointA) {
      setPointB(currentTime);
      toast({ title: "A-B Repeat bật", description: `${formatTime(pointA)} → ${formatTime(currentTime)}` });
    }
  };

  const clearABRepeat = () => {
    setPointA(null);
    setPointB(null);
    toast({ title: "Đã tắt A-B Repeat" });
  };

  const toggleRepeat = () => {
    setIsRepeat(prev => !prev);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Send to mini player
  const handleSendToMiniPlayer = () => {
    if (!podcast) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);

    miniPlayer.setCurrentPodcast({
      id: podcast.id,
      title: podcast.title,
      slug: podcast.slug,
      thumbnail_url: podcast.thumbnail_url,
      audio_url: podcast.audio_url || sampleAudioUrl,
      host_name: podcast.host_name,
    });

    setTimeout(() => {
      miniPlayer.seek(currentTime);
      miniPlayer.play();
    }, 100);

    toast({ title: "Đang phát ở Mini Player" });
  };

  // Seek handlers for child components
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seekAndPlay = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return {
    // Data
    podcast,
    isLoading,
    category,
    relatedPodcasts,
    user,
    bookmarks,

    // Audio ref & state
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isRepeat,
    playbackRate,

    // UI state
    showTranscript,
    setShowTranscript,
    showBookmarks,
    setShowBookmarks,

    // A-B Repeat
    pointA,
    pointB,
    abRepeatActive,

    // Handlers
    togglePlay,
    handleSeek,
    handleVolumeChange,
    skipForward,
    skipBackward,
    toggleRepeat,
    toggleMute,
    setPlaybackRate,
    handleSetPointA,
    handleSetPointB,
    clearABRepeat,
    handleSendToMiniPlayer,
    addBookmark,
    removeBookmark,
    seekTo,
    seekAndPlay,
  };
};
