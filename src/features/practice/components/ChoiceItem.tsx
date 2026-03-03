import { cn } from '@/lib/utils';
import { Check, X, Square, CheckSquare } from 'lucide-react';
import { HtmlContent } from '@/components/ui/HtmlContent';

interface ChoiceItemProps {
  id: string;
  text: string;
  label: string;
  isSelected: boolean;
  isCorrect?: boolean | null;
  showResult: boolean;
  correctAnswer?: string;
  disabled?: boolean;
  isMultiSelect?: boolean;
  onSelect: (id: string) => void;
  onClickImage?: (src: string) => void;
}

export function ChoiceItem({
  id,
  text,
  label,
  isSelected,
  isCorrect,
  showResult,
  correctAnswer,
  disabled,
  isMultiSelect = false,
  onSelect,
  onClickImage,
}: ChoiceItemProps) {
  // Check if this specific choice is one of the correct answers
  const correctAnswers = correctAnswer?.split(',').map(s => s.trim().toUpperCase()) || [];
  const isCorrectAnswer = correctAnswers.includes(id.toUpperCase());

  const getItemStyles = () => {
    if (!showResult) {
      return isSelected
        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
        : 'border-border hover:border-primary/50 hover:bg-accent/50';
    }

    if (isCorrectAnswer) {
      return 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20';
    }

    if (isSelected && !isCorrectAnswer) {
      return 'border-red-500 bg-red-500/10 ring-2 ring-red-500/20';
    }

    return 'border-border opacity-60';
  };

  const getLabelStyles = () => {
    if (!showResult) {
      return isSelected
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground';
    }

    if (isCorrectAnswer) {
      return 'bg-green-500 text-white';
    }

    if (isSelected && !isCorrectAnswer) {
      return 'bg-red-500 text-white';
    }

    return 'bg-muted text-muted-foreground';
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(id)}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
        'text-left',
        disabled && !showResult ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        getItemStyles()
      )}
    >
      {/* Multi-select checkbox indicator */}
      {isMultiSelect && !showResult && (
        <span className="flex-shrink-0 text-muted-foreground">
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </span>
      )}
      <span
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors',
          getLabelStyles()
        )}
      >
        {label}
      </span>
      <HtmlContent html={text} className="flex-1 text-foreground [&_img]:cursor-zoom-in [&_img]:hover:opacity-80 [&_img]:transition-opacity" onClickImage={onClickImage} />
      {showResult && isCorrectAnswer && (
        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
      )}
      {showResult && isSelected && !isCorrectAnswer && (
        <X className="w-5 h-5 text-red-500 flex-shrink-0" />
      )}
    </button>
  );
}
