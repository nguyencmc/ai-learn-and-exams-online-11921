import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { audioUrl, duration } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcribing audio from:', audioUrl);
    console.log('Duration:', duration, 'seconds');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Download audio file and convert to base64
    console.log('Downloading audio file...');
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Get MIME type from URL extension
    const urlParts = audioUrl.split('.');
    const extension = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
    const mimeType = getMimeType(extension);

    console.log('Audio file downloaded, size:', audioBuffer.byteLength, 'bytes');
    console.log('MIME type:', mimeType);

    const prompt = `Bạn là một chuyên gia phiên âm audio. Hãy nghe file audio này và tạo transcript với timestamps chính xác.

QUAN TRỌNG - Định dạng output:
- Mỗi câu/đoạn nên bắt đầu với timestamp [MM:SS]
- Timestamp phải chính xác theo thời gian thực trong audio
- Mỗi segment nên khoảng 5-15 giây
- Giữ nguyên ngôn ngữ gốc trong audio (có thể là tiếng Việt, tiếng Anh, hoặc song ngữ)
- KHÔNG dịch nội dung, chỉ ghi lại chính xác những gì được nói

Thời lượng audio: ${duration || 'không xác định'} giây

Ví dụ format output:
[00:00] Xin chào các bạn, hôm nay chúng ta sẽ học về...
[00:08] Chủ đề đầu tiên là vocabulary, nghĩa là từ vựng
[00:15] Hãy cùng bắt đầu với từ đầu tiên...

Hãy transcribe audio và tạo timestamps chính xác:`;

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Đã vượt quá giới hạn request. Vui lòng thử lại sau.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Gemini response received');

    const transcriptContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!transcriptContent) {
      throw new Error('No transcript generated');
    }

    // Clean up the transcript - remove markdown code blocks if present
    let cleanTranscript = transcriptContent
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*#+\s*.*/gm, '') // Remove markdown headers
      .trim();

    // Ensure proper format with timestamps
    const lines = cleanTranscript.split('\n').filter((line: string) => line.trim());
    const formattedLines = lines.map((line: string) => {
      if (!line.match(/^\[\d{1,2}:\d{2}\]/)) {
        if (
          line.includes('transcript') || line.includes('Transcript') ||
          line.includes('audio') || line.includes('Audio') ||
          line.match(/^(Dưới đây|Here is|Below)/i)
        ) {
          return null;
        }
      }
      return line;
    }).filter(Boolean);

    const finalTranscript = formattedLines.join('\n');

    console.log('Transcript generated successfully, lines:', formattedLines.length);

    return new Response(
      JSON.stringify({
        transcript: finalTranscript,
        lineCount: formattedLines.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'webm': 'audio/webm',
    'flac': 'audio/flac',
  };
  return mimeTypes[extension] || 'audio/mpeg';
}
