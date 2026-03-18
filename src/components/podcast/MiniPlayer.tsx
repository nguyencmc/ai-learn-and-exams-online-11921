import { Link } from "react-router-dom";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  Gauge,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

const podcastThumbnails: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop",
};

export const MiniPlayer = () => {
  const {
    currentPodcast,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    closeMiniPlayer,
  } = useMiniPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!currentPodcast) return null;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const thumbnail = currentPodcast.thumbnail_url || podcastThumbnails.default;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const skipForward = () => seek(Math.min(currentTime + 10, duration));
  const skipBackward = () => seek(Math.max(currentTime - 10, 0));

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.7);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 transition-all duration-300",
        expanded ? "h-32" : "h-20"
      )}
    >
      {/* Progress bar on top */}
      <div
        className="absolute top-0 left-0 h-1 bg-primary transition-all duration-200"
        style={{ width: `${progress}%` }}
      />

      <div className="container mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Podcast Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to={`/podcast/${currentPodcast.slug}`}>
              <img
                src={thumbnail}
                alt={currentPodcast.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="min-w-0">
              <Link
                to={`/podcast/${currentPodcast.slug}`}
                className="font-medium text-sm truncate block hover:text-primary transition-colors"
              >
                {currentPodcast.title}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                {currentPodcast.host_name || "Podcast"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="hidden sm:flex h-8 w-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="hidden sm:flex h-8 w-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time & Extra controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Speed control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex h-8 px-2 gap-1">
                  <Gauge className="w-3 h-3" />
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {playbackRates.map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={playbackRate === rate ? "bg-accent" : ""}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8" aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8"
              aria-label={expanded ? 'Thu gọn trình phát' : 'Mở rộng trình phát'}
            >
              <ChevronUp className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMiniPlayer}
              className="h-8 w-8"
              aria-label="Đóng trình phát mini"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded view - Seek bar */}
        {expanded && (
          <div className="px-4 pb-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(value) => seek(value[0])}
              className="cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
