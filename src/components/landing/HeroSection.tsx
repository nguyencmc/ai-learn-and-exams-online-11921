import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, CheckCircle2, Users, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";
import heroLaptop from "@/assets/hero-laptop.png";

const stats = [
  { icon: Users, value: "10,000+", label: "Học viên" },
  { icon: BookOpen, value: "500+", label: "Bài thi" },
  { icon: Award, value: "98%", label: "Hài lòng" },
];

const features = [
  "Luyện thi với AI thông minh",
  "Đề thi đa dạng các chuyên ngành",
  "Flashcard học từ vựng hiệu quả",
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-secondary/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-2xl animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Nền tảng luyện thi #1 Việt Nam</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
              <span className="text-foreground">Luyện thi</span>
              <br />
              <span className="text-gradient">thông minh</span>
              <br />
              <span className="text-foreground">với AI</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
              AI-Exam.cloud giúp bạn chuẩn bị cho mọi kỳ thi với hệ thống đề thi đa dạng, flashcard thông minh và phân tích kết quả chi tiết bằng AI.
            </p>
            
            {/* Feature List */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-button hover:shadow-lg transition-all duration-300 gap-2 group">
                  Bắt đầu miễn phí
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold gap-2 group border-2">
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Xem demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative lg:pl-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl scale-95" />
            
            {/* Main Image Container */}
            <div className="relative">
              {/* Decorative Frame */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl opacity-50" />
              
              <div className="relative bg-gradient-to-br from-card to-secondary/50 rounded-2xl p-4 shadow-2xl border border-border/50 backdrop-blur-sm">
                <img
                  src={heroLaptop}
                  alt="AI-Exam.cloud Platform"
                  className="w-full max-w-2xl mx-auto rounded-lg drop-shadow-lg"
                  width={1024}
                  height={768}
                  fetchPriority="high"
                />
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -left-6 top-1/4 bg-card rounded-xl p-4 shadow-xl border border-border/50 animate-float hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Điểm cao</p>
                  <p className="text-xs text-muted-foreground">+25% cải thiện</p>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-1/4 bg-card rounded-xl p-4 shadow-xl border border-border/50 animate-float hidden lg:flex items-center gap-3" style={{ animationDelay: '1.5s' }}>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Tutor</p>
                  <p className="text-xs text-muted-foreground">Hỗ trợ 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
