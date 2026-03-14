import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Star, 
  Clock, 
  PlayCircle, 
  ChevronRight,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  BookOpen,
  Code,
  Palette,
  Music,
  Camera,
  Globe,
  BarChart,
  Heart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWishlist } from "@/hooks/useWishlist";
import { WishlistButton } from "@/components/course/WishlistButton";
import PageHeader from "@/components/layouts/PageHeader";
import { logger } from '@/lib/logger';

const log = logger('Courses');

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  subcategory: string | null;
  topic: string | null;
  term_count: number | null;
  view_count: number | null;
  creator_name: string | null;
  is_official: boolean | null;
}

const categories = [
  { id: "all", name: "Tất cả", icon: Grid3X3 },
  { id: "development", name: "Phát triển", icon: Code },
  { id: "business", name: "Kinh doanh", icon: BarChart },
  { id: "design", name: "Thiết kế", icon: Palette },
  { id: "marketing", name: "Marketing", icon: TrendingUp },
  { id: "languages", name: "Ngôn ngữ", icon: Globe },
  { id: "music", name: "Âm nhạc", icon: Music },
  { id: "photography", name: "Nhiếp ảnh", icon: Camera },
];

const sortOptions = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "students", label: "Nhiều học viên" },
];

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("*")
      .order("view_count", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      log.error('Error fetching courses', error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate random rating for demo
  const getRandomRating = () => (4 + Math.random()).toFixed(1);
  const getRandomStudents = () => Math.floor(Math.random() * 50000) + 1000;
  const getRandomPrice = () => Math.floor(Math.random() * 500000) + 199000;
  const getRandomOriginalPrice = (price: number) => Math.floor(price * (1.5 + Math.random()));

  return (
    <>
      {/* Page Header with Back Button and Breadcrumb */}
      <div className="container mx-auto px-4 pt-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Khóa học" },
          ]}
          showBack={true}
          backHref="/"
        />
      </div>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="bg-yellow-500 text-black mb-4 hover:bg-yellow-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              Học mọi lúc, mọi nơi
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Mở khóa tiềm năng của bạn với{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                hàng ngàn khóa học
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-8">
              Khám phá các khóa học chất lượng cao từ các chuyên gia hàng đầu. 
              Học theo tiến độ của riêng bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm khóa học, chủ đề, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white text-gray-900 border-0 rounded-xl text-base"
                />
              </div>
              <Button size="lg" className="h-14 px-8 rounded-xl bg-purple-600 hover:bg-purple-700">
                Tìm kiếm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-gray-400 text-sm">Phổ biến:</span>
              {["Python", "React", "Data Science", "UI/UX", "Excel"].map((tag) => (
                <Badge key={tag} variant="outline" className="text-gray-300 border-gray-600 hover:bg-white/10 cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">10,000+</div>
              <div className="text-muted-foreground text-sm">Khóa học</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">500+</div>
              <div className="text-muted-foreground text-sm">Giảng viên</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">1M+</div>
              <div className="text-muted-foreground text-sm">Học viên</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">4.8</div>
              <div className="text-muted-foreground text-sm">Đánh giá trung bình</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-4 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "ghost"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 ${
                    selectedCategory === cat.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-background"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {selectedCategory === "all" ? "Tất cả khóa học" : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredCourses.length} khóa học được tìm thấy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="hidden md:flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {loading ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden animate-pulse border">
                <div className="h-40 bg-muted"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy khóa học</h3>
            <p className="text-muted-foreground">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, _index) => {
              const rating = getRandomRating();
              const students = getRandomStudents();
              const price = getRandomPrice();
              const originalPrice = getRandomOriginalPrice(price);
              
              return (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="group bg-card rounded-lg overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Course Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-primary/80 to-accent/80 overflow-hidden">
                    {course.image_url ? (
                      <img 
                        src={course.image_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      {course.is_official && (
                        <Badge className="bg-yellow-500 text-black text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Bestseller
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <WishlistButton
                        isInWishlist={isInWishlist(course.id)}
                        onToggle={() => toggleWishlist(course.id)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[48px]">
                      {course.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {course.creator_name || "AI-Exam.cloud"}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm text-amber-600">{rating}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < Math.floor(Number(rating)) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({students.toLocaleString()})
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(Math.random() * 30) + 5}h
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" />
                        {course.term_count || Math.floor(Math.random() * 100) + 20} bài
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <span className="text-lg font-bold text-foreground">
                        {price.toLocaleString()}₫
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {originalPrice.toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const rating = getRandomRating();
              const students = getRandomStudents();
              const price = getRandomPrice();
              const originalPrice = getRandomOriginalPrice(price);
              
              return (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="group flex gap-4 bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-all p-4"
                >
                  {/* Thumbnail */}
                  <div className="relative w-64 aspect-video flex-shrink-0 bg-gradient-to-br from-primary/80 to-accent/80 rounded-lg overflow-hidden">
                    {course.image_url ? (
                      <img 
                        src={course.image_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-white/80" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {course.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {course.creator_name || "AI-Exam.cloud"}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm text-amber-600">{rating}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < Math.floor(Number(rating)) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({students.toLocaleString()} học viên)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(Math.random() * 30) + 5} giờ
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" />
                        {course.term_count || Math.floor(Math.random() * 100) + 20} bài giảng
                      </span>
                      {course.is_official && (
                        <Badge className="bg-yellow-500 text-black text-xs">
                          Bestseller
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-end justify-between">
                    <button className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors">
                      <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {price.toLocaleString()}₫
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {originalPrice.toLocaleString()}₫
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {filteredCourses.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="px-8">
              Xem thêm khóa học
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </section>

      {/* Featured Categories */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Khám phá theo chủ đề
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Lập trình Web", icon: Code, courses: 1234, color: "from-blue-500 to-cyan-500" },
              { name: "Data Science", icon: BarChart, courses: 856, color: "from-purple-500 to-pink-500" },
              { name: "UI/UX Design", icon: Palette, courses: 543, color: "from-orange-500 to-red-500" },
              { name: "Digital Marketing", icon: TrendingUp, courses: 721, color: "from-green-500 to-emerald-500" },
              { name: "Ngoại ngữ", icon: Globe, courses: 432, color: "from-indigo-500 to-purple-500" },
              { name: "Nhiếp ảnh", icon: Camera, courses: 234, color: "from-pink-500 to-rose-500" },
              { name: "Âm nhạc", icon: Music, courses: 189, color: "from-amber-500 to-orange-500" },
              { name: "Kinh doanh", icon: Award, courses: 567, color: "from-teal-500 to-cyan-500" },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/courses?category=${cat.name}`}
                  className="group relative overflow-hidden rounded-xl p-6 bg-card border hover:shadow-lg transition-all"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${cat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />
                  <Icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${cat.color} text-transparent bg-clip-text`} style={{ stroke: 'currentColor' }} />
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {cat.courses} khóa học
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Bắt đầu học ngay hôm nay
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng hơn 1 triệu học viên và nâng cao kỹ năng của bạn với các khóa học chất lượng
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8">
              Khám phá khóa học
            </Button>
            {!user && (
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-8">
                Đăng ký miễn phí
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Courses;
