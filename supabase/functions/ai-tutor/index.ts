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
    const { messages, context } = await req.json();

    const apiKey = Deno.env.get('NVIDIA_API_KEY') ?? Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY chưa được cấu hình. Vui lòng liên hệ quản trị viên.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Tutor request received:', { messagesCount: messages?.length, hasContext: !!context });

    const systemInstruction = `Bạn là một gia sư AI thông minh và thân thiện, chuyên hỗ trợ học sinh học tập.

Nhiệm vụ của bạn:
- Trả lời câu hỏi về bài học một cách rõ ràng và dễ hiểu
- Giải thích các khái niệm phức tạp bằng ví dụ thực tế
- Khuyến khích học sinh tự suy nghĩ và tìm tòi
- Đưa ra gợi ý học tập và phương pháp ôn thi hiệu quả
- Sử dụng ngôn ngữ thân thiện, phù hợp với học sinh

${context ? `Ngữ cảnh bài học hiện tại:\n${context}` : ''}

Hãy trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.`;

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Use streaming endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
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

    // Transform Gemini SSE → OpenAI SSE format (for client compatibility)
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit OpenAI-compatible SSE chunk
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch { /* skip malformed lines */ }
          }
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('AI Tutor error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
