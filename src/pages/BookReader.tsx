import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  List,
  Home,
  Pencil,
  Headphones,
  LayoutPanelLeft,
  MoreHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PAGE_BREAK_REGEX = /(?:^|\n)(?:---|<!--\s*page\s*-->)\s*(?:\n|$)/gi;

interface Book {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  author_name: string | null;
  page_count: number | null;
}

interface Chapter {
  id: string;
  title: string;
  position: number;
  chapter_order: number;
}

interface BookmarkType {
  id: string;
  position: number;
  title: string | null;
  created_at: string;
}

interface ReadingProgress {
  id: string;
  current_position: number;
  total_time_seconds: number;
  is_completed: boolean;
}

const BookReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reading settings
  const [fontSize, _setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showContents, setShowContents] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [charsPerPage, setCharsPerPage] = useState(600);
  const [prevPage, setPrevPage] = useState(0);

  // Calculate chars per page based on viewport
  const calculateCharsPerPage = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const bookHeight = Math.min(viewportHeight - 180, 600);
    const linesPerPage = Math.floor(bookHeight / (fontSize * 1.8));
    const charsPerLine = 45; // Approximate for book width
    return Math.max(300, charsPerLine * linesPerPage * 0.75);
  }, [fontSize]);

  useEffect(() => {
    const update = () => setCharsPerPage(calculateCharsPerPage());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [calculateCharsPerPage]);

  // Fetch book
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["book-reader", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, slug, content, author_name, page_count")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Book | null;
    },
  });

  // Fetch chapters
  const { data: chapters = [] } = useQuery({
    queryKey: ["book-chapters", book?.id],
    queryFn: async () => {
      if (!book?.id) return [];
      const { data, error } = await supabase
        .from("book_chapters")
        .select("*")
        .eq("book_id", book.id)
        .order("chapter_order");
      if (error) throw error;
      return data as Chapter[];
    },
    enabled: !!book?.id,
  });

  // Fetch user's reading progress
  const { data: progress } = useQuery({
    queryKey: ["reading-progress", book?.id, user?.id],
    queryFn: async () => {
      if (!book?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from("user_book_progress")
        .select("*")
        .eq("book_id", book.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data as ReadingProgress | null;
    },
    enabled: !!book?.id && !!user?.id,
  });

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["book-bookmarks", book?.id, user?.id],
    queryFn: async () => {
      if (!book?.id || !user?.id) return [];
      const { data, error } = await supabase
        .from("book_bookmarks")
        .select("*")
        .eq("book_id", book.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BookmarkType[];
    },
    enabled: !!book?.id && !!user?.id,
  });

  // Split content into pages
  const pages = useMemo(() => {
    if (!book?.content) return [];
    const content = book.content;

    // Check for manual page breaks
    const hasManualBreaks = PAGE_BREAK_REGEX.test(content);
    PAGE_BREAK_REGEX.lastIndex = 0;

    if (hasManualBreaks) {
      const manualPages = content
        .split(PAGE_BREAK_REGEX)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (manualPages.length > 1) return manualPages;
    }

    // Auto-split by character count
    const pageList: string[] = [];
    const paragraphs = content.split(/\n\n+/);
    let currentPageContent = "";

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      if ((currentPageContent + "\n\n" + trimmed).length > charsPerPage) {
        if (currentPageContent) pageList.push(currentPageContent.trim());

        if (trimmed.length > charsPerPage) {
          const sentences = trimmed.split(/(?<=[.!?])\s+/);
          let buffer = "";
          for (const sentence of sentences) {
            if ((buffer + " " + sentence).length > charsPerPage) {
              if (buffer) pageList.push(buffer.trim());
              buffer = sentence;
            } else {
              buffer += (buffer ? " " : "") + sentence;
            }
          }
          currentPageContent = buffer;
        } else {
          currentPageContent = trimmed;
        }
      } else {
        currentPageContent += (currentPageContent ? "\n\n" : "") + trimmed;
      }
    }

    if (currentPageContent.trim()) pageList.push(currentPageContent.trim());
    return pageList;
  }, [book?.content, charsPerPage]);

  const totalPages = pages.length;

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { position: number; timeSpent: number; isCompleted?: boolean }) => {
      if (!book?.id || !user?.id) return;
      const { error } = await supabase.from("user_book_progress").upsert(
        {
          user_id: user.id,
          book_id: book.id,
          current_position: data.position,
          total_time_seconds: data.timeSpent,
          is_completed: data.isCompleted || false,
          last_read_at: new Date().toISOString(),
          ...(data.isCompleted && { completed_at: new Date().toISOString() }),
        },
        { onConflict: "user_id,book_id" }
      );
      if (error) throw error;
    },
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (page: number) => {
      if (!book?.id || !user?.id) return;
      const { error } = await supabase.from("book_bookmarks").insert({
        user_id: user.id,
        book_id: book.id,
        position: page * charsPerPage,
        title: `Trang ${page + 1}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-bookmarks", book?.id, user?.id] });
      toast.success("Đã đánh dấu trang");
    },
  });

  // Initialize from progress
  useEffect(() => {
    if (progress?.current_position && charsPerPage > 0) {
      const page = Math.floor(progress.current_position / charsPerPage);
      const initialPage = Math.min(page, Math.max(0, totalPages - 1));
      const normalizedPage = initialPage % 2 === 0 ? initialPage : initialPage - 1;
      setCurrentPage(normalizedPage);
      setPrevPage(normalizedPage);
    }
    if (progress?.total_time_seconds) {
      setReadingTime(progress.total_time_seconds);
    }
  }, [progress, totalPages, charsPerPage]);

  // Reading timer
  useEffect(() => {
    timerRef.current = setInterval(() => setReadingTime((prev) => prev + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-save progress
  useEffect(() => {
    const saveTimer = setInterval(() => {
      if (user && book) {
        saveProgressMutation.mutate({ position: currentPage * charsPerPage, timeSpent: readingTime });
      }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [currentPage, readingTime, user, book, charsPerPage, saveProgressMutation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goToNextPage(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goToPrevPage(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  // Page flip with animation
  const goToNextPage = useCallback(() => {
    if (currentPage + 2 < totalPages && !isFlipping) {
      setPrevPage(currentPage);
      setFlipDirection('right');
      setIsFlipping(true);
      // Update state immediately to show target pages in base layer
      setCurrentPage((prev) => prev + 2);

      setTimeout(() => {
        setIsFlipping(false);
      }, 900); // Wait for animation
    }
  }, [currentPage, totalPages, isFlipping]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0 && !isFlipping) {
      setPrevPage(currentPage);
      setFlipDirection('left');
      setIsFlipping(true);
      // Update state immediately to show target pages in base layer
      setCurrentPage((prev) => Math.max(0, prev - 2));

      setTimeout(() => {
        setIsFlipping(false);
      }, 900); // Wait for animation
    }
  }, [currentPage, isFlipping]);

  const goToPage = (page: number) => {
    const targetPage = page % 2 === 0 ? page : page - 1;
    setPrevPage(currentPage); // No animation for jump
    setCurrentPage(Math.min(Math.max(0, targetPage), totalPages - 1));
    setShowContents(false);
  };

  // Check if current page is bookmarked
  const currentBookmark = bookmarks.find((b) => {
    const bookmarkPage = Math.floor(b.position / charsPerPage);
    return bookmarkPage === currentPage || bookmarkPage === currentPage + 1;
  });

  const toggleBookmark = () => {
    if (currentBookmark) {
      toast.info("Đã có đánh dấu trang này");
    } else {
      addBookmarkMutation.mutate(currentPage);
    }
  };

  // Format content
  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-gray-800">{trimmed.substring(4)}</h3>;
      } else if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-bold mt-5 mb-3 text-gray-900">{trimmed.substring(3)}</h2>;
      } else if (trimmed.startsWith("# ")) {
        return <h1 key={i} className="text-xl font-bold mt-3 mb-4 text-gray-900">{trimmed.substring(2)}</h1>;
      } else if (trimmed) {
        return <p key={i} className="mb-3 text-gray-700 leading-relaxed text-justify indent-8">{trimmed}</p>;
      }
      return null;
    });
  };

  if (bookLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex flex-col items-center justify-center text-gray-600">
        <BookOpen className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">Không tìm thấy sách</p>
        <Button variant="outline" onClick={() => navigate("/books")} className="mt-4">Quay lại</Button>
      </div>
    );
  }

  // Determine what show on layers
  // Standard two-page spread: [Left, Right]

  // Logic for Next (Right -> Left flip)
  // Base Layer: Target Pages (New Left, New Right)
  // Static Overlay: Old Left Page (sits on Base Left, blocking New Left)
  // Flipping Leaf (Right):
  //    Front: Old Right Page
  //    Back: New Left Page (Wait, Base Left IS New Left. So Back of leaf should look like New Left?)
  // Actually, standard 3D book flip:
  //    Right page lifts, rotates left.
  //    Underneath it (on right side) is the NEXT Next page (or New Right).
  //    Back of flipping page is the New Left using current index.
  //    When it lands on Left side, it covers Old Left.

  // So:
  // Base Layer Left: Old Left (Wait, no).
  // Let's stick to the Plan:
  // Base Layer: [New Left, New Right] (Target state).

  // IF Flipping NEXT (2->4):
  //    Base: [4, 5]
  //    Overlay Left (Static): Page 2 (Old Left). Covers Page 4.
  //    Flipping Leaf (Right): 
  //        Front: Page 3 (Old Right). Defines transformation start.
  //        Back: Page 4 (New Left). Defines transformation end.
  //    Animation: Rotates -180deg.
  //    At start (0deg): Front (Page 3) is visible on Right. Covers Page 5.
  //    At end (-180deg): Back (Page 4) is visible on Left. Covers Overlay Left (Page 2).

  // IF Flipping PREV (2->0):
  //    Base: [0, 1]
  //    Overlay Right (Static): Page 3 (Old Right). Covers Page 1.
  //    Flipping Leaf (Left):
  //        Front: Page 2 (Old Left).
  //        Back: Page 1 (New Right).
  //    Animation: Rotates +180deg.

  const PageContent = ({ pageIndex }: { pageIndex: number }) => (
    <div className="h-full flex flex-col relative">
      {/* Floral border */}
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-200/30 via-pink-200/30 to-green-200/30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-pink-200/30 via-green-200/30 to-pink-200/30 pointer-events-none" />
      <div className={cn("absolute top-0 w-3 h-full bg-gradient-to-b from-green-200/30 via-pink-200/30 to-green-200/30 pointer-events-none", pageIndex % 2 === 0 ? "left-0" : "right-0")} />

      <div className="flex-1 px-8 py-6 overflow-hidden"
        style={{ fontSize: `${fontSize}px`, lineHeight: "1.75", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {pageIndex < totalPages ? formatContent(pages[pageIndex] || "") : (
          <div className="h-full flex items-center justify-center text-gray-400">
            {pageIndex >= totalPages && pageIndex % 2 !== 0 && <p className="text-sm">Hết nội dung</p>}
            {pageIndex >= totalPages && pageIndex % 2 === 0 && <BookOpen className="w-16 h-16 opacity-30" />}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 py-3 text-center">
        <span className="text-sm text-gray-500 font-serif">{pageIndex < totalPages ? pageIndex + 1 : ''}</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-30 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0,0 Q50,5 50,50 Q5,50 0,0" fill="none" stroke="#86efac" strokeWidth="1" />
          <circle cx="15" cy="15" r="3" fill="#86efac" />
        </svg>
      </div>

      {/* 3D Styles */}
      <style>{`
        .book-container { perspective: 2000px; }
        .book-page { backface-visibility: hidden; position: absolute; top: 0; width: 100%; height: 100%; top: 0; background-color: #fefcf3; }
        .page-front { z-index: 2; transform: rotateY(0deg); }
        .page-back { z-index: 1; transform: rotateY(180deg); }
        
        .flipping-leaf {
          position: absolute; top: 0; height: 100%; width: 50%;
          transform-style: preserve-3d;
          z-index: 50;
        }

        /* Shadow Gradients to simulate depth during flip */
        .shadow-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1));
          opacity: 0; transition: opacity 0.5s; pointer-events: none;
        }

        @keyframes flipNext {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipPrev {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }

        .animate-flip-next { animation: flipNext 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; transform-origin: left center; right: 0; }
        .animate-flip-prev { animation: flipPrev 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; transform-origin: right center; left: 0; }
      `}</style>

      {/* Book Container */}
      <div className="relative w-full max-w-4xl mx-auto px-4 book-container" style={{ height: 'calc(100vh - 160px)', maxHeight: '650px' }}>

        {/* Navigation Arrows (Outside 3D context) */}
        {!isFlipping && (
          <>
            <button onClick={goToPrevPage} disabled={currentPage === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={goToNextPage} disabled={currentPage + 2 >= totalPages} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* 3D Book Wrapper */}
        <div className="h-full flex shadow-2xl rounded-lg mx-10 relative bg-[#fefcf3]">

          {/* BASE LAYER: Display Target Pages (Current Page State) */}
          <div className="w-full h-full flex absolute top-0 left-0 z-0">
            {/* Left Base */}
            <div className="flex-1 border-r border-amber-200/50 relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%)' }}>
              <PageContent pageIndex={currentPage} />
            </div>
            {/* Right Base */}
            <div className="flex-1 border-l border-amber-200/50 relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(to left, rgba(0,0,0,0.03) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%)' }}>
              <PageContent pageIndex={currentPage + 1} />
            </div>
          </div>

          {/* STATIC OVERLAY LAYER: Covers the part of Base that shouldn't be seen yet */}
          {isFlipping && flipDirection === 'right' && (
            <div className="w-1/2 h-full absolute top-0 left-0 z-10 bg-[#fefcf3] border-r border-amber-200/50 overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%)' }}>
              {/* Shows Old Left Page (prevPage) */}
              <PageContent pageIndex={prevPage} />
            </div>
          )}
          {isFlipping && flipDirection === 'left' && (
            <div className="w-1/2 h-full absolute top-0 right-0 z-10 bg-[#fefcf3] border-l border-amber-200/50 overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(to left, rgba(0,0,0,0.03) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%)' }}>
              {/* Shows Old Right Page (prevPage + 1) */}
              <PageContent pageIndex={prevPage + 1} />
            </div>
          )}

          {/* FLIPPING LEAF (The 3D Element) */}
          {isFlipping && (
            <div className={cn(
              "flipping-leaf",
              flipDirection === 'right' ? "animate-flip-next right-0 origin-left" : "animate-flip-prev left-0 origin-right"
            )}>
              {/* Front Face of Leaf */}
              <div className="book-page page-front border-l border-r border-amber-200/50 overflow-hidden shadow-sm"
                style={{ backfaceVisibility: 'hidden' }}>
                <PageContent pageIndex={flipDirection === 'right' ? prevPage + 1 : prevPage} />
                {/* Gradient Shadow for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
              </div>

              {/* Back Face of Leaf */}
              <div className="book-page page-back border-l border-r border-amber-200/50 overflow-hidden shadow-sm"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <PageContent pageIndex={flipDirection === 'right' ? currentPage : currentPage + 1} />
                {/* Gradient Shadow for depth */}
                <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* Spine Graphic in Center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 z-40 pointer-events-none bg-gradient-to-r from-transparent via-black/10 to-transparent" />

        </div>
      </div>

      {/* Progress Slider */}
      <div className="w-full max-w-2xl mx-auto px-8 mt-4">
        <Slider
          value={[currentPage]}
          min={0}
          max={Math.max(0, totalPages - 2)}
          step={2}
          onValueChange={([value]) => { setCurrentPage(value); setPrevPage(value); }} // No anim on scroll
          className="cursor-pointer"
        />
      </div>

      {/* Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-100 z-50">
        <button onClick={() => navigate("/books")} className="w-10 h-10 rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-colors" title="Thư viện">
          <Home className="w-5 h-5" />
        </button>
        <button onClick={() => setShowContents(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors" title="Mục lục">
          <List className="w-5 h-5" />
        </button>
        <button onClick={toggleBookmark} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", currentBookmark ? "text-amber-500 bg-amber-50" : "text-orange-400 hover:bg-orange-50")} title="Đánh dấu">
          <Pencil className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors" title="Chế độ xem">
          <LayoutPanelLeft className="w-5 h-5" />
        </button>
        <button onClick={toggleBookmark} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", currentBookmark ? "text-amber-500 bg-amber-50" : "text-pink-400 hover:bg-pink-50")} title="Đánh dấu trang">
          {currentBookmark ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-purple-400 hover:bg-purple-50 transition-colors" title="Nghe audio">
          <Headphones className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors" title="Thêm">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Table of Contents Sheet */}
      <Sheet open={showContents} onOpenChange={setShowContents}>
        <SheetContent side="left" className="w-80 bg-white/95 backdrop-blur-sm">
          <SheetHeader>
            <SheetTitle className="text-gray-800 font-serif">Mục lục</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1">
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => goToPage(Math.floor(chapter.position / charsPerPage))}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center justify-between"
                >
                  <span>{chapter.title}</span>
                  <span className="text-gray-400 text-sm">{Math.floor(chapter.position / charsPerPage) + 1}</span>
                </button>
              ))
            ) : (
              pages.slice(0, 20).map((page, idx) => {
                const firstLine = page.split('\n')[0]?.replace(/^#+\s*/, '').substring(0, 40);
                if (!firstLine) return null;
                return (
                  <button
                    key={idx}
                    onClick={() => goToPage(idx)}
                    className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{firstLine}...</span>
                    <span className="text-gray-400 ml-2">{idx + 1}</span>
                  </button>
                );
              })
            )}
          </div>
          {bookmarks.length > 0 && (
            <div className="mt-8 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 px-4">Đánh dấu của bạn</h3>
              {bookmarks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  onClick={() => goToPage(Math.floor(bookmark.position / charsPerPage))}
                  className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  {bookmark.title}
                </button>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BookReader;
