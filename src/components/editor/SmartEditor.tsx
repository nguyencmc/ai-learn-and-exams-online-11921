import { cn } from '@/lib/utils';
import { RichTextEditor } from './RichTextEditor';

interface SmartEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  miniMinHeight?: string;
  fullMinHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
  showImageUpload?: boolean;
  /** Start in advanced mode - deprecated, always uses full editor */
  defaultAdvanced?: boolean;
  /** Hide the toggle button - deprecated */
  hideToggle?: boolean;
  imageBucket?: string;
  imageBucketPrefix?: string;
}

/**
 * SmartEditor - A simplified wrapper around RichTextEditor
 * Previously supported switching between mini/full modes, now uses full editor only
 */
export const SmartEditor = ({
  content,
  onChange,
  placeholder = 'Nhập nội dung...',
  className,
  fullMinHeight = '200px',
  onImageUpload,
  imageBucket,
  imageBucketPrefix,
}: SmartEditorProps) => {
  return (
    <div className={cn('relative', className)}>
      <RichTextEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={fullMinHeight}
        onImageUpload={onImageUpload}
        imageBucket={imageBucket}
        imageBucketPrefix={imageBucketPrefix}
      />
    </div>
  );
};

export default SmartEditor;
