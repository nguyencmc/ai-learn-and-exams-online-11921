import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SyncedTranscript } from "@/components/podcast/SyncedTranscript";
import { ABRepeatControl } from "@/components/podcast/ABRepeatControl";
import { BookmarksList } from "@/components/podcast/BookmarksList";
import { TranscriptFlashcardGenerator } from "@/components/podcast/TranscriptFlashcardGenerator";
import { usePodcastProgress } from "@/features/podcasts/hooks/usePodcastProgress";
import { usePodcastBookmarks } from "@/features/podcasts/hooks/usePodcastBookmarks";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ArrowLeft,
  Headphones,
  Clock,
  User,
  Repeat,
  Heart,
  Share2,
  FileText,
  ChevronDown,
  ChevronUp,
  Gauge,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/useToast";

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  thumbnail_url: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  episode_number: number | null;
  host_name: string | null;
  listen_count: number | null;
  is_featured: boolean | null;
  difficulty: string | null;
  transcript: string | null;
}

interface PodcastCategory {
  id: string;
  name: string;
  slug: string;
}

const podcastThumbnails: Record<string, string> = {
  "toeic": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop",
  "ielts": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop",
};

// Sample audio for demo
const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const difficultyLabels: Record<string, { label: string; color: string }> = {
  beginner: { label: "Cơ bản", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  intermediate: { label: "Trung bình", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  advanced: { label: "Nâng cao", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PodcastDetail = () => {
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

  // Hooks for progress and bookmarks
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

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getThumbnail = (pod: Podcast) => {
    if (pod.thumbnail_url) return pod.thumbnail_url;
    if (pod.title.toLowerCase().includes("toeic")) return podcastThumbnails.toeic;
    if (pod.title.toLowerCase().includes("ielts")) return podcastThumbnails.ielts;
    return podcastThumbnails.default;
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

  // Send to mini player
  const handleSendToMiniPlayer = () => {
    if (!podcast) return;
    
    // Pause current
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
    
    // Seek to current time and play
    setTimeout(() => {
      miniPlayer.seek(currentTime);
      miniPlayer.play();
    }, 100);
    
    toast({ title: "Đang phát ở Mini Player" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
</div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Headphones className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy podcast</h2>
            <Link to="/podcasts">
              <Button>Quay lại danh sách</Button>
            </Link>
          </div>
        </main>
</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1">
        {/* Hero Section with Gradient */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
          <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Link to="/podcasts" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Podcast Info - Left */}
              <div className="lg:col-span-2">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Thumbnail */}
                  <div className="w-full md:w-64 flex-shrink-0">
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={getThumbnail(podcast)}
                        alt={podcast.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category && (
                        <Badge variant="secondary" className="bg-white/10 text-white border-0">
                          {category.name}
                        </Badge>
                      )}
                      {podcast.difficulty && (
                        <Badge className={difficultyLabels[podcast.difficulty]?.color || ""}>
                          {difficultyLabels[podcast.difficulty]?.label || podcast.difficulty}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-white/30 text-white">
                        Tập {podcast.episode_number}
                      </Badge>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold mb-4">
                      {podcast.title}
                    </h1>

                    <p className="text-white/70 mb-6 line-clamp-3">
                      {podcast.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{podcast.host_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(podcast.duration_seconds || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4" />
                        <span>{podcast.listen_count?.toLocaleString()} lượt nghe</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                        <Heart className="w-4 h-4 mr-2" />
                        Yêu thích
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                        <Share2 className="w-4 h-4 mr-2" />
                        Chia sẻ
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={handleSendToMiniPlayer}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Mini Player
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Audio Player */}
                <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                  <audio ref={audioRef} src={podcast.audio_url || sampleAudioUrl} />
                  
                  {/* Progress Bar */}
                  <div className="mb-4 relative">
                    {/* A-B markers */}
                    {pointA !== null && duration > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-green-500 z-10"
                        style={{ left: `${(pointA / duration) * 100}%` }}
                      />
                    )}
                    {pointB !== null && duration > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
                        style={{ left: `${(pointB / duration) * 100}%` }}
                      />
                    )}
                    {abRepeatActive && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary/30 rounded"
                        style={{
                          left: `${(pointA! / duration) * 100}%`,
                          width: `${((pointB! - pointA!) / duration) * 100}%`,
                        }}
                      />
                    )}
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRepeat(!isRepeat)}
                        className={`text-white/70 hover:text-white hover:bg-white/10 ${isRepeat ? "text-primary" : ""}`}
                      >
                        <Repeat className="w-5 h-5" />
                      </Button>
                      
                      {/* A-B Repeat Control */}
                      <ABRepeatControl
                        pointA={pointA}
                        pointB={pointB}
                        currentTime={currentTime}
                        duration={duration}
                        onSetPointA={handleSetPointA}
                        onSetPointB={handleSetPointB}
                        onClear={clearABRepeat}
                        isActive={abRepeatActive}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipBackward}
                        className="text-white hover:bg-white/10"
                      >
                        <SkipBack className="w-6 h-6" />
                      </Button>

                      <Button
                        onClick={togglePlay}
                        size="lg"
                        className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipForward}
                        className="text-white hover:bg-white/10"
                      >
                        <SkipForward className="w-6 h-6" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Playback Speed */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10 gap-1 font-medium min-w-[52px]"
                          >
                            <Gauge className="w-4 h-4" />
                            {playbackRate}x
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[120px]">
                          {playbackRates.map((rate) => (
                            <DropdownMenuItem
                              key={rate}
                              onClick={() => setPlaybackRate(rate)}
                              className={playbackRate === rate ? "bg-accent font-medium" : ""}
                            >
                              {rate}x {rate === 1 && "(Bình thường)"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Bookmark button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => addBookmark(currentTime)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        title="Thêm bookmark"
                      >
                        <Bookmark className="w-5 h-5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Bookmarks Section */}
                {user && bookmarks.length > 0 && (
                  <Collapsible open={showBookmarks} onOpenChange={setShowBookmarks} className="mt-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between text-white/70 hover:text-white hover:bg-white/10">
                        <span className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4" />
                          Bookmarks ({bookmarks.length})
                        </span>
                        {showBookmarks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 bg-white/5 backdrop-blur-sm rounded-xl p-4">
                      <BookmarksList
                        bookmarks={bookmarks}
                        currentTime={currentTime}
                        onSeek={(time) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = time;
                            setCurrentTime(time);
                          }
                        }}
                        onRemove={removeBookmark}
                        onAdd={() => addBookmark(currentTime)}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Synced Transcript Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Transcript
                    </h3>
                    <div className="flex items-center gap-2">
                      {podcast.transcript && (
                        <TranscriptFlashcardGenerator
                          transcript={podcast.transcript}
                          podcastTitle={podcast.title}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        {showTranscript ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Thu gọn
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Mở rộng
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {showTranscript && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
                      <SyncedTranscript
                        transcript={podcast.transcript}
                        currentTime={currentTime}
                        onSeek={(time) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = time;
                            setCurrentTime(time);
                            if (!isPlaying) {
                              audioRef.current.play();
                              setIsPlaying(true);
                            }
                          }
                        }}
                        duration={duration}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Related Podcasts - Right */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold mb-4">Podcast liên quan</h3>
                <div className="space-y-3">
                  {relatedPodcasts?.map((pod) => (
                    <Link
                      key={pod.id}
                      to={`/podcast/${pod.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={getThumbnail(pod)}
                          alt={pod.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
                          {pod.title}
                        </h4>
                        <p className="text-xs text-white/50 mt-1">
                          Tập {pod.episode_number} • {formatTime(pod.duration_seconds || 0)}
                        </p>
                      </div>
                    </Link>
                  ))}

                  {(!relatedPodcasts || relatedPodcasts.length === 0) && (
                    <p className="text-white/50 text-sm">Không có podcast liên quan</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
</div>
  );
};

export default PodcastDetail;
