import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  FolderOpen,
  FileText,
  GraduationCap,
  Layers,
  Headphones,
  MoreVertical,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Users,
  Globe,
  Lock,
  Link2,
  Video,
  FileIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  LibraryContentType,
  ContentVisibility,
  ResourceType,
} from '../types';

export interface LibraryCardAction {
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onAddToClass?: () => void;
  editHref?: string;
}

interface LibraryContentCardProps {
  id: string;
  contentType: LibraryContentType;
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverImageUrl?: string;
  visibility?: ContentVisibility;
  tags?: string[];
  created_at: string;
  resourceType?: ResourceType;
  usageCount?: number;
  actions?: LibraryCardAction;
  className?: string;
}

const TYPE_CONFIG: Record<
  LibraryContentType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  lesson:   { label: 'Bài giảng',  icon: BookOpen,      color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
  resource: { label: 'Tài liệu',   icon: FolderOpen,    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  exam:     { label: 'Đề thi',     icon: FileText,      color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  course:   { label: 'Khoá học',   icon: GraduationCap, color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  flashcard:{ label: 'Flashcard',  icon: Layers,        color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  podcast:  { label: 'Podcast',    icon: Headphones,    color: 'text-pink-400',    bg: 'bg-pink-500/10' },
};

const RESOURCE_TYPE_ICON: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  link:     Link2,
  video:    Video,
  document: FileIcon,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function LibraryContentCard({
  contentType,
  title,
  subtitle,
  excerpt,
  coverImageUrl,
  visibility,
  tags,
  created_at,
  resourceType,
  usageCount,
  actions,
  className,
}: LibraryContentCardProps) {
  const [toggling, setToggling] = useState(false);

  const cfg = TYPE_CONFIG[contentType];
  const Icon = cfg.icon;

  const handleToggleVisibility = async () => {
    if (!actions?.onToggleVisibility) return;
    setToggling(true);
    try {
      await actions.onToggleVisibility();
    } finally {
      setToggling(false);
    }
  };

  const canToggleVisibility = !!(actions?.onToggleVisibility);
  const canEdit = !!(actions?.onEdit || actions?.editHref);
  const canDelete = !!actions?.onDelete;
  const hasMenu = canEdit || canDelete || canToggleVisibility;

  return (
    <Card
      className={cn(
        'border-border/50 hover:border-border transition-all group relative overflow-hidden',
        className
      )}
    >
      {/* Cover image for lessons */}
      {coverImageUrl && (
        <div className="w-full h-28 overflow-hidden relative">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {!coverImageUrl && (
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
              <Icon className={cn('w-5 h-5', cfg.color)} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-xs px-1.5 py-0', cfg.color, 'border-current/30')}>
                {cfg.label}
              </Badge>
              {resourceType && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                  {(() => {
                    const RIcon = RESOURCE_TYPE_ICON[resourceType];
                    return <RIcon className="w-3 h-3 mr-1 inline" />;
                  })()}
                  {resourceType === 'link' ? 'Link' : resourceType === 'video' ? 'Video' : 'File'}
                </Badge>
              )}
              {visibility && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0',
                    visibility === 'public'
                      ? 'text-emerald-400 border-emerald-400/30'
                      : 'text-muted-foreground border-border/50'
                  )}
                >
                  {visibility === 'public' ? (
                    <Globe className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1 inline" />
                  )}
                  {visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mt-1 leading-snug line-clamp-2">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
            )}
            {excerpt && !subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{excerpt}</p>
            )}
          </div>

          {/* Overflow menu */}
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (actions?.editHref) {
                        window.location.href = actions.editHref;
                      } else {
                        actions?.onEdit?.();
                      }
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                {canToggleVisibility && (
                  <DropdownMenuItem onClick={handleToggleVisibility} disabled={toggling}>
                    {visibility === 'public' ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Đặt riêng tư
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Đặt công khai
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {actions?.onAddToClass && (
                  <DropdownMenuItem onClick={actions.onAddToClass}>
                    <Users className="w-4 h-4 mr-2" />
                    Thêm vào lớp
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={actions.onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xoá
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{formatDate(created_at)}</span>
            {typeof usageCount === 'number' && usageCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                {usageCount} lớp
              </span>
            )}
          </div>
          {actions?.onAddToClass && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-muted-foreground hover:text-indigo-400 px-2"
              onClick={actions.onAddToClass}
            >
              <Users className="w-3 h-3" />
              Thêm vào lớp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
