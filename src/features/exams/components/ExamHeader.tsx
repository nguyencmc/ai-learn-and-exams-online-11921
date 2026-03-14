import { Button } from "@/components/ui/button";
import { CameraPreview } from "@/components/exam/CameraPreview";
import { Shield, HelpCircle, User } from "lucide-react";

interface ExamHeaderProps {
  title: string;
  currentIndex: number;
  totalQuestions: number;
  userEmail: string | undefined;
  proctoring: {
    cameraEnabled: boolean;
    cameraStream: MediaStream | null;
    violationCount: number;
    isProcessing: boolean;
    startCamera: () => void;
    stopCamera: () => void;
  };
}

export function ExamHeader({
  title,
  currentIndex,
  totalQuestions,
  userEmail,
  proctoring,
}: ExamHeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground hidden sm:block truncate max-w-[200px] lg:max-w-none">
              {title}
            </h1>
          </div>

          {/* Center: Question Counter */}
          <div className="text-sm text-muted-foreground">
            Câu{" "}
            <span className="font-semibold text-foreground">
              {currentIndex + 1}
            </span>{" "}
            / {totalQuestions}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Trợ giúp</span>
            </Button>

            {/* User Info with Camera Preview */}
            <div className="flex items-center gap-2">
              <CameraPreview
                cameraEnabled={proctoring.cameraEnabled}
                cameraStream={proctoring.cameraStream}
                violationCount={proctoring.violationCount}
                isProcessing={proctoring.isProcessing}
                onToggleCamera={
                  proctoring.cameraEnabled
                    ? proctoring.stopCamera
                    : proctoring.startCamera
                }
                compact
              />
              {userEmail && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {userEmail.split("@")[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
