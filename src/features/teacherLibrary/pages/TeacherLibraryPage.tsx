import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen,
  FolderOpen,
  FileText,
  GraduationCap,
  Layers,
  Headphones,
  Search,
  Plus,
  ChevronLeft,
  Library,
  Upload,
  ArrowRight,
  Video,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useTeacherLibrary } from '../hooks/useTeacherLibrary';
import { LibraryContentCard } from '../components/LibraryContentCard';
import { LessonEditorDialog } from '../components/LessonEditorDialog';
import { ResourceEditorDialog } from '../components/ResourceEditorDialog';
import { AddToClassDialog } from '../components/AddToClassDialog';
import type {
  LibraryFilter,
  TeacherLesson,
  TeacherResource,
  LibraryContentType,
  ContentVisibility,
} from '../types';

const FILTER_TABS: {
  id: LibraryFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  createLabel?: string;
  createHref?: string;
  createAction?: string;
}[] = [
  {
    id: 'all',
    label: 'Tất cả',
    icon: Library,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'lesson',
    label: 'Bài giảng',
    icon: BookOpen,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-indigo-600',
    createLabel: 'Tạo bài giảng',
    createAction: 'lesson',
  },
  {
    id: 'resource',
    label: 'Tài liệu',
    icon: FolderOpen,
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
    createLabel: 'Upload tài liệu',
    createAction: 'resource',
  },
  {
    id: 'exam',
    label: 'Đề thi',
    icon: FileText,
    color: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    createLabel: 'Tạo đề thi mới',
    createHref: '/admin/exams/create',
  },
  {
    id: 'course',
    label: 'Khoá học',
    icon: GraduationCap,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-teal-500',
    createLabel: 'Tạo khoá học',
    createHref: '/admin/courses/create',
  },
  {
    id: 'flashcard',
    label: 'Flashcard',
    icon: Layers,
    color: 'text-orange-400',
    gradient: 'from-orange-400 to-amber-500',
    createLabel: 'Tạo bộ flashcard',
    createHref: '/admin/flashcards/create',
  },
  {
    id: 'podcast',
    label: 'Video / Podcast',
    icon: Headphones,
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
    createLabel: 'Tạo video / podcast',
    createHref: '/admin/podcasts/create',
  },
];

