import { 
  Brain, 
  Target, 
  BarChart3, 
  Layers, 
  Headphones, 
  Users,
  ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI Tutor thông minh",
    description: "Trợ lý AI cá nhân hóa giúp giải thích chi tiết từng câu hỏi và gợi ý phương pháp học tập hiệu quả.",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Target,
    title: "Đề thi thực tế",
    description: "Hàng ngàn đề thi được cập nhật thường xuyên từ các kỳ thi thực tế, đa dạng chuyên ngành.",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Layers,
    title: "Flashcard SRS",
    description: "Hệ thống lặp lại ngắt quãng thông minh giúp ghi nhớ kiến thức lâu dài và hiệu quả.",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: BarChart3,
    title: "Phân tích chi tiết",
    description: "Theo dõi tiến độ học tập với biểu đồ trực quan, xác định điểm yếu cần cải thiện.",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Headphones,
    title: "Podcast học tập",
    description: "Học mọi lúc mọi nơi với podcast chất lượng cao, transcript đồng bộ theo thời gian thực.",
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    icon: Users,
    title: "Lớp học trực tuyến",
    description: "Tạo và quản lý lớp học, giao bài tập và theo dõi tiến độ học viên dễ dàng.",
    color: "from-cyan-500 to-sky-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Tính năng nổi bật</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Mọi thứ bạn cần để
            <span className="text-gradient"> đạt điểm cao</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-Exam.cloud cung cấp đầy đủ công cụ học tập thông minh giúp bạn chuẩn bị tốt nhất cho mọi kỳ thi.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl p-6 lg:p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                <span className="text-sm font-semibold mr-2">Tìm hiểu thêm</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Link to="/auth">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-button gap-2 group">
              Khám phá tất cả tính năng
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
