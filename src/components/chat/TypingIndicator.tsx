import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 animate-slide-up">
      <div className="flex items-center gap-3 bg-white shadow-card rounded-2xl rounded-bl-sm border border-brand-100/50 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/30">
          <Bot size={16} className="text-white" strokeWidth={2.2} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