const SECTION_CONFIGS = [
  { type: 'lesson' as LibraryFilter,    label: 'Bài giảng',      icon: BookOpen,     color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/5' },
  { type: 'resource' as LibraryFilter,  label: 'Tài liệu',       icon: FolderOpen,   color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/5'  },
  { type: 'exam' as LibraryFilter,      label: 'Đề thi',          icon: FileText,     color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
  { type: 'course' as LibraryFilter,    label: 'Khoá học',        icon: GraduationCap,color: 'text-cyan-400',   border: 'border-cyan-500/30',   bg: 'bg-cyan-500/5'   },
  { type: 'flashcard' as LibraryFilter, label: 'Flashcard',       icon: Layers,       color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5' },
  { type: 'podcast' as LibraryFilter,   label: 'Video / Podcast', icon: Headphones,   color: 'text-pink-400',   border: 'border-pink-500/30',   bg: 'bg-pink-500/5'   },
];

export default function TeacherLibraryPage() {
  const { user } = useAuth();
  const { isTeacher, isAdmin, hasPermission } = usePermissionsContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    lessons,
    resources,
    exams,
    courses,
    flashcards,
    podcasts,
    myClasses,
    lessonUsageCounts,
    resourceUsageCounts,
    examUsageCounts,
    courseUsageCounts,
    flashcardUsageCounts,
    podcastUsageCounts,
    lessonCoverUrls,
    loading,
    fetchData,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonVisibility,
    createResource,
    updateResource,
    deleteResource,
    toggleResourceVisibility,
    toggleExistingContentVisibility,
    getAssignedClassIds,
    assignToClass,
  } = useTeacherLibrary(user?.id);

  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<TeacherLesson | null>(null);

  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TeacherResource | null>(null);
  const [prefillFile, setPrefillFile] = useState<File | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'lesson' | 'resource';
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addToClassTarget, setAddToClassTarget] = useState<{
    contentType: LibraryContentType;
    contentId: string;
    contentTitle: string;
  } | null>(null);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id, fetchData]);

  const itemsByType = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const match = (t: string) => !q || t.toLowerCase().includes(q);
    return {
      lesson:    lessons.filter((l) => match(l.title)).map((l) => ({ ...l, _type: 'lesson' as const })),
      resource:  resources.filter((r) => match(r.title)).map((r) => ({ ...r, _type: 'resource' as const })),
      exam:      exams.filter((e) => match(e.title)).map((e) => ({ ...e, _type: 'exam' as const })),
      course:    courses.filter((c) => match(c.title)).map((c) => ({ ...c, _type: 'course' as const })),
      flashcard: flashcards.filter((f) => match(f.title)).map((f) => ({ ...f, _type: 'flashcard' as const })),
      podcast:   podcasts.filter((p) => match(p.title)).map((p) => ({ ...p, _type: 'podcast' as const })),
    };
  }, [searchQuery, lessons, resources, exams, courses, flashcards, podcasts]);

  const counts: Record<LibraryFilter, number> = {
    all:       Object.values(itemsByType).reduce((s, a) => s + a.length, 0),
    lesson:    itemsByType.lesson.length,
    resource:  itemsByType.resource.length,
    exam:      itemsByType.exam.length,
    course:    itemsByType.course.length,
    flashcard: itemsByType.flashcard.length,
    podcast:   itemsByType.podcast.length,
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return [];
    return (itemsByType[activeFilter] as (typeof itemsByType.lesson)[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activeFilter, itemsByType]);

  const handleSaveLesson = async (data: Partial<TeacherLesson>) => {
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, data);
        toast({ title: 'Đã cập nhật bài giảng' });
      } else {
        await createLesson(data);
        toast({ title: 'Đã tạo bài giảng' });
      }
    } catch {
      toast({ title: 'Lỗi khi lưu bài giảng', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleSaveResource = async (data: Partial<TeacherResource>) => {
    try {
      if (editingResource) {
        await updateResource(editingResource.id, data);
        toast({ title: 'Đã cập nhật tài liệu' });
      } else {
        await createResource(data);
        toast({ title: 'Đã thêm tài liệu' });
      }
    } catch {
      toast({ title: 'Lỗi khi lưu tài liệu', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'lesson') {
        await deleteLesson(deleteTarget.id);
      } else {
        await deleteResource(deleteTarget.id);
      }
      toast({ title: 'Đã xoá nội dung' });
    } catch {
      toast({ title: 'Lỗi khi xoá', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAssignToClass = async (classId: string) => {
    if (!addToClassTarget) return;
    const t = addToClassTarget;
    try {
      await assignToClass(t.contentType, t.contentId, classId);
    } catch {
      toast({ title: 'Lỗi khi thêm vào lớp', variant: 'destructive' });
      throw new Error('assign failed');
    }
  };

  const handleGetAssignedClassIds = () => {
    if (!addToClassTarget) return Promise.resolve([]);
    return getAssignedClassIds(addToClassTarget.contentType, addToClassTarget.contentId);
  };

  const openCreateForTab = (tabId: LibraryFilter) => {
    if (tabId === 'lesson') {
      setEditingLesson(null);
      setLessonDialogOpen(true);
    } else if (tabId === 'resource') {
      setEditingResource(null);
      setPrefillFile(null);
      setResourceDialogOpen(true);
    }
  };

  const handleDropFile = (file: File) => {
    setEditingResource(null);
    setPrefillFile(file);
    setResourceDialogOpen(true);
    if (activeFilter !== 'resource') setActiveFilter('resource');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDropFile(file);
  };

  const renderCard = (item: (typeof itemsByType.lesson)[0]) => {
    const isLesson = item._type === 'lesson';
    const isResource = item._type === 'resource';
    const isExisting = !isLesson && !isResource;
    const lesson = isLesson ? (item as unknown as TeacherLesson & { _type: 'lesson' }) : null;
    const resource = isResource ? (item as unknown as TeacherResource & { _type: 'resource' }) : null;
    const itemVis = (item as { visibility?: ContentVisibility }).visibility;
    const editHrefMap: Partial<Record<typeof item._type, string>> = {
      exam:      `/admin/exams/${item.id}`,
      course:    `/admin/courses/${item.id}`,
      flashcard: `/admin/flashcards/${item.id}`,
      podcast:   `/admin/podcasts/${item.id}`,
    };
    const usageCountMap: Record<string, Record<string, number>> = {
      lesson:    lessonUsageCounts,
      resource:  resourceUsageCounts,
      exam:      examUsageCounts,
      course:    courseUsageCounts,
      flashcard: flashcardUsageCounts,
      podcast:   podcastUsageCounts,
    };
    const coverImageUrl = isLesson ? lessonCoverUrls[item.id] : undefined;
    const excerpt = isLesson && lesson?.content
      ? lesson.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || undefined
      : undefined;

    return (
      <LibraryContentCard
        key={`${item._type}-${item.id}`}
        id={item.id}
        contentType={item._type}
        title={item.title}
        subtitle={'subtitle' in item ? (item as { subtitle?: string }).subtitle : undefined}
        excerpt={excerpt}
        coverImageUrl={coverImageUrl}
        visibility={itemVis}
        tags={(item as { tags?: string[] }).tags}
        created_at={item.created_at}
        resourceType={resource?.type}
        usageCount={usageCountMap[item._type]?.[item.id]}
        actions={{
          onEdit: isLesson
            ? () => { setEditingLesson(lesson); setLessonDialogOpen(true); }
            : isResource
            ? () => { setEditingResource(resource); setResourceDialogOpen(true); }
            : undefined,
          editHref: editHrefMap[item._type],
          onDelete: (isLesson || isResource)
            ? () => setDeleteTarget({ type: isLesson ? 'lesson' : 'resource', id: item.id, title: item.title })
            : undefined,
          onToggleVisibility: isLesson && lesson
            ? () => toggleLessonVisibility(lesson.id, lesson.visibility)
            : isResource && resource
            ? () => toggleResourceVisibility(resource.id, resource.visibility)
            : isExisting && itemVis
            ? () => toggleExistingContentVisibility(
                item._type as Exclude<typeof item._type, 'lesson' | 'resource'>,
                item.id,
                itemVis as ContentVisibility
              )
            : undefined,
          onAddToClass: () => setAddToClassTarget({
            contentType: item._type,
            contentId: item.id,
            contentTitle: item.title,
          }),
        }}
      />
    );
  };

  const hasAccess = isTeacher || isAdmin || hasPermission('library.manage_own');
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const activeTabConfig = FILTER_TABS.find((t) => t.id === activeFilter)!;

  return (
    <div
      className="min-h-screen bg-background"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-indigo-500/10 border-2 border-dashed border-indigo-500 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-indigo-600">Thả file để upload tài liệu</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.mp4,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDropFile(file);
          e.target.value = '';
        }}
      />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/teacher">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold db-shimmer-text">Thư viện của tôi</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {counts.all} nội dung · Quản lý toàn bộ bài giảng, tài liệu và đề thi
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-2 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload file
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setEditingLesson(null);
                setLessonDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo bài giảng</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm border-indigo-600'
                    : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground border-transparent'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : tab.color)} />
                {tab.label}
                <span
                  className={cn(
                    'min-w-[1.25rem] text-center text-[11px] px-1.5 py-0 rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                  )}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung..."
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        ) : activeFilter === 'all' ? (
          /* ── "Tất cả" view: grouped by type ──────────────────── */
          <div className="space-y-8">
            {counts.all === 0 && !searchQuery ? (
              <AllEmptyState
                onCreateLesson={() => { setEditingLesson(null); setLessonDialogOpen(true); }}
                onUploadResource={() => fileInputRef.current?.click()}
              />
            ) : counts.all === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                Không tìm thấy nội dung phù hợp với "{searchQuery}"
              </div>
            ) : (
              SECTION_CONFIGS.map((section) => {
                const sectionItems = (itemsByType[section.type] as (typeof itemsByType.lesson)[])
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                if (sectionItems.length === 0) return null;
                const Icon = section.icon;
                const tabCfg = FILTER_TABS.find((t) => t.id === section.type)!;
                return (
                  <div key={section.type}>
                    {/* Section header */}
                    <div className={cn('flex items-center justify-between mb-3 px-3 py-2 rounded-lg border', section.border, section.bg)}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', section.color)} />
                        <span className="font-semibold text-sm">{section.label}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium bg-background', section.color)}>
                          {sectionItems.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tabCfg.createHref ? (
                          <Link to={tabCfg.createHref}>
                            <Button size="sm" variant="ghost" className={cn('h-7 text-xs gap-1', section.color)}>
                              <Plus className="w-3 h-3" />
                              {tabCfg.createLabel}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </Button>
                          </Link>
                        ) : tabCfg.createAction ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn('h-7 text-xs gap-1', section.color)}
                            onClick={() => openCreateForTab(section.type)}
                          >
                            <Plus className="w-3 h-3" />
                            {tabCfg.createLabel}
                          </Button>
                        ) : null}
                        <button
                          onClick={() => setActiveFilter(section.type)}
                          className={cn('flex items-center gap-1 text-xs font-medium hover:underline', section.color)}
                        >
                          Xem tất cả
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Preview: first 4 items */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sectionItems.slice(0, 4).map(renderCard)}
                      {sectionItems.length > 4 && (
                        <button
                          onClick={() => setActiveFilter(section.type)}
                          className={cn(
                            'h-full min-h-[9rem] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors',
                            section.border,
                            section.color,
                            'hover:bg-accent/50'
                          )}
                        >
                          <span className="text-2xl font-bold">+{sectionItems.length - 4}</span>
                          <span>Xem thêm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ── Single type tab view ─────────────────────────────── */
          <div>
            {/* Per-type CTA banner */}
            <TypeCreateBanner
              tabConfig={activeTabConfig}
              count={filteredItems.length}
              onCreateAction={openCreateForTab}
              onFileUpload={() => fileInputRef.current?.click()}
            />

            {filteredItems.length === 0 ? (
              <TypeEmptyState
                tabConfig={activeTabConfig}
                searchQuery={searchQuery}
                onCreateAction={openCreateForTab}
                onFileUpload={() => fileInputRef.current?.click()}
              />
            ) : (
              <>
                {/* Upload drop zone for resource tab */}
                {activeFilter === 'resource' && (
                  <div
                    className="mb-4 border-2 border-dashed border-amber-500/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-amber-500/70 hover:bg-amber-500/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Upload tài liệu</p>
                      <p className="text-xs text-muted-foreground">PDF, Word, PPT, Excel, MP3, MP4, ZIP · tối đa 50MB · hoặc kéo thả file vào đây</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto border-amber-500/40 text-amber-600 shrink-0">
                      Chọn file
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-3">
                  {filteredItems.length} nội dung{searchQuery && ` phù hợp với "${searchQuery}"`}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(renderCard)}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Lesson editor */}
      <LessonEditorDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lesson={editingLesson}
        teacherId={user?.id ?? ''}
        onSave={handleSaveLesson}
      />

      {/* Resource editor */}
      <ResourceEditorDialog
        open={resourceDialogOpen}
        onOpenChange={(open) => {
          setResourceDialogOpen(open);
          if (!open) setPrefillFile(null);
        }}
        resource={editingResource}
        teacherId={user?.id ?? ''}
        onSave={handleSaveResource}
        prefillFile={prefillFile}
      />

      {/* Add to class */}
      {addToClassTarget && (
        <AddToClassDialog
          open={!!addToClassTarget}
          onOpenChange={(open) => !open && setAddToClassTarget(null)}
          contentTitle={addToClassTarget.contentTitle}
          contentType={addToClassTarget.contentType}
          contentId={addToClassTarget.contentId}
          classes={myClasses}
          onAssign={handleAssignToClass}
          onGetAssignedClassIds={handleGetAssignedClassIds}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá nội dung?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá{' '}
              <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Helper sub-components ─────────────────────────────────── */

function AllEmptyState({
  onCreateLesson,
  onUploadResource,
}: {
  onCreateLesson: () => void;
  onUploadResource: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
        style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
      >
        <Library className="w-10 h-10 text-white" />
      </div>
      <h3 className="font-bold text-xl mb-2">Thư viện của bạn đang trống</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Bắt đầu tạo bài giảng, upload tài liệu hoặc tạo đề thi để quản lý nội dung tại một nơi.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onCreateLesson} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <BookOpen className="w-4 h-4" /> Tạo bài giảng
        </Button>
        <Button variant="outline" onClick={onUploadResource} className="gap-2">
          <Upload className="w-4 h-4" /> Upload tài liệu
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/admin/exams/create">
            <FileText className="w-4 h-4" /> Tạo đề thi
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/admin/courses/create">
            <GraduationCap className="w-4 h-4" /> Tạo khoá học
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/admin/podcasts/create">
            <Video className="w-4 h-4" /> Tạo video / podcast
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TypeCreateBanner({
  tabConfig,
  count,
  onCreateAction,
  onFileUpload,
}: {
  tabConfig: (typeof FILTER_TABS)[0];
  count: number;
  onCreateAction: (id: LibraryFilter) => void;
  onFileUpload: () => void;
}) {
  if (count > 0) return null;
  return null;
}

function TypeEmptyState({
  tabConfig,
  searchQuery,
  onCreateAction,
  onFileUpload,
}: {
  tabConfig: (typeof FILTER_TABS)[0];
  searchQuery: string;
  onCreateAction: (id: LibraryFilter) => void;
  onFileUpload: () => void;
}) {
  const Icon = tabConfig.icon;
  if (searchQuery) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không có kết quả cho "{searchQuery}"
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Upload drop zone for resource type */}
      {tabConfig.id === 'resource' && (
        <div
          className="w-full max-w-sm mb-6 border-2 border-dashed border-amber-500/40 rounded-2xl p-8 cursor-pointer hover:border-amber-500/70 hover:bg-amber-500/5 transition-colors"
          onClick={onFileUpload}
        >
          <Upload className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Kéo thả hoặc chọn file</p>
          <p className="text-xs text-muted-foreground">PDF, Word, PPT, MP3, MP4 · tối đa 50MB</p>
        </div>
      )}
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Chưa có {tabConfig.label.toLowerCase()}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-5">
        {tabConfig.id === 'resource'
          ? 'Upload file tài liệu, thêm link video hoặc URL bên ngoài cho học sinh.'
          : tabConfig.id === 'lesson'
          ? 'Tạo bài giảng với nội dung phong phú, ảnh bìa và giao cho lớp học.'
          : `Tạo ${tabConfig.label.toLowerCase()} mới và giao cho lớp học của bạn.`}
      </p>
      {tabConfig.createHref ? (
        <Button asChild className="gap-2">
          <Link to={tabConfig.createHref}>
            <Plus className="w-4 h-4" />
            {tabConfig.createLabel}
            <ExternalLink className="w-4 h-4 opacity-60" />
          </Link>
        </Button>
      ) : tabConfig.createAction ? (
        <Button
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => onCreateAction(tabConfig.id)}
        >
          <Plus className="w-4 h-4" />
          {tabConfig.createLabel}
        </Button>
      ) : null}
    </div>
  );
}
