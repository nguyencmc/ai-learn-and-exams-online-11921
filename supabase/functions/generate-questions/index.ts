import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-2.0-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, questionCount = 5, difficulty = 'medium' } = await req.json();

    const apiKey = Deno.env.get('NVIDIA_API_KEY') ?? Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY chưa được cấu hình. Vui lòng liên hệ quản trị viên.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content || content.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Nội dung quá ngắn để tạo câu hỏi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generate questions request:', { contentLength: content.length, questionCount, difficulty });

    const difficultyMap: Record<string, string> = {
      easy: 'dễ, phù hợp với người mới học',
      medium: 'trung bình, yêu cầu hiểu biết cơ bản',
      hard: 'khó, yêu cầu phân tích và suy luận sâu',
    };

    const prompt = `Bạn là chuyên gia tạo câu hỏi trắc nghiệm chất lượng cao.

Nhiệm vụ: Tạo ${questionCount} câu hỏi trắc nghiệm từ nội dung được cung cấp.
Độ khó: ${difficultyMap[difficulty] || difficultyMap.medium}

Yêu cầu:
- Mỗi câu hỏi có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- Đáp án sai phải hợp lý, không quá dễ nhận ra
- Kèm giải thích ngắn gọn cho đáp án đúng
- Câu hỏi phải kiểm tra sự hiểu biết, không chỉ ghi nhớ

Nội dung:
${content}

Trả về JSON hợp lệ theo format sau (không có text khác ngoài JSON):
{
  "questions": [
    {
      "question_text": "Nội dung câu hỏi",
      "option_a": "Đáp án A",
      "option_b": "Đáp án B",
      "option_c": "Đáp án C",
      "option_d": "Đáp án D",
      "correct_answer": "A",
      "explanation": "Giải thích tại sao đáp án đúng"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content generated');

    let parsed: { questions: unknown[] };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      console.error('Failed to parse JSON:', rawText);
      throw new Error('Failed to parse questions from AI response');
    }

    return new Response(JSON.stringify({ questions: parsed.questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
