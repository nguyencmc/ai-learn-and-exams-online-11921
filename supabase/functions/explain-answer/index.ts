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
    const { question, options, correctAnswer, userAnswer } = await req.json();

    if (!question || !options || !correctAnswer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY chưa được cấu hình. Vui lòng liên hệ quản trị viên.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const optionsText = Object.entries(options)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key.toUpperCase()}. ${value}`)
      .join('\n');

    const userAnswerText = userAnswer
      ? `Người dùng đã chọn: ${userAnswer}`
      : 'Người dùng chưa trả lời câu hỏi này';

    const prompt = `Bạn là một giáo viên chuyên nghiệp, nhiệt tình và giỏi giải thích. Nhiệm vụ của bạn là giải thích đáp án cho câu hỏi trắc nghiệm một cách chi tiết, dễ hiểu.

Hãy giải thích:
1. Tại sao đáp án đúng là đúng
2. Tại sao các đáp án khác sai (nếu có)
3. Cung cấp kiến thức liên quan hoặc mẹo ghi nhớ nếu phù hợp

Giải thích ngắn gọn nhưng đầy đủ, sử dụng ngôn ngữ đơn giản, dễ hiểu. Trả lời bằng tiếng Việt.

---
Câu hỏi: ${question}

Các lựa chọn:
${optionsText}

Đáp án đúng: ${correctAnswer}
${userAnswerText}

Hãy giải thích chi tiết tại sao đáp án ${correctAnswer} là đúng.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explanation) {
      throw new Error('No explanation generated');
    }

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in explain-answer function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
