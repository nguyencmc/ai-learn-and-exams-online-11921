import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorChatProps {
  context?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/ai-tutor`;

// Maximum input length to prevent abuse
const MAX_INPUT_LENGTH = 2000;

// Rate limiting: minimum interval between messages (ms)
const MIN_MESSAGE_INTERVAL = 1000;

/**
 * Escapes HTML special characters to prevent XSS when rendering text.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

export const AITutorChat: React.FC<AITutorChatProps> = ({ context, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Rate limiting check
    const now = Date.now();
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL) {
      toast({
        title: 'Vui lòng chờ',
        description: 'Bạn đang gửi tin nhắn quá nhanh.',
        variant: 'destructive',
      });
      return;
    }
    lastMessageTimeRef.current = now;

    // Input length validation
    const trimmedInput = input.trim().slice(0, MAX_INPUT_LENGTH);

    const userMsg: Message = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      // Use session access token if available, fall back to publishable key
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lỗi kết nối AI');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể kết nối AI Tutor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, context, session?.access_token, toast]);

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-4">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">AI Tutor</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng AI Tutor">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary/40" />
              <p className="text-sm">Xin chào! Tôi là AI Tutor.</p>
              <p className="text-sm">Hãy hỏi tôi bất kỳ điều gì về bài học!</p>
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: escapeHtml(msg.content) }}
                  />
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              placeholder="Nhập câu hỏi..."
              disabled={isLoading}
              className="flex-1"
              maxLength={MAX_INPUT_LENGTH}
              aria-label="Nhập câu hỏi cho AI Tutor"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Gửi tin nhắn">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
