import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Miễn phí trọn đời cho tính năng cơ bản",
  "Không cần thẻ tín dụng",
  "Bắt đầu trong 30 giây",
];

export const CTASection = () => {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-indigo-700" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-hero-pattern" />
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">Hoàn toàn miễn phí</span>
          </div>
          
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
            Sẵn sàng chinh phục
            <br />
            mọi kỳ thi?
          </h2>
          
          {/* Description */}
          <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn học viên đang cải thiện điểm số mỗi ngày với AI-Exam.cloud.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="h-14 px-8 bg-white text-primary hover:bg-white/90 shadow-2xl gap-2 text-base font-semibold group"
              >
                Đăng ký miễn phí
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/exams">
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 border-2 border-white text-white bg-transparent hover:bg-white/10 text-base font-semibold"
              >
                Khám phá đề thi
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
