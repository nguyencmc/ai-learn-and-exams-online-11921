import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Star, Eye, User } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { logger } from '@/lib/logger';

const log = logger('Books');

interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  book_count: number | null;
  display_order: number | null;
  is_featured: boolean | null;
  created_at: string;
}

interface Book {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  author_name: string | null;
  cover_url: string | null;
  category_id: string | null;
  page_count: number | null;
  read_count: number | null;
  rating: number | null;
  difficulty: string | null;
  is_featured: boolean | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

const Books = () => {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("book_categories")
        .select("*")
        .order("display_order");

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch books
      let booksQuery = supabase.from("books").select("*").order("created_at", { ascending: false });

      if (selectedCategory) {
        booksQuery = booksQuery.eq("category_id", selectedCategory);
      }

      const { data: booksData } = await booksQuery;

      if (booksData) {
        setBooks(booksData);
      }
    } catch (error) {
      log.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  const getCover = (book: Book) => {
    return book.cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";
  };

  return (
    <>
      {/* Page Header */}
      <div className="container mx-auto px-4 pt-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sách" },
          ]}
          showBack={true}
          backHref="/"
        />
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            The World in Pages
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover knowledge, reach new horizons.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search book, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="h-10 px-4 rounded-md border border-border bg-background text-foreground min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Button onClick={() => fetchData()}>
              Filter
            </Button>
          </div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="py-6 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors px-4 py-2"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors px-4 py-2"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No books found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <div className="aspect-[3/4] relative">
                      <img
                        src={getCover(book)}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Rating Badge */}
                      {book.rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-white font-medium">{book.rating}</span>
                        </div>
                      )}
                      
                      {/* Hover Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3 text-white text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(book.read_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {book.page_count || 0} pages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {book.author_name || "Unknown Author"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Books;
