import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { logger } from '@/lib/logger';

const log = logger('VerifyCertificate');

interface CertificateData {
  id: string;
  certificate_number: string;
  issued_at: string;
  completion_date: string;
  course: {
    title: string;
    creator_name: string | null;
  } | null;
  profile: {
    full_name: string | null;
    username: string | null;
  } | null;
}

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const verifyCertificate = useCallback(async () => {
    setLoading(true);
    setError(false);
    
    try {
      // Fetch certificate with course info
      const { data: certData, error: certError } = await supabase
        .from("course_certificates")
        .select("*")
        .eq("certificate_number", certificateNumber)
        .maybeSingle();

      if (certError) throw certError;
      
      if (!certData) {
        setError(true);
        setLoading(false);
        return;
      }

      // Fetch course info
      const { data: courseData } = await supabase
        .from("courses")
        .select("title, creator_name")
        .eq("id", certData.course_id)
        .maybeSingle();

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", certData.user_id)
        .maybeSingle();

      setCertificate({
        ...certData,
        course: courseData,
        profile: profileData,
      });
    } catch (err) {
      log.error("Error verifying certificate", err);
      setError(true);
    }
    
    setLoading(false);
  }, [certificateNumber]);

  useEffect(() => {
    if (certificateNumber) {
      verifyCertificate();
    }
  }, [certificateNumber, verifyCertificate]);

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại trang chủ
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang xác minh chứng chỉ...</p>
          </div>
        ) : error || !certificate ? (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Không tìm thấy chứng chỉ</h1>
            <p className="text-muted-foreground mb-6">
              Mã chứng chỉ <span className="font-mono bg-muted px-2 py-1 rounded">{certificateNumber}</span> không tồn tại hoặc đã bị thu hồi.
            </p>
            <Button asChild>
              <Link to="/">Quay lại trang chủ</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Verification Status */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
                    Chứng chỉ hợp lệ
                  </h1>
                  <p className="text-green-600 dark:text-green-500">
                    Chứng chỉ này đã được xác minh bởi AI-Exam.cloud
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-card border rounded-xl p-8">
              <div className="flex items-center justify-center mb-6">
                <Award className="w-16 h-16 text-yellow-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-6">
                Chứng chỉ hoàn thành khóa học
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Người nhận</span>
                  <span className="font-semibold">
                    {certificate.profile?.full_name || certificate.profile?.username || "Học viên"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Khóa học</span>
                  <span className="font-semibold text-right max-w-xs">
                    {certificate.course?.title || "Không xác định"}
                  </span>
                </div>

                {certificate.course?.creator_name && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Giảng viên</span>
                    <span className="font-semibold">{certificate.course.creator_name}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Mã chứng chỉ</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {certificate.certificate_number}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Ngày hoàn thành</span>
                  <span className="font-semibold">
                    {format(new Date(certificate.completion_date), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground">Ngày cấp</span>
                  <span className="font-semibold">
                    {format(new Date(certificate.issued_at), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t text-center">
                <img src="/logo.png" alt="AI-Exam.cloud" className="h-12 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Được cấp bởi AI-Exam.cloud
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
</div>
  );
};

export default VerifyCertificate;
