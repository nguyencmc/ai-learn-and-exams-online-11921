import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface ExamEditorNavigationProps {
  saving: boolean;
  onSave: () => void;
}

export function ExamEditorNavigation({
  saving,
  onSave,
}: ExamEditorNavigationProps) {
  return (
    <div className="flex items-center justify-end max-w-3xl mx-auto pt-6 border-t">
      <Button onClick={onSave} disabled={saving} className="gap-2">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Lưu đề thi
          </>
        )}
      </Button>
    </div>
  );
}
