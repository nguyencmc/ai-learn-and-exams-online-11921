import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileQuestion,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Lock,
  Globe,
  PlayCircle,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import type { QuestionSet } from '../types';

interface QuestionSetCardProps {
  set: QuestionSet;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublish?: () => void;
}

function getLevelBadge(level: string) {
  if (level === 'easy') return { label: 'Dễ', variant: 'secondary' as const };
  if (level === 'hard') return { label: 'Khó', variant: 'destructive' as const };
  return { label: 'Trung bình', variant: 'default' as const };
}

export function QuestionSetCard({
  set,
  isOwner = false,
  onEdit,
  onDelete,
  onTogglePublish,
}: QuestionSetCardProps) {
  const navigate = useNavigate();
  const levelInfo = getLevelBadge(set.level);

  return (
    <Card className="group hover:shadow-lg transition-all border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="relative p-4 pb-3 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileQuestion className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                  {set.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={levelInfo.variant} className="text-xs">
                    {levelInfo.label}
                  </Badge>
                  {isOwner &&
                    (set.is_published ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ))}
                </div>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onTogglePublish}>
                    {set.is_published ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Chuyển riêng tư
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Công khai
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 pt-2 space-y-3">
          {set.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{set.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {set.question_count} câu hỏi
            </span>
          </div>
          {set.tags && set.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {set.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {set.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{set.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => navigate(`/practice/setup/${set.id}`)}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Luyện tập
            </Button>
            <Button
              className="flex-1"
              size="sm"
              onClick={() => navigate(`/practice/exam-setup/${set.id}`)}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Thi thử
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
