import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Headphones, 
  Clock,
  List,
  Music,
  Briefcase,
  Globe,
  BookOpen,
  Flame
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/layouts/PageHeader";

interface PodcastCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  podcast_count: number | null;
  is_featured: boolean | null;
}

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  episode_number: number | null;
  host_name: string | null;
  listen_count: number | null;
  is_featured: boolean | null;
  difficulty: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "toeic-listening": <Headphones className="w-4 h-4" />,
  "ielts-listening": <BookOpen className="w-4 h-4" />,
  "english-conversations": <Globe className="w-4 h-4" />,
  "business-english": <Briefcase className="w-4 h-4" />,
  "music": <Music className="w-4 h-4" />,
};

const podcastThumbnails: Record<string, string> = {
  "toeic": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop",
  "ielts": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=200&fit=crop",
  "default": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&h=200&fit=crop",
};

const Podcasts = () => {
  const [categories, setCategories] = useState<PodcastCategory[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [language, setLanguage] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("podcast_categories")
      .select("*")
      .order("display_order", { ascending: true });
    
    setCategories(categoriesData || []);

    // Fetch podcasts
    let podcastQuery = supabase.from("podcasts").select("*");

    if (selectedCategory !== "all") {
      const category = categoriesData?.find(c => c.slug === selectedCategory);
      if (category) {
        podcastQuery = podcastQuery.eq("category_id", category.id);
      }
    }

    podcastQuery = podcastQuery.order("listen_count", { ascending: false });

    const { data: podcastsData } = await podcastQuery;
    setPodcasts(podcastsData || []);
    
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPodcasts = podcasts.filter((pod) =>
    pod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pod.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getThumbnail = (podcast: Podcast) => {
    if (podcast.thumbnail_url) return podcast.thumbnail_url;
    if (podcast.title.toLowerCase().includes("toeic")) return podcastThumbnails.toeic;
    if (podcast.title.toLowerCase().includes("ielts")) return podcastThumbnails.ielts;
    return podcastThumbnails.default;
  };

  const featuredPodcast = filteredPodcasts.find(p => p.is_featured) || filteredPodcasts[0];
  const otherPodcasts = filteredPodcasts.filter(p => p.id !== featuredPodcast?.id);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Podcast" },
          ]}
          showBack={true}
          backHref="/"
          className="mb-6"
        />
        {/* Filter by Category */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="gap-2 rounded-full"
            >
              <List className="w-4 h-4" />
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
                className="gap-2 rounded-full"
              >
                {categoryIcons[cat.slug] || <Headphones className="w-4 h-4" />}
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Search and Language Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search dictation by name, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-border"
            />
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">English</SelectItem>
              <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Most Popular Listenings */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Most Popular Listenings</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="aspect-square bg-slate-700 rounded-2xl animate-pulse"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPodcasts.length === 0 ? (
            <div className="text-center py-16">
              <Headphones className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg">
                Không tìm thấy podcast nào
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Featured Podcast - Left Side */}
              {featuredPodcast && (
                <Link
                  to={`/podcast/${featuredPodcast.slug}`}
                  className="block group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
                    <img
                      src={getThumbnail(featuredPodcast)}
                      alt={featuredPodcast.title}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                        {featuredPodcast.title}
                      </h3>
                      <p className="text-white/70 text-sm line-clamp-2 mb-3">
                        {featuredPodcast.description}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(featuredPodcast.duration_seconds)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Headphones className="w-4 h-4" />
                          <span>{formatNumber(featuredPodcast.listen_count)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Podcast List - Right Side */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {otherPodcasts.map((podcast) => (
                  <Link
                    key={podcast.id}
                    to={`/podcast/${podcast.slug}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-700">
                      <img
                        src={getThumbnail(podcast)}
                        alt={podcast.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {podcast.title}
                      </h3>
                      <p className="text-slate-400 text-xs md:text-sm line-clamp-1 mt-1">
                        {podcast.description}
                      </p>
                    </div>

                    {/* Listen Count */}
                    <div className="flex items-center gap-1 text-slate-400 text-sm flex-shrink-0">
                      <Headphones className="w-4 h-4" />
                      <span>{formatNumber(podcast.listen_count)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
};

export default Podcasts;
