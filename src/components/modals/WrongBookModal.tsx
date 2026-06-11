import { useState } from 'react';
import { X, BookX, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { isToday, formatDate } from '@/utils/dateUtils';

export default function WrongBookModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const wrongQuestions = useAppStore(s => s.wrongQuestions);
  const reviewWrongQuestion = useAppStore(s => s.reviewWrongQuestion);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'reviewed'>('all');
  const [searchText, setSearchText] = useState('');

  if (activeModal !== 'wrongbook') return null;

  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  const filtered = wrongQuestions.filter((wq) => {
    if (filter === 'today' && !isToday(wq.nextReviewDate)) return false;
    if (filter === 'reviewed' && wq.reviewCount === 0) return false;
    if (searchText && !wq.question.includes(searchText) && !wq.chapter.includes(searchText)) return false;
    return true;
  });

  const selected = wrongQuestions.find((w) => w.id === selectedId);

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <BookX className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">错题本</h2>
              <p className="text-xs text-slate-500">共 {wrongQuestions.length} 道 · 今日待复习 {wrongQuestions.filter(w => isToday(w.nextReviewDate)).length} 道</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-80 border-r border-brand-100 flex flex-col shrink-0">
            <div className="p-4 space-y-3 border-b border-brand-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索题目或章节..."
                  className="input-base pl-9 !py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                {([['all', '全部'], ['today', '今日'], ['reviewed', '已复习']] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`flex-1 !py-1.5 text-xs rounded-full font-medium transition-all ${
                      filter === k
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                        : 'bg-white border border-brand-200 text-slate-600 hover:bg-brand-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">暂无错题</div>
              ) : (
                filtered.map((wq, idx) => (
                  <div
                    key={wq.id}
                    onClick={() => setSelectedId(wq.id)}
                    className={`card-base card-hover p-3 cursor-pointer animate-slide-up ${
                      selectedId === wq.id ? 'ring-2 ring-brand-400 shadow-lg' : ''
                    }`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`badge ${subjectColors[wq.subject] || 'bg-brand-100 text-brand-700'}`}>
                        {wq.subject}
                      </span>
                      {isToday(wq.nextReviewDate) && (
                        <span className="badge bg-amber-100 text-amber-700">待复习</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-snug">{wq.question}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-400">{wq.chapter}</span>
                      <span className="text-[11px] text-slate-400">复习 {wq.reviewCount} 次</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {selected ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${subjectColors[selected.subject] || 'bg-brand-100 text-brand-700'}`}>
                      {selected.subject}
                    </span>
                    <span className="badge badge-brand">{selected.chapter}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    收录于 {formatDate(new Date(selected.addedAt))}
                  </div>
                </div>

                <div className="glass-panel p-5">
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">📝 题目</h3>
                  <p className="text-slate-800 leading-relaxed">{selected.question}</p>
                  {selected.options && selected.options.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selected.options.map((opt, i) => {
                        const optLetter = String.fromCharCode(65 + i);
                        const isUserAnswer = optLetter === selected.userAnswer;
                        const isCorrect = optLetter === selected.correctAnswer;
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-200'
                                : isUserAnswer
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-white border-brand-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                              {isUserAnswer && !isCorrect && <X className="w-4 h-4 text-rose-500 shrink-0" />}
                              <span className={`text-sm ${isCorrect ? 'text-emerald-700 font-semibold' : isUserAnswer ? 'text-rose-700' : 'text-slate-700'}`}>
                                {opt}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-5">
                    <h3 className="text-sm font-semibold text-rose-500 mb-2">❌ 你的答案</h3>
                    <p className="text-lg font-bold text-rose-600">{selected.userAnswer}</p>
                  </div>
                  <div className="glass-panel p-5">
                    <h3 className="text-sm font-semibold text-emerald-500 mb-2">✅ 正确答案</h3>
                    <p className="text-lg font-bold text-emerald-600">{selected.correctAnswer}</p>
                  </div>
                </div>

                <div className="glass-panel p-5">
                  <h3 className="text-sm font-semibold text-brand-600 mb-3">💡 解析</h3>
                  <p className="text-slate-700 leading-relaxed">{selected.analysis}</p>
                </div>

                {selected.similarQuestions && selected.similarQuestions.length > 0 && (
                  <div className="glass-panel p-5">
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">🔄 相似变式练习</h3>
                    <div className="space-y-3">
                      {selected.similarQuestions.map((sq, i) => (
                        <div key={sq.id} className="p-3 rounded-xl bg-white border border-brand-100">
                          <p className="text-sm font-medium text-slate-700 mb-2">{sq.question}</p>
                          {sq.options && (
                            <div className="text-xs text-slate-500 space-y-1">
                              {sq.options.map((o, j) => (
                                <div key={j} className={String.fromCharCode(65 + j) === sq.answer ? 'text-emerald-600 font-medium' : ''}>
                                  {o}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between glass-panel p-4">
                  <div className="text-sm text-slate-600">
                    下次复习：<span className="font-semibold text-brand-600">{selected.nextReviewDate}</span>
                    <span className="mx-2">·</span>
                    已复习 <span className="font-semibold">{selected.reviewCount}</span> 次
                  </div>
                  <button
                    onClick={() => {
                      reviewWrongQuestion(selected.id);
                    }}
                    className="btn-primary !py-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>标记已复习</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-rose-50 flex items-center justify-center mb-4">
                  <BookX className="w-12 h-12 text-rose-300" />
                </div>
                <h3 className="font-bold text-slate-600 mb-2">选择一道错题查看详情</h3>
                <p className="text-sm text-slate-400 max-w-xs">从左侧列表选择错题，查看详细解析和相似变式练习</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
