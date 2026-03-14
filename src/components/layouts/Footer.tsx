import { 
  Facebook, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

const footerLinks = {
  features: [
    { name: "Đề thi thử", href: "/exams" },
    { name: "Flashcard", href: "/flashcards" },
    { name: "Khóa học", href: "/courses" },
    { name: "Podcast", href: "/podcasts" },
    { name: "Lớp học", href: "/classes" },
  ],
  support: [
    { name: "Trung tâm hỗ trợ", href: "#" },
    { name: "Câu hỏi thường gặp", href: "#" },
    { name: "Liên hệ", href: "#" },
    { name: "Báo lỗi", href: "#" },
  ],
  legal: [
    { name: "Điều khoản sử dụng", href: "#" },
    { name: "Chính sách bảo mật", href: "#" },
    { name: "Cookie", href: "#" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Youtube, href: "#", label: "Youtube" },
  { icon: Mail, href: "#", label: "Email" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-hero-pattern" />
      </div>
      
      {/* Newsletter Section */}
      <div className="border-b border-background/10 relative z-10">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-background mb-2">
                Nhận thông tin mới nhất
              </h3>
              <p className="text-background/70">
                Đăng ký để nhận tin tức và ưu đãi độc quyền từ AI-Exam.cloud
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Input 
                type="email" 
                placeholder="Email của bạn" 
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50 h-12 w-full sm:w-80"
              />
              <Button className="h-12 px-6 bg-primary hover:bg-primary/90 gap-2 group">
                Đăng ký
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <img src={logo} alt="AI-Exam.cloud" className="h-10 w-auto" width={40} height={40} />
              <span className="text-2xl font-bold text-background">
                AI-Exam.cloud
              </span>
            </Link>
            <p className="text-background/70 mb-6 leading-relaxed max-w-sm">
              Nền tảng luyện thi trực tuyến thông minh với AI, giúp việc học trở nên thú vị và hiệu quả hơn.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-background">Tính năng</h3>
            <ul className="space-y-4">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-background">Hỗ trợ</h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-background">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-background/70">Việt Nam</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-background/70">+84 123 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-background/70">support@ai-exam.cloud</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10 relative z-10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © 2025 AI-Exam.cloud. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-background/60 text-sm hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <p className="text-background/60 text-sm flex items-center gap-1">
              Được tạo với <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> tại Việt Nam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
