import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Hải Đinh",
    role: "Sinh viên Đại học",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "Mình rất thích học trên AI-Exam.cloud. Các bài học như flashcard, bài thi thử… rất hữu ích và dễ tiếp cận. Nhờ website mà việc học trở nên thú vị và hiệu quả hơn!",
    rating: 5,
  },
  {
    name: "Trần Thị Bảo Châu",
    role: "Học sinh THPT",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "AI-Exam.cloud quả thực là một website tuyệt vời! Tôi đã học được rất nhiều điều bổ ích và thú vị tại đây. Chúc AI-Exam.cloud ngày càng phát triển!",
    rating: 5,
  },
  {
    name: "Nguyễn Văn Minh",
    role: "Nhân viên văn phòng",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "Giao diện đẹp, dễ sử dụng. Tính năng AI giải thích rất hay và giúp mình hiểu bài nhanh hơn. Đặc biệt là flashcard SRS rất hiệu quả!",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4 text-accent fill-accent" />
            <span className="text-sm font-semibold text-accent">Đánh giá từ học viên</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Được tin tưởng bởi
            <span className="text-gradient"> hàng nghìn học viên</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-Exam.cloud luôn lắng nghe và không ngừng cải thiện để mang đến trải nghiệm học tập tốt nhất.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative bg-card rounded-2xl p-6 lg:p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <Quote className="h-10 w-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-8">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-border">
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Được tin tưởng bởi học viên từ các trường hàng đầu</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['HUST', 'VNU', 'FPT', 'RMIT', 'NEU'].map((uni) => (
              <div key={uni} className="text-2xl font-bold text-muted-foreground/70 hover:text-primary transition-colors">
                {uni}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
