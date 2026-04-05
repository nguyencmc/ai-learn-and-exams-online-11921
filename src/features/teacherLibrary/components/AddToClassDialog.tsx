import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, Loader2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassOption, LibraryContentType } from '../types';

interface AddToClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentTitle: string;
  contentType: LibraryContentType;
  contentId: string;
  classes: ClassOption[];
  onAssign: (classId: string) => Promise<void>;
  onGetAssignedClassIds?: () => Promise<string[]>;
}

const TYPE_LABEL: Record<LibraryContentType, string> = {
  lesson:    'bài giảng',
  resource:  'tài liệu',
  exam:      'đề thi',
  course:    'khoá học',
  flashcard: 'flashcard',
  podcast:   'podcast',
};

export function AddToClassDialog({
  open,
  onOpenChange,
  contentTitle,
  contentType,
  classes,
  onAssign,
  onGetAssignedClassIds,
}: AddToClassDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [assignedClassIds, setAssignedClassIds] = useState<Set<string>>(new Set());

  const loadExisting = useCallback(async () => {
    if (!onGetAssignedClassIds) return;
    setLoadingExisting(true);
    try {
      const ids = await onGetAssignedClassIds();
      setAssignedClassIds(new Set(ids));
    } catch {
      /* ignore */
    } finally {
      setLoadingExisting(false);
    }
  }, [onGetAssignedClassIds]);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      return;
    }
    loadExisting();
  }, [open, loadExisting]);

  const toggleClass = (classId: string) => {
    if (assignedClassIds.has(classId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const available = classes.filter((c) => !assignedClassIds.has(c.id)).map((c) => c.id);
    setSelectedIds(new Set(available));
  };

  const clearAll = () => setSelectedIds(new Set());

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setAssigning(true);
    const toAssign = Array.from(selectedIds);
    const errors: string[] = [];
    for (const classId of toAssign) {
      try {
        await onAssign(classId);
        setAssignedClassIds((prev) => new Set([...prev, classId]));
      } catch {
        errors.push(classId);
      }
    }
    setSelectedIds(new Set(errors));
    setAssigning(false);
  };

  const availableClasses = classes.filter((c) => !assignedClassIds.has(c.id));
  const allAvailableSelected = availableClasses.length > 0 && availableClasses.every((c) => selectedIds.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Thêm vào lớp học
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chọn lớp học để chia sẻ {TYPE_LABEL[contentType]}{' '}
            <span className="font-medium text-foreground">"{contentTitle}"</span>
          </p>

          {classes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Bạn chưa có lớp học nào đang hoạt động.
            </div>
          ) : loadingExisting ? (
            <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : (
            <>
              {/* Select all / Clear controls */}
              {availableClasses.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={allAvailableSelected ? clearAll : selectAll}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {allAvailableSelected
                      ? <CheckSquare className="w-3.5 h-3.5" />
                      : <Square className="w-3.5 h-3.5" />}
                    {allAvailableSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {selectedIds.size} lớp được chọn
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {classes.map((cls) => {
                  const isAlreadyAssigned = assignedClassIds.has(cls.id);
                  const isSelected = selectedIds.has(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      disabled={isAlreadyAssigned}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        isAlreadyAssigned
                          ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60 cursor-default'
                          : isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-border/50 hover:border-border hover:bg-accent/30'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          isAlreadyAssigned
                            ? 'bg-emerald-500/20'
                            : isSelected
                            ? 'bg-indigo-500/20'
                            : 'bg-muted/50'
                        )}
                      >
                        {isAlreadyAssigned ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Users className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cls.title}</p>
                        <p className="text-xs text-muted-foreground">{cls.class_code}</p>
                      </div>
                      {isAlreadyAssigned && (
                        <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30 flex-shrink-0">
                          Đã thêm
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {classes.length > 0 && !loadingExisting && (
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || assigning}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : selectedIds.size > 0
                ? `Thêm vào ${selectedIds.size} lớp`
                : 'Thêm vào lớp'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
