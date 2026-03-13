import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useArticles, useArticleCategories } from '../hooks';
import { ArticleCard, ArticleSidebar } from '../components';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  LayoutGrid,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ArticlesListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { articles, loading } = useArticles({
    status: 'approved',
    searchQuery,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const { categories } = useArticleCategories();

  // Separate featured and regular articles
  const featuredArticles = useMemo(() =>
    articles.filter(a => a.is_featured === true).slice(0, 5),
    [articles]
  );

  const regularArticles = useMemo(() =>
    articles.filter(a => !a.is_featured),
    [articles]
  );

  // Get popular tags from articles
  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    articles.forEach(article => {
      article.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [articles]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Bài viết' },
          ]}
          backHref="/"
        />

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                Bài viết chia sẻ
              </h1>
              <p className="text-muted-foreground mt-1">
                Khám phá các bài viết hay từ cộng đồng
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/articles/my')}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Bài viết của tôi
                  </Button>
                  <Button onClick={() => navigate('/articles/create')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Viết bài mới
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Tất cả
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Main Content - 2 Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Articles Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid'
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              )}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : regularArticles.length === 0 && featuredArticles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chưa có bài viết nào</h3>
                <p className="text-muted-foreground mb-4">
                  Hãy là người đầu tiên chia sẻ kiến thức!
                </p>
                {user && (
                  <Button onClick={() => navigate('/articles/create')}>
                    Viết bài đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Articles Grid */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedCategory === 'all' ? 'Bài viết mới nhất' : 'Kết quả'}
                  </h2>
                  <div className={cn(
                    "grid gap-6",
                    viewMode === 'grid'
                      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}>
                    {[...featuredArticles, ...regularArticles].map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>

          {/* Sidebar */}
          <ArticleSidebar
            featuredArticles={featuredArticles}
            popularTags={popularTags}
            categories={categories}
            className="w-full lg:w-80 shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

export default ArticlesListPage;
