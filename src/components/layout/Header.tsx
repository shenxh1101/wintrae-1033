import { GraduationCap, Sparkles, RotateCcw, Database } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { countdownText } from '@/utils/dateUtils';

export default function Header() {
  const examInfo = useAppStore(s => s.examInfo);
  const addMockData = useAppStore(s => s.addMockData);
  const resetAll = useAppStore(s => s.resetAll);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-brand-100 sticky top-0 z-40 animate-fade-in">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 bg-clip-text text-transparent leading-tight">
              备考伙伴
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight">Study Buddy · 智能备考助手</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          {examInfo ? (
            <div className="glass-panel px-5 py-2 flex items-center gap-4 animate-slide-up">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-semibold text-slate-700 max-w-[200px] truncate">{examInfo.name}</span>
              </div>
              <div className="w-px h-5 bg-brand-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600">{countdownText(examInfo.examDate)}</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel px-5 py-2 flex items-center gap-2 animate-slide-up">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">还未设置考试信息，点击「加载示例数据」快速体验</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addMockData}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            <Database className="w-4 h-4" />
            <span>加载示例数据</span>
          </button>
          <button
            onClick={resetAll}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>
        </div>
      </div>
    </header>
  );
}
