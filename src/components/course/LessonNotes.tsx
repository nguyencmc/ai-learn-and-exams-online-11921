import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('LessonNotes');
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Save, 
  Trash2, 
  Loader2,
  Clock,
  BookOpen,
  PenLine
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LessonNote {
  id: string;
  lesson_id: string;
  content: string;
  updated_at: string;
}

interface LessonNoteWithTitle extends LessonNote {
  lesson_title?: string;
}

interface LessonNotesProps {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
}

export const LessonNotes = ({ lessonId, lessonTitle, courseId }: LessonNotesProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [savedNote, setSavedNote] = useState<LessonNote | null>(null);
  const [allNotes, setAllNotes] = useState<LessonNoteWithTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');

  useEffect(() => {
    if (user && lessonId) {
      fetchNote();
    }
  }, [user, lessonId]);

  useEffect(() => {
    if (user && courseId && activeTab === 'all') {
      fetchAllNotes();
    }
  }, [user, courseId, activeTab]);

  const fetchNote = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSavedNote(data);
        setContent(data.content);
      } else {
        setSavedNote(null);
        setContent('');
      }
    } catch (error) {
      log.error('Error fetching note', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNotes = async () => {
    if (!user) return;
    
    try {
      // Fetch all notes for this course
      const { data: notesData, error: notesError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('updated_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch lesson titles for each note
      if (notesData && notesData.length > 0) {
        const lessonIds = notesData.map(n => n.lesson_id).filter(Boolean);
        const { data: lessonsData } = await supabase
          .from('course_lessons')
          .select('id, title')
          .in('id', lessonIds);

        const lessonTitleMap = new Map(lessonsData?.map(l => [l.id, l.title]) || []);
        
        const notesWithTitles: LessonNoteWithTitle[] = notesData.map(note => ({
          ...note,
          lesson_title: lessonTitleMap.get(note.lesson_id || '') || 'Bài học không xác định'
        }));

        setAllNotes(notesWithTitles);
      } else {
        setAllNotes([]);
      }
    } catch (error) {
      log.error('Error fetching all notes', error);
    }
  };

  const handleSave = useCallback(async () => {
    if (!user || !content.trim()) {
      toast.error('Vui lòng nhập nội dung ghi chú');
      return;
    }

    setSaving(true);
    try {
      if (savedNote) {
        // Update existing note
        const { error } = await supabase
          .from('lesson_notes')
          .update({ content: content.trim() })
          .eq('id', savedNote.id);

        if (error) throw error;
        
        setSavedNote({ ...savedNote, content: content.trim(), updated_at: new Date().toISOString() });
        toast.success('Đã lưu ghi chú');
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('lesson_notes')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            content: content.trim()
          })
          .select()
          .single();

        if (error) throw error;
        
        setSavedNote(data);
        toast.success('Đã lưu ghi chú');
      }
    } catch (error: unknown) {
      log.error('Error saving note', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [user, content, savedNote, lessonId, courseId]);

  const handleDelete = async () => {
    if (!savedNote) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', savedNote.id);

      if (error) throw error;

      setSavedNote(null);
      setContent('');
      toast.success('Đã xóa ghi chú');
    } catch (error: unknown) {
      log.error('Error deleting note', error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Auto-save after 3 seconds of no typing
  useEffect(() => {
    if (!user || !savedNote) return;
    
    const timer = setTimeout(() => {
      if (content.trim() && content !== savedNote.content) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, savedNote, handleSave, user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Vui lòng đăng nhập để sử dụng tính năng ghi chú</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'current' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PenLine className="w-4 h-4 inline mr-2" />
          Bài học hiện tại
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Tất cả ghi chú
        </button>
      </div>

      {activeTab === 'current' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ghi chú cho: {lessonTitle}
                </CardTitle>
                {savedNote && (
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Cập nhật: {format(new Date(savedNote.updated_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                  </CardDescription>
                )}
              </div>
              {savedNote && (
                <Badge variant="secondary" className="text-xs">
                  Đã lưu
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập ghi chú của bạn tại đây... (tự động lưu sau 3 giây)"
                  className="min-h-[200px] resize-none"
                />
                
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {content.length} ký tự
                  </p>
                  <div className="flex gap-2">
                    {savedNote && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-destructive hover:text-destructive"
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Xóa
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !content.trim()}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Lưu ngay
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'all' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Tất cả ghi chú trong khóa học
            </CardTitle>
            <CardDescription>
              {allNotes.length} ghi chú
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Bạn chưa có ghi chú nào trong khóa học này</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {allNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        note.lesson_id === lessonId 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm">{note.lesson_title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(note.updated_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                          </p>
                        </div>
                        {note.lesson_id === lessonId && (
                          <Badge variant="secondary" className="text-xs">
                            Bài hiện tại
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
