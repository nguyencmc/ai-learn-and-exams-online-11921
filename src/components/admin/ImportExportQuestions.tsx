import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/useToast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  option_f: string;
  option_g: string;
  option_h: string;
  correct_answer: string;
  explanation: string;
  question_order: number;
}

interface ImportExportQuestionsProps {
  questions: Question[];
  onImport: (questions: Question[]) => void;
}

export const ImportExportQuestions = ({ questions, onImport }: ImportExportQuestionsProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Parse CSV content
  const parseCSV = (content: string): Question[] => {
    const lines = content.trim().split('\n');
    const result: Question[] = [];
    
    // Skip header if exists
    const startIndex = lines[0]?.toLowerCase().includes('question') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle quoted CSV fields
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      if (fields.length >= 6) {
        result.push({
          question_text: fields[0] || '',
          option_a: fields[1] || '',
          option_b: fields[2] || '',
          option_c: fields[3] || '',
          option_d: fields[4] || '',
          option_e: fields[5] || '',
          option_f: fields[6] || '',
          option_g: fields[7] || '',
          option_h: fields[8] || '',
          correct_answer: (fields[9] || fields[5] || 'A').toUpperCase(),
          explanation: fields[10] || fields[6] || '',
          question_order: result.length + 1,
        });
      }
    }
    
    return result;
  };

  // ── Helper: does a line start a new option marker? (A. B. C. … H. or *A. [x]A. etc.)
  const OPTION_START_RE = /^(?:\*|\[x\]|✓|✔)?\s*([A-Ha-h])[.:)]\s*/i;

  // ── Regex that matches "Question N" / "Question N:" / "Câu N" / "Q N." etc.
  // Deliberately allows an OPTIONAL trailing separator [.:)] so that lines like
  // "Question 47" (no colon) are still recognised as question headers.
  const QUESTION_HEADER_RE = /^((?:Question|Câu\s*hỏi|Câu|Q)\s*\d+\s*[.:)]?)\s*/im;
  const QUESTION_HEADER_SPLIT_RE = /^((?:Question|Câu\s*hỏi|Câu|Q)\s*\d+\s*[.:)]?)/gim;

  // Parse TXT content
  // Supports two layouts:
  //   1. Blank-line-separated blocks  (one question per block)
  //   2. "Question N:" / "Câu N:" markers with no blank lines between questions
  //
  // Option content rule:
  //   • Content of an option begins right after "A." / "B." … "H."
  //   • It continues on the NEXT lines until another option marker (A.–H.) is found,
  //     OR until a known meta-line (Correct:, Explanation:, Đáp án:, Question N:, Câu N:) is found,
  //     OR until end of the block.
  const parseTXT = (content: string): Question[] => {
    // ── Step 1: split into per-question blocks ───────────────────────────────
    // If the file uses "Question N" / "Question N:" markers, split on those.
    // Otherwise fall back to blank-line separation.
    let rawBlocks: string[];
    const hasQuestionMarkers = QUESTION_HEADER_RE.test(content);

    if (hasQuestionMarkers) {
      // Insert a delimiter before each question marker then split on it
      const delimited = content.replace(QUESTION_HEADER_SPLIT_RE, '\x00$1');
      rawBlocks = delimited.split('\x00').filter(b => b.trim());
    } else {
      rawBlocks = content.split(/\n\s*\n/).filter(b => b.trim());
    }

    const result: Question[] = [];

    for (const block of rawBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) continue;

      // ── Step 2: separate question-text lines from option lines ──────────────
      const questionLines: string[] = [];
      let optionStartIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          OPTION_START_RE.test(line) ||
          /^\*\s*[A-Ha-h][.:)]/i.test(line) ||
          /^\[x\]\s*[A-Ha-h][.:)]/i.test(line)
        ) {
          optionStartIndex = i;
          break;
        }
        questionLines.push(line);
      }

      if (optionStartIndex === -1 || questionLines.length === 0) continue;

      // Clean question prefix ("Question 1:", "Câu 1:", "Question 47" etc.) and join wrapped lines
      let questionText = questionLines.join(' ')
        .replace(/^(?:Question|Câu\s*hỏi|Câu|Q)\s*\d*\s*[.:)]?\s*/i, '')
        .trim();

      // ── Step 3: collect options, accumulating continuation lines ────────────
      // Build a list of {letter, textParts[], isCorrect}
      type OptionEntry = { letter: string; parts: string[]; isCorrect: boolean };
      const optionEntries: OptionEntry[] = [];
      let currentEntry: OptionEntry | null = null;
      let correctAnswer = '';
      let explanation = '';

      for (let i = optionStartIndex; i < lines.length; i++) {
        const line = lines[i];

        // ── Meta lines: Correct / Đáp án / Explanation / Giải thích ───────────
        if (/^(?:Correct|Đáp\s*án\s*(?:đúng)?)\s*[.:]\s*[A-Ha-h]/i.test(line)) {
          const m = line.match(/[A-Ha-h]/i);
          if (m) correctAnswer = m[0].toUpperCase();
          currentEntry = null; // stop accumulating
          continue;
        }
        if (/^(?:Explanation|Giải\s*thích|Answer)\s*[.:]/i.test(line)) {
          explanation = line.replace(/^(?:Explanation|Giải\s*thích|Answer)\s*[.:]\s*/i, '').trim();
          currentEntry = null;
          continue;
        }

        // ── Check for correct-answer prefix markers (* [x] ✓ ✔) ──────────────
        const isCorrectMarker = /^\*|^\[x\]|^✓|^✔|\(correct\)|\(đúng\)/i.test(line);
        const stripped = line.replace(/^\*|\[x\]|✓|✔|\(correct\)|\(đúng\)/gi, '').trim();

        // ── New option marker? ────────────────────────────────────────────────
        const optMatch = stripped.match(/^([A-Ha-h])[.:)]\s*(.*)/);
        if (optMatch) {
          // Save previous entry
          if (currentEntry) optionEntries.push(currentEntry);

          const letter = optMatch[1].toUpperCase();
          const firstPart = optMatch[2].trim();
          currentEntry = { letter, parts: firstPart ? [firstPart] : [], isCorrect: isCorrectMarker };
          if (isCorrectMarker && !correctAnswer) correctAnswer = letter;
          continue;
        }

        // ── Continuation line for the current option ─────────────────────────
        if (currentEntry) {
          // A line that looks like a new question block header → stop
          if (/^(?:Question|Câu\s*hỏi|Câu|Q)\s*\d+/i.test(line)) {
            optionEntries.push(currentEntry);
            currentEntry = null;
            break;
          }
          currentEntry.parts.push(line);
        }
      }
      // Push last open entry
      if (currentEntry) optionEntries.push(currentEntry);

      // ── Step 4: assemble option map ─────────────────────────────────────────
      const opts: Record<string, string> = {};
      for (const entry of optionEntries) {
        opts[entry.letter] = entry.parts.join(' ').trim();
        if (entry.isCorrect && !correctAnswer) correctAnswer = entry.letter;
      }

      if (!correctAnswer) correctAnswer = 'A';

      if (questionText && 'A' in opts && 'B' in opts) {
        result.push({
          question_text: questionText,
          option_a: opts['A'] || '',
          option_b: opts['B'] || '',
          option_c: opts['C'] || '',
          option_d: opts['D'] || '',
          option_e: opts['E'] || '',
          option_f: opts['F'] || '',
          option_g: opts['G'] || '',
          option_h: opts['H'] || '',
          correct_answer: correctAnswer,
          explanation,
          question_order: result.length + 1,
        });
      }
    }

    return result;
  };

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    
    try {
      const content = await file.text();
      let parsedQuestions: Question[] = [];
      
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        parsedQuestions = parseCSV(content);
      } else if (fileName.endsWith('.txt')) {
        parsedQuestions = parseTXT(content);
      } else if (fileName.endsWith('.json')) {
        const jsonData = JSON.parse(content);
        const questionsArray = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
        parsedQuestions = questionsArray.map((q: any, index: number) => ({
          question_text: q.question_text || q.question || q.text || '',
          option_a: q.option_a || q.optionA || q.options?.[0] || q.a || '',
          option_b: q.option_b || q.optionB || q.options?.[1] || q.b || '',
          option_c: q.option_c || q.optionC || q.options?.[2] || q.c || '',
          option_d: q.option_d || q.optionD || q.options?.[3] || q.d || '',
          option_e: q.option_e || q.optionE || q.options?.[4] || q.e || '',
          option_f: q.option_f || q.optionF || q.options?.[5] || q.f || '',
          option_g: q.option_g || q.optionG || q.options?.[6] || q.g || '',
          option_h: q.option_h || q.optionH || q.options?.[7] || q.h || '',
          correct_answer: (q.correct_answer || q.correctAnswer || q.answer || 'A').toUpperCase(),
          explanation: q.explanation || '',
          question_order: index + 1,
        }));
      } else {
        throw new Error('Định dạng file không được hỗ trợ. Vui lòng sử dụng CSV, TXT hoặc JSON.');
      }
      
      if (parsedQuestions.length === 0) {
        throw new Error('Không tìm thấy câu hỏi hợp lệ trong file.');
      }
      
      onImport([...questions, ...parsedQuestions]);
      
      toast({
        title: "Import thành công",
        description: `Đã thêm ${parsedQuestions.length} câu hỏi`,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi import",
        description: error.message || "Không thể đọc file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle manual import from dialog
  const handleManualImport = () => {
    try {
      let parsedQuestions: Question[] = [];
      
      // Try to detect format
      const trimmedInput = manualInput.trim();
      
      if (trimmedInput.startsWith('[') || trimmedInput.startsWith('{')) {
        // JSON format
        const jsonData = JSON.parse(trimmedInput);
        const questionsArray = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
        parsedQuestions = questionsArray.map((q: any, index: number) => ({
          question_text: q.question_text || q.question || q.text || '',
          option_a: q.option_a || q.optionA || q.options?.[0] || q.a || '',
          option_b: q.option_b || q.optionB || q.options?.[1] || q.b || '',
          option_c: q.option_c || q.optionC || q.options?.[2] || q.c || '',
          option_d: q.option_d || q.optionD || q.options?.[3] || q.d || '',
          option_e: q.option_e || q.optionE || q.options?.[4] || q.e || '',
          option_f: q.option_f || q.optionF || q.options?.[5] || q.f || '',
          option_g: q.option_g || q.optionG || q.options?.[6] || q.g || '',
          option_h: q.option_h || q.optionH || q.options?.[7] || q.h || '',
          correct_answer: (q.correct_answer || q.correctAnswer || q.answer || 'A').toUpperCase(),
          explanation: q.explanation || '',
          question_order: questions.length + index + 1,
        }));
      } else if (trimmedInput.includes(',')) {
        // CSV format
        parsedQuestions = parseCSV(trimmedInput);
      } else {
        // TXT format
        parsedQuestions = parseTXT(trimmedInput);
      }
      
      if (parsedQuestions.length === 0) {
        throw new Error('Không tìm thấy câu hỏi hợp lệ.');
      }
      
      // Update question order
      parsedQuestions = parsedQuestions.map((q, i) => ({
        ...q,
        question_order: questions.length + i + 1,
      }));
      
      onImport([...questions, ...parsedQuestions]);
      setShowManualDialog(false);
      setManualInput('');
      
      toast({
        title: "Import thành công",
        description: `Đã thêm ${parsedQuestions.length} câu hỏi`,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi import",
        description: error.message || "Không thể parse dữ liệu",
        variant: "destructive",
      });
    }
  };

  // Export functions
  const exportToCSV = () => {
    const header = 'Question,Option A,Option B,Option C,Option D,Option E,Option F,Option G,Option H,Correct Answer,Explanation';
    const rows = questions.map(q => 
      `"${q.question_text.replace(/"/g, '""')}","${q.option_a.replace(/"/g, '""')}","${q.option_b.replace(/"/g, '""')}","${q.option_c.replace(/"/g, '""')}","${q.option_d.replace(/"/g, '""')}","${(q.option_e || '').replace(/"/g, '""')}","${(q.option_f || '').replace(/"/g, '""')}","${(q.option_g || '').replace(/"/g, '""')}","${(q.option_h || '').replace(/"/g, '""')}","${q.correct_answer}","${q.explanation.replace(/"/g, '""')}"`
    );
    
    const csv = [header, ...rows].join('\n');
    downloadFile(csv, 'questions.csv', 'text/csv');
  };

  const exportToTXT = () => {
    const content = questions.map((q, index) => {
      let text = `Question ${index + 1}: ${q.question_text}\n`;
      text += `A. ${q.option_a}\n`;
      text += `B. ${q.option_b}\n`;
      if (q.option_c) text += `C. ${q.option_c}\n`;
      if (q.option_d) text += `D. ${q.option_d}\n`;
      if (q.option_e) text += `E. ${q.option_e}\n`;
      if (q.option_f) text += `F. ${q.option_f}\n`;
      if (q.option_g) text += `G. ${q.option_g}\n`;
      if (q.option_h) text += `H. ${q.option_h}\n`;
      text += `Correct: ${q.correct_answer}\n`;
      if (q.explanation) text += `Explanation: ${q.explanation}\n`;
      return text;
    }).join('\n');
    
    downloadFile(content, 'questions.txt', 'text/plain');
  };

  const exportToJSON = () => {
    const json = JSON.stringify(questions, null, 2);
    downloadFile(json, 'questions.json', 'application/json');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export thành công",
      description: `Đã tải file ${filename}`,
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv,.txt,.json"
        onChange={handleFileImport}
      />
      
      <div className="flex gap-2">
        {/* Import Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={importing}>
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Chọn nguồn import</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Từ file (CSV, TXT, JSON)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowManualDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Nhập thủ công
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={questions.length === 0}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Chọn định dạng</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToTXT}>
              <FileText className="w-4 h-4 mr-2" />
              TXT (Text)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToJSON}>
              <File className="w-4 h-4 mr-2" />
              JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Manual Input Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nhập câu hỏi thủ công</DialogTitle>
            <DialogDescription>
              Hỗ trợ các định dạng: JSON, CSV, hoặc TXT. Hỗ trợ tối đa 8 đáp án (A-H).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-input">Nội dung câu hỏi</Label>
              <Textarea
                id="manual-input"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={`Ví dụ TXT:\n\nQuestion 1: Thủ đô Việt Nam là gì?\nA. Hà Nội\nB. Hồ Chí Minh\nC. Đà Nẵng\nD. Huế\nE. Hải Phòng\nF. Cần Thơ\nCorrect: A\nExplanation: Hà Nội là thủ đô của Việt Nam\n\nVí dụ CSV:\nThủ đô Việt Nam là gì?,Hà Nội,Hồ Chí Minh,Đà Nẵng,Huế,,,,,A,Hà Nội là thủ đô`}
                rows={12}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Hướng dẫn định dạng:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>TXT:</strong> Mỗi câu hỏi cách nhau bằng dòng trống. Câu hỏi bắt đầu bằng "Question" hoặc "Câu". Đáp án A-H trên từng dòng.</li>
                <li><strong>CSV:</strong> Câu hỏi, Đáp án A, B, C, D, E, F, G, H, Đáp án đúng, Giải thích (phân cách bởi dấu phẩy)</li>
                <li><strong>JSON:</strong> Mảng objects với các trường question_text, option_a đến option_h, correct_answer, explanation</li>
                <li><strong>Đáp án đúng:</strong> Đánh dấu bằng *, [x], hoặc dòng "Correct: A" / "Đáp án: A"</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowManualDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleManualImport} disabled={!manualInput.trim()}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};