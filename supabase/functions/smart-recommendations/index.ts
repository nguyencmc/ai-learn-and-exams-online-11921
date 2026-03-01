import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.0-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Smart recommendations request for user:', userId);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's exam history
    const { data: attempts } = await supabase
      .from('exam_attempts')
      .select(`
        score,
        correct_answers,
        total_questions,
        exam:exams(title, category_id, difficulty)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    // Fetch available exams
    const { data: exams } = await supabase
      .from('exams')
      .select('id, title, description, difficulty, category_id')
      .limit(20);

    // Fetch flashcard progress
    const { data: flashcardProgress } = await supabase
      .from('user_flashcard_progress')
      .select('is_remembered, review_count')
      .eq('user_id', userId);

    // Build user context
    const userContext = {
      totalExams: attempts?.length || 0,
      averageScore: attempts?.length
        ? Math.round(attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length)
        : 0,
      recentExams: attempts?.slice(0, 5).map(a => ({
        title: (a.exam as any)?.title,
        score: a.score,
        difficulty: (a.exam as any)?.difficulty,
      })) || [],
      flashcardStats: {
        total: flashcardProgress?.length || 0,
        remembered: flashcardProgress?.filter(f => f.is_remembered).length || 0,
      },
      availableExams: exams?.map(e => ({
        id: e.id,
        title: e.title,
        difficulty: e.difficulty,
      })) || [],
    };

    console.log('User context:', JSON.stringify(userContext, null, 2));

    const prompt = `Bạn là hệ thống gợi ý học tập thông minh. Dựa trên lịch sử học tập của học sinh, hãy đưa ra các gợi ý phù hợp.

Phân tích:
- Điểm trung bình và xu hướng điểm số
- Độ khó phù hợp dựa trên hiệu suất
- Các chủ đề cần cải thiện
- Flashcards cần ôn tập

Dữ liệu học tập của học sinh:
${JSON.stringify(userContext, null, 2)}

Hãy trả về JSON với cấu trúc chính xác sau (không có text khác ngoài JSON):
{
  "summary": "Tóm tắt ngắn về hiệu suất học tập",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Điểm cần cải thiện 1", "Điểm cần cải thiện 2"],
  "recommendations": [
    {
      "type": "exam",
      "title": "Tiêu đề gợi ý",
      "description": "Mô tả chi tiết",
      "priority": "high",
      "examId": "optional-exam-id"
    }
  ],
  "suggestedDifficulty": "medium"
}

Lưu ý:
- type phải là một trong: "exam", "flashcard", "practice", "review"
- priority phải là một trong: "high", "medium", "low"
- suggestedDifficulty phải là một trong: "easy", "medium", "hard"
- examId chỉ điền khi type là "exam" và có ID trong danh sách availableExams`;

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Lỗi Gemini API' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Gemini response received');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Không nhận được phản hồi từ Gemini');
    }

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart recommendations error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
