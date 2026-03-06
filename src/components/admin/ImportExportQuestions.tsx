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

  // ── Parse toàn bộ CSV text thành mảng rows (mỗi row là mảng field strings).
  // Xử lý đúng: quoted fields có newline bên trong, escaped double-quotes ("").
  const parseCSVRaw = (content: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < content.length) {
      const ch = content[i];
      const next = content[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          // escaped quote
          field += '"';
          i += 2;
        } else if (ch === '"') {
          inQuotes = false;
          i++;
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ',') {
          row.push(field.trim());
          field = '';
          i++;
        } else if (ch === '\r' && next === '\n') {
          row.push(field.trim());
          field = '';
          rows.push(row);
          row = [];
          i += 2;
        } else if (ch === '\n' || ch === '\r') {
          row.push(field.trim());
          field = '';
          rows.push(row);
          row = [];
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }
    // flush last field / row
    if (field || row.length > 0) {
      row.push(field.trim());
      if (row.some(f => f)) rows.push(row);
    }
    return rows;
  };

  // Strip leading "A. " / "B. " / "1. " prefix that some tools add to option cells
  const stripOptionPrefix = (text: string): string =>
    text.replace(/^[A-Ha-h\d][.)]\s+/, '').trim();

  // Normalise correct_answer: "C;D" / "C,D" / "C D" → take first letter, uppercase
  const normaliseAnswer = (raw: string): string => {
    const first = raw.trim().split(/[;,\s|/]+/)[0].trim().toUpperCase();
    return /^[A-H]$/.test(first) ? first : 'A';
  };

  // Parse CSV content
  // Supports two column layouts automatically:
  //   Template layout (9 cols):  Title, Topic, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation
  //   Legacy layout  (≥6 cols):  Question, OptionA, OptionB, OptionC, OptionD, [OptionE..H,] CorrectAnswer, Explanation
  const parseCSV = (content: string): Question[] => {
    const rows = parseCSVRaw(content);
    if (rows.length < 2) return [];

    const result: Question[] = [];

    // Detect header row and column layout
    const headerRow = rows[0].map(h => h.toLowerCase().replace(/\s/g, ''));
    const isTemplateLayout =
      headerRow[0] === 'title' ||
      headerRow[1] === 'topic' ||
      (headerRow[2] === 'question' && headerRow[0] !== 'question');

    for (let i = 1; i < rows.length; i++) {
      const f = rows[i];
      if (f.every(cell => !cell)) continue; // blank row

      let questionText: string;
      let optA: string, optB: string, optC: string, optD: string;
      let optE = '', optF = '', optG = '', optH = '';
      let correct: string;
      let explanation: string;

      if (isTemplateLayout) {
        // Title(0), Topic(1), Question(2), OptionA(3), OptionB(4), OptionC(5), OptionD(6), CorrectAnswer(7), Explanation(8)
        if (f.length < 8) continue;
        questionText = f[2] || '';
        optA = stripOptionPrefix(f[3] || '');
        optB = stripOptionPrefix(f[4] || '');
        optC = stripOptionPrefix(f[5] || '');
        optD = stripOptionPrefix(f[6] || '');
        correct = normaliseAnswer(f[7] || 'A');
        explanation = f[8] || '';
      } else {
        // Legacy: Question(0), OptA(1), OptB(2), OptC(3), OptD(4), [OptE(5)..OptH(8),] Correct, Explanation
        if (f.length < 6) continue;
        questionText = f[0] || '';
        optA = stripOptionPrefix(f[1] || '');
        optB = stripOptionPrefix(f[2] || '');
        optC = stripOptionPrefix(f[3] || '');
        optD = stripOptionPrefix(f[4] || '');
        if (f.length >= 12) {
          // 12-col: Q, A-H (8), Correct, Explanation
          optE = stripOptionPrefix(f[5] || '');
          optF = stripOptionPrefix(f[6] || '');
          optG = stripOptionPrefix(f[7] || '');
          optH = stripOptionPrefix(f[8] || '');
          correct = normaliseAnswer(f[9] || 'A');
          explanation = f[10] || '';
        } else if (f.length >= 7) {
          // 7-col: Q, A-D, Correct, Explanation  OR  Q, A-E, Correct
          const possibleCorrect = f[f.length - 2] || '';
          correct = /^[A-Ha-h]/.test(possibleCorrect.trim())
            ? normaliseAnswer(possibleCorrect)
            : normaliseAnswer(f[5] || 'A');
          explanation = f[f.length - 1] || '';
        } else {
          correct = normaliseAnswer(f[5] || 'A');
          explanation = f[6] || '';
        }
      }

      if (!questionText || !optA || !optB) continue;

      result.push({
        question_text: questionText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        option_e: optE,
        option_f: optF,
        option_g: optG,
        option_h: optH,
        correct_answer: correct,
        explanation,
        question_order: result.length + 1,
      });
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
    // Use same 9-column template layout for easy re-import
    const header = 'Title,Topic,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation';
    const rows = questions.map(q => {
      const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      return [
        esc(''),
        esc(''),
        esc(q.question_text),
        esc(q.option_a),
        esc(q.option_b),
        esc(q.option_c || ''),
        esc(q.option_d || ''),
        esc(q.correct_answer),
        esc(q.explanation || ''),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    downloadFile(csv, 'questions.csv', 'text/csv');
  };

  const downloadTemplate = () => {
    const header = 'Title,Topic,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation';
    const example = [
      '"Tên bộ đề"',
      '"Chủ đề"',
      '"Thủ đô của Việt Nam là gì?"',
      '"Hà Nội"',
      '"Hồ Chí Minh"',
      '"Đà Nẵng"',
      '"Huế"',
      '"A"',
      '"Hà Nội là thủ đô của Việt Nam từ năm 1010"',
    ].join(',');
    const csv = [header, example].join('\n');
    downloadFile(csv, 'quiz-template.csv', 'text/csv');
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
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Chọn định dạng</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToCSV} disabled={questions.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToTXT} disabled={questions.length === 0}>
              <FileText className="w-4 h-4 mr-2" />
              TXT (Text)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToJSON} disabled={questions.length === 0}>
              <File className="w-4 h-4 mr-2" />
              JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Tải file mẫu CSV
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