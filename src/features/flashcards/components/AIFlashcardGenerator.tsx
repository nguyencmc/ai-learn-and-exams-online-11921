import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Loader2, 
  Check, 
  X,
  Plus,
  Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('AIFlashcardGenerator');

interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
  selected?: boolean;
}

interface AIFlashcardGeneratorProps {
  onCardsGenerated: (cards: { front: string; back: string; hint?: string }[]) => void;
  onClose: () => void;
}

export function AIFlashcardGenerator({ onCardsGenerated, onClose }: AIFlashcardGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'topic' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Check file type
    const allowedTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
    const isTextFile = allowedTypes.includes(file.type) || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.md') ||
                       file.name.endsWith('.json') ||
                       file.name.endsWith('.csv');

    if (!isTextFile) {
      toast.error('Chỉ hỗ trợ file text (.txt, .md, .json, .csv)');
      return;
    }

    try {
      const content = await file.text();
      if (content.length > 50000) {
        toast.error('File quá lớn. Tối đa 50,000 ký tự.');
        return;
      }
      setFileContent(content);
      toast.success(`Đã tải file: ${file.name}`);
    } catch (error) {
      toast.error('Không thể đọc file');
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'topic' && !topic.trim()) {
      toast.error('Vui lòng nhập chủ đề');
      return;
    }
    if (activeTab === 'file' && !fileContent) {
      toast.error('Vui lòng upload file');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          topic: activeTab === 'topic' ? topic : undefined,
          content: activeTab === 'file' ? fileContent : undefined,
          count,
        },
      });

      if (error) throw error;

      if (data.flashcards && Array.isArray(data.flashcards)) {
        setGeneratedCards(data.flashcards.map((card: Record<string, unknown>) => ({ ...card, selected: true })));
        setStep('review');
        toast.success(`Đã tạo ${data.flashcards.length} flashcard`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      log.error('Error generating flashcards', error);
      toast.error(getErrorMessage(error) || 'Không thể tạo flashcard');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCardSelection = (index: number) => {
    setGeneratedCards(prev => 
      prev.map((card, i) => 
        i === index ? { ...card, selected: !card.selected } : card
      )
    );
  };

  const handleConfirm = () => {
    const selectedCards = generatedCards
      .filter(card => card.selected)
      .map(({ front, back, hint }) => ({ front, back, hint }));
    
    if (selectedCards.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 flashcard');
      return;
    }

    onCardsGenerated(selectedCards);
  };

  const selectedCount = generatedCards.filter(c => c.selected).length;

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Xem trước Flashcard ({selectedCount}/{generatedCards.length})</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep('input')}>
              Quay lại
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={selectedCount === 0}>
              <Plus className="w-4 h-4 mr-1" />
              Thêm {selectedCount} thẻ
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {generatedCards.map((card, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all ${
                card.selected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted opacity-60'
              }`}
              onClick={() => toggleCardSelection(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    card.selected ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                  }`}>
                    {card.selected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">Mặt trước</Badge>
                      <p className="text-sm font-medium">{card.front}</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">Mặt sau</Badge>
                      <p className="text-sm text-muted-foreground">{card.back}</p>
                    </div>
                    {card.hint && (
                      <div>
                        <Badge variant="outline" className="text-xs mb-1 bg-yellow-50">Gợi ý</Badge>
                        <p className="text-xs text-muted-foreground italic">{card.hint}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'topic' | 'file')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topic" className="gap-2">
            <Wand2 className="w-4 h-4" />
            Theo chủ đề
          </TabsTrigger>
          <TabsTrigger value="file" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload file
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="topic">Chủ đề</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Từ vựng TOEIC về Business, Ngữ pháp tiếng Anh..."
              className="mt-1"
            />
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4 mt-4">
          <div>
            <Label>Upload file nội dung</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {fileName ? (
                    <>
                      <FileText className="w-8 h-8 mb-2 text-primary" />
                      <p className="text-sm font-medium text-primary">{fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fileContent.length.toLocaleString()} ký tự
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click để upload file (.txt, .md, .json, .csv)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {fileContent && (
            <div>
              <Label>Xem trước nội dung</Label>
              <Textarea
                value={fileContent.slice(0, 500) + (fileContent.length > 500 ? '...' : '')}
                readOnly
                rows={4}
                className="mt-1 text-xs"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Số lượng flashcard</Label>
          <span className="text-sm font-medium">{count}</span>
        </div>
        <Slider
          value={[count]}
          onValueChange={([v]) => setCount(v)}
          min={3}
          max={20}
          step={1}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Hủy
        </Button>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || (activeTab === 'topic' ? !topic.trim() : !fileContent)}
          className="flex-1 gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Tạo flashcard
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
