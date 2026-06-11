import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Calendar, HelpCircle, BookMarked, Brain, ScrollText, ClipboardList } from 'lucide-react';
import { useCurrentFlow } from '@/store/useAppStore';
import type { FlowType } from '@/store/types';
import { cn } from '@/lib/utils';

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const flowConfig: Record<Exclude<FlowType, 'idle'>, { icon: any; label: string; desc: string; badge: string }> = {
  plan: { icon: Calendar, label: '制定计划', desc: '正在帮你规划复习安排...', badge: 'badge-brand' },
  qa: { icon: HelpCircle, label: '知识问答', desc: '正在为你讲解知识点...', badge: 'badge-accent' },
  wrongbook: { icon: BookMarked, label: '错题整理', desc: '正在收录你的错题...', badge: 'badge-danger' },
  recite: { icon: Brain, label: '背诵抽查', desc: '正在抽查你的记忆效果...', badge: 'badge-success' },
  quiz: { icon: ScrollText, label: '模拟测验', desc: '正在进行答题测验...', badge: 'badge-accent' },
  review: { icon: ClipboardList, label: '复盘总结', desc: '正在生成学习复盘报告...', badge: 'badge-brand' },
};

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentFlow = useCurrentFlow();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }, [value]);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const flowInfo = currentFlow !== 'idle' ? flowConfig[currentFlow] : null;
  const isEmpty = !value.trim();

  return (
    <div className="glass-panel p-3 space-y-2">
      {flowInfo && (
        <div className="flex items-center gap-2 px-2">
          <span className={cn(flowInfo.badge, 'gap-1.5')}>
            <flowInfo.icon size={12} />
            {flowInfo.label}
          </span>
          <span className="text-xs text-slate-500">{flowInfo.desc}</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="输入你的问题... (Enter发送，Shift+Enter换行)"
            rows={1}
            className={cn(
              'w-full resize-none px-4 py-3 pr-4 rounded-2xl',
              'bg-white/80 border border-brand-100',
              'text-slate-800 placeholder:text-slate-400 text-sm',
              'focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
              'transition-all duration-200',
              'max-h-32 overflow-y-auto scrollbar-thin',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isEmpty || disabled}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
            isEmpty || disabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0'
          )}
        >
          <Send size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
