import { useEffect, useRef } from 'react';
import type { Message } from '@/store/types';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  onSend: (text: string) => void;
}

export default function ChatContainer({ messages, isTyping, onSend }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 py-4"
      >
        <div className="max-w-4xl mx-auto space-y-1">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-4 pt-2">
        <div className="max-w-4xl mx-auto">
          <InputBar onSend={onSend} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
}
