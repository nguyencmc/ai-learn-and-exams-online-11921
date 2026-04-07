import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = 'gemini-2.0-flash';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, count = 5, content } = await req.json();

    const apiKey = Deno.env.get('NVIDIA_API_KEY') ?? Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY chưa được cấu hình. Vui lòng liên hệ quản trị viên.' }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt = "";

    if (content) {
      prompt = `Dựa trên nội dung sau, tạo ${count} flashcard để học và ôn tập.

Nội dung:
${content}

Trả về JSON array (không có text khác):
[
  {
    "front": "Câu hỏi hoặc khái niệm cần nhớ",
    "back": "Câu trả lời hoặc giải thích chi tiết",
    "hint": "Gợi ý ngắn gọn (tùy chọn, để null nếu không có)"
  }
]`;
    } else {
      prompt = `Tạo ${count} flashcard về chủ đề: "${topic}"

Trả về JSON array (không có text khác):
[
  {
    "front": "Câu hỏi hoặc khái niệm cần nhớ",
    "back": "Câu trả lời hoặc giải thích chi tiết",
    "hint": "Gợi ý ngắn gọn (tùy chọn, để null nếu không có)"
  }
]`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt giới hạn request. Vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No response from AI");

    let flashcards;
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      flashcards = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      throw new Error("Failed to parse flashcards from AI response");
    }

    return new Response(
      JSON.stringify({ flashcards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating flashcards:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
