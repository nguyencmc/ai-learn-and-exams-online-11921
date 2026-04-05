import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, Link2, Headphones, Layers,
  X, Loader2, ExternalLink, Download, Library, EyeOff,
  GraduationCap, BookOpenCheck, Calendar, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useClassLessons,
  useClassResources,
  useClassCourseAssignments,
  useClassFlashcardAssignments,
  useClassPodcastAssignments,
  useRemoveClassLesson,
  useRemoveClassResource,
  useRemoveClassCourseAssignment,
  useRemoveClassFlashcardAssignment,
  useRemoveClassPodcastAssignment,
  ClassLesson,
} from '../hooks/useClassLibrary';

interface ClassLibraryTabProps {
  classId: string;
  isManager: boolean;
}

const resourceTypeConfig = {
  document: { icon: FileText, label: 'Tài liệu', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  video: { icon: FileText, label: 'Video', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  link: { icon: Link2, label: 'Đường dẫn', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
};

const getFileUrl = async (path: string) => {
  const { data } = await supabase.storage
    .from('class-materials')
    .createSignedUrl(path, 3600);
  return data?.signedUrl || null;
};

/* ─── Lesson Viewer Dialog ───────────────────────────────────────────────── */
interface LessonViewerProps {
  lesson: ClassLesson | null;
  onClose: () => void;
}

const LessonViewer = ({ lesson, onClose }: LessonViewerProps) => (
  <Dialog open={!!lesson} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-w-3xl w-full h-[85vh] flex flex-col p-0 gap-0">
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <DialogTitle className="text-lg font-semibold leading-snug">
          {lesson?.lesson?.title ?? 'Bài giảng'}
        </DialogTitle>
        {lesson?.due_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" />
            Hạn: {new Date(lesson.due_at).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </DialogHeader>
      <ScrollArea className="flex-1 px-6 py-4">
        {lesson?.lesson?.cover_image && (
          <img
            src={lesson.lesson.cover_image}
            alt={lesson.lesson.title}
            className="w-full h-48 object-cover rounded-xl mb-6"
          />
        )}
        {lesson?.lesson?.content ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:text-foreground
              prose-p:text-foreground/90 prose-p:leading-relaxed
              prose-a:text-primary prose-strong:text-foreground
              prose-ul:list-disc prose-ol:list-decimal
              prose-img:rounded-lg prose-img:shadow-sm
              prose-pre:bg-muted prose-pre:text-foreground
              prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: lesson.lesson.content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Bài giảng này chưa có nội dung.</p>
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

/* ─── Remove button ──────────────────────────────────────────────────────── */
const RemoveBtn = ({ onClick, isPending }: { onClick: () => void; isPending: boolean }) => (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
    onClick={onClick}
    disabled={isPending}
  >
    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
  </Button>
);

/* ─── Section wrapper ────────────────────────────────────────────────────── */
interface SectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
}
const Section = ({ title, count, icon, iconColor, children }: SectionProps) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <div className={iconColor}>{icon}</div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{count}</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {children}
    </div>
  </section>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const ClassLibraryTab = ({ classId, isManager }: ClassLibraryTabProps) => {
  const [viewingLesson, setViewingLesson] = useState<ClassLesson | null>(null);

  const { data: lessons, isLoading: loadingLessons } = useClassLessons(classId);
  const { data: resources, isLoading: loadingResources } = useClassResources(classId);
  const { data: courses, isLoading: loadingCourses } = useClassCourseAssignments(classId);
  const { data: flashcards, isLoading: loadingFlashcards } = useClassFlashcardAssignments(classId);
  const { data: podcasts, isLoading: loadingPodcasts } = useClassPodcastAssignments(classId);

  const removeLesson = useRemoveClassLesson();
  const removeResource = useRemoveClassResource();
  const removeCourse = useRemoveClassCourseAssignment();
  const removeFlashcard = useRemoveClassFlashcardAssignment();
  const removePodcast = useRemoveClassPodcastAssignment();

  const isLoading = loadingLessons || loadingResources || loadingCourses || loadingFlashcards || loadingPodcasts;

  const visibleLessons = isManager ? (lessons ?? []) : (lessons ?? []).filter(l => l.is_published);
  const visibleResources = (resources ?? []).filter(r => r.resource?.type !== 'video');
  const visibleCourses = courses ?? [];
  const visibleFlashcards = flashcards ?? [];
  const visiblePodcasts = podcasts ?? [];

  const totalItems =
    visibleLessons.length + visibleResources.length +
    visibleCourses.length + visibleFlashcards.length + visiblePodcasts.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải tài liệu...</p>
      </div>
    );
  }

  if (totalItems === 0) {
    const hasDraftLessons = !isManager && (lessons?.length ?? 0) > 0 && visibleLessons.length === 0;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <Library className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Chưa có tài liệu nào</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          {hasDraftLessons
            ? 'Giáo viên đã thêm bài giảng nhưng chưa đăng tải. Vui lòng chờ giáo viên xuất bản.'
            : isManager
              ? 'Vào Thư viện cá nhân, chọn tài liệu và nhấn "Gán vào lớp" để thêm.'
              : 'Giáo viên chưa thêm tài liệu nào. Video và Bài kiểm tra ở các tab riêng.'}
        </p>
        {isManager && (
          <Link to="/teacher/library">
            <Button variant="outline" size="sm">
              <Library className="mr-2 h-4 w-4" />
              Đi đến Thư viện của tôi
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Lesson viewer modal */}
      <LessonViewer lesson={viewingLesson} onClose={() => setViewingLesson(null)} />

      <div className="space-y-8">
        {/* Draft notice for managers */}
        {isManager && (lessons?.length ?? 0) > visibleLessons.filter(l => l.is_published).length && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
            <EyeOff className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Có bài giảng chưa đăng tải</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Học sinh chỉ thấy bài giảng đã được đánh dấu <strong>is_published = true</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Bài giảng ── */}
        {visibleLessons.length > 0 && (
          <Section
            title="Bài giảng"
            count={visibleLessons.length}
            icon={<BookOpen className="h-4 w-4" />}
            iconColor="text-blue-500"
          >
            {visibleLessons.map((item) => {
              const preview = item.lesson?.content
                ? item.lesson.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
                : null;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col rounded-xl border bg-card hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* Cover image */}
                  {item.lesson?.cover_image && (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={item.lesson.cover_image}
                        alt={item.lesson.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-snug line-clamp-2 flex-1">
                            {item.lesson?.title || 'Bài giảng'}
                          </p>
                          {isManager && !item.is_published && (
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50 shrink-0 flex items-center gap-1">
                              <EyeOff className="h-2.5 w-2.5" />
                              Chưa đăng
                            </Badge>
                          )}
                        </div>
                        {preview && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preview}…</p>
                        )}
                        {item.due_at && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Hạn: {new Date(item.due_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-1 mr-2"
                        onClick={() => setViewingLesson(item)}
                      >
                        <BookOpenCheck className="h-3.5 w-3.5" />
                        Đọc bài giảng
                      </Button>
                      {isManager && (
                        <RemoveBtn
                          onClick={() => removeLesson.mutate({ id: item.id, classId })}
                          isPending={removeLesson.isPending}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* ── Tài liệu đính kèm ── */}
        {visibleResources.length > 0 && (
          <Section
            title="Tài liệu đính kèm"
            count={visibleResources.length}
            icon={<FileText className="h-4 w-4" />}
            iconColor="text-green-500"
          >
            {visibleResources.map((item) => {
              const res = item.resource;
              const cfg = resourceTypeConfig[res?.type ?? 'link'];
              const Icon = cfg.icon;
              const hasFile = !!res?.file_path;
              const hasUrl = !!res?.url;

              return (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 p-4 rounded-xl border bg-card hover:border-green-300 hover:shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{res?.title ?? 'Tài liệu'}</p>
                    {res?.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{res.description}</p>
                    )}
                    <Badge variant="outline" className="text-[10px] mt-1.5">{cfg.label}</Badge>

                    {/* Action buttons — always visible */}
                    <div className="flex items-center gap-2 mt-3">
                      {hasUrl && (
                        <a href={res!.url!} target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Mở tài liệu
                          </Button>
                        </a>
                      )}
                      {hasFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={async () => {
                            const url = await getFileUrl(res!.file_path!);
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Tải xuống
                        </Button>
                      )}
                      {!hasUrl && !hasFile && (
                        <p className="text-xs text-muted-foreground">Không có file đính kèm</p>
                      )}
                    </div>
                  </div>

                  {isManager && (
                    <RemoveBtn
                      onClick={() => removeResource.mutate({ id: item.id, classId })}
                      isPending={removeResource.isPending}
                    />
                  )}
                </div>
              );
            })}
          </Section>
        )}

        {/* ── Khóa học ── */}
        {visibleCourses.length > 0 && (
          <Section
            title="Khóa học"
            count={visibleCourses.length}
            icon={<GraduationCap className="h-4 w-4" />}
            iconColor="text-purple-500"
          >
            {visibleCourses.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-950 shrink-0">
                  {item.course?.image_url
                    ? <img src={item.course.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="h-5 w-5 text-purple-500" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.course?.title ?? 'Khóa học'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/course/${item.course_id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1.5">
                      Học ngay
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {isManager && (
                    <RemoveBtn
                      onClick={() => removeCourse.mutate({ id: item.id, classId })}
                      isPending={removeCourse.isPending}
                    />
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── Flashcard ── */}
        {visibleFlashcards.length > 0 && (
          <Section
            title="Bộ Flashcard"
            count={visibleFlashcards.length}
            icon={<Layers className="h-4 w-4" />}
            iconColor="text-orange-500"
          >
            {visibleFlashcards.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.flashcard_set?.title ?? 'Bộ flashcard'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/flashcards/${item.flashcard_set_id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
                      Học ngay
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {isManager && (
                    <RemoveBtn
                      onClick={() => removeFlashcard.mutate({ id: item.id, classId })}
                      isPending={removeFlashcard.isPending}
                    />
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── Podcast ── */}
        {visiblePodcasts.length > 0 && (
          <Section
            title="Podcast"
            count={visiblePodcasts.length}
            icon={<Headphones className="h-4 w-4" />}
            iconColor="text-pink-500"
          >
            {visiblePodcasts.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-pink-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-950 flex items-center justify-center shrink-0">
                  <Headphones className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.podcast?.title ?? 'Podcast'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/podcast/${item.podcast_id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1.5 bg-pink-500 hover:bg-pink-600 text-white">
                      Nghe
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {isManager && (
                    <RemoveBtn
                      onClick={() => removePodcast.mutate({ id: item.id, classId })}
                      isPending={removePodcast.isPending}
                    />
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {isManager
              ? `${visibleLessons.length + visibleResources.length + visibleCourses.length + visibleFlashcards.length + visiblePodcasts.length} tài liệu trong lớp`
              : `${totalItems} tài liệu có thể học`}
          </p>
        </div>
      </div>
    </>
  );
};

export default ClassLibraryTab;
