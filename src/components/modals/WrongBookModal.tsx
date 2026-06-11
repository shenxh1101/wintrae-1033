import { useState } from 'react';
import { X, BookX, CheckCircle2, RotateCcw, Search, Sparkles, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { isToday, formatDate, getWeekDates } from '@/utils/dateUtils';
import { ERROR_TAGS, type ErrorTagType } from '@/store/types';

export default function WrongBookModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const wrongQuestions = useAppStore(s => s.wrongQuestions);
  const reviewWrongQuestion = useAppStore(s => s.reviewWrongQuestion);
  const addWrongQuestion = useAppStore(s => s.addWrongQuestion);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'reviewed'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedErrorTags, setSelectedErrorTags] = useState<ErrorTagType[]>([]);
  const [customErrorTag, setCustomErrorTag] = useState('');

  if (activeModal !== 'wrongbook') return null;

  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  const weekDates = getWeekDates();
  const thisWeekWrong = wrongQuestions.filter(wq => weekDates.includes(formatDate(new Date(wq.addedAt))));
  const chapterStats: Record<string, number> = {};
  thisWeekWrong.forEach(wq => {
    chapterStats[wq.chapter] = (chapterStats[wq.chapter] || 0) + 1;
  });
  const topChapters = Object.entries(chapterStats)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 3)
    .map(([chapter, count]) => ({
      chapter,
      count: count as number,
      ratio: thisWeekWrong.length ? Math.round(((count as number) / thisWeekWrong.length) * 100) : 0,
    }));

  const getSuggestionForChapter = (chapter: string) => {
    const chapterKps = knowledgePoints.filter(kp => kp.chapter === chapter);
    if (chapterKps.length === 0) return '建议回归教材精读本章核心概念，配合课后习题巩固。';
    const weakest = [...chapterKps].sort((a, b) => a.mastery - b.mastery).slice(0, 2);
    return `建议重点复习：${weakest.map(kp => kp.title).join('、')}，配合典型例题加深理解。`;
  };

  const filtered = wrongQuestions.filter((wq) => {
    if (filter === 'today' && !isToday(wq.nextReviewDate)) return false;
    if (filter === 'reviewed' && wq.reviewCount === 0) return false;
    if (searchText && !wq.question.includes(searchText) && !wq.chapter.includes(searchText)) return false;
    return true;
  });

  const selected = wrongQuestions.find((w) => w.id === selectedId);

  const toggleErrorTag = (tag: ErrorTagType) => {
    setSelectedErrorTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const saveErrorTags = () => {
    if (!selected) return;
    const allTags = [...selectedErrorTags];
    if (customErrorTag.trim() && !allTags.includes(customErrorTag.trim() as ErrorTagType)) {
      allTags.push(customErrorTag.trim() as ErrorTagType);
    }
    const store = useAppStore.getState();
    const updated = store.wrongQuestions.map(wq =>
      wq.id === selected.id ? { ...wq, errorTags: allTags } : wq
    );
    useAppStore.setState({ wrongQuestions: updated });
  };

  const generateTargetedPractice = () => {
    if (!selected) return;
    const tags = selected.errorTags && selected.errorTags.length > 0
      ? selected.errorTags as ErrorTagType[]
      : ['其他'];
    const totalQuestions = Math.min(Math.max(tags.length + 2, 3), 5);
    const questionsPerTag = Math.ceil(totalQuestions / tags.length);
    const similar = tags.flatMap(tag => {
      return Array.from({ length: questionsPerTag }, (_, i) => {
        const base = selected.question.slice(0, 20);
        const tagSpecific: Record<ErrorTagType, { q: string; opts: string[] }> = {
          '概念混淆': {
            q: `（概念辨析）关于「${base}...」相关概念，下列说法正确的是？`,
            opts: selected.options?.length ? selected.options : ['A. 概念甲的定义', 'B. 概念乙的定义', 'C. 易混淆概念对比', 'D. 综合应用判断'],
          },
          '审题失误': {
            q: `（审题训练）仔细阅读：${selected.question.slice(0, 50)}...下列理解正确的是？`,
            opts: selected.options?.length ? [...selected.options].reverse() : ['A. 偷换概念选项', 'B. 以偏概全选项', 'C. 正确理解', 'D. 过度推断选项'],
          },
          '计算错误': {
            q: `（计算变式）同类计算：${base}...，计算结果是？`,
            opts: selected.options?.length ? selected.options : ['A. 计算结果1', 'B. 计算结果2', 'C. 计算结果3', 'D. 计算结果4'],
          },
          '记忆疏漏': {
            q: `（关键词回忆）填空：关于${base}...，核心关键词是？`,
            opts: selected.options?.length ? selected.options : ['A. 关键词1', 'B. 关键词2', 'C. 关键词3', 'D. 关键词4'],
          },
          '方法不当': {
            q: `（方法优化）对于「${base}...」，最优解题方法是？`,
            opts: selected.options?.length ? selected.options : ['A. 方法甲', 'B. 方法乙', 'C. 最优方法', 'D. 方法丁'],
          },
          '时间不足': {
            q: `（快速解题）限时训练：${selected.question.slice(0, 40)}...快速选出正确答案？`,
            opts: selected.options?.length ? selected.options : ['A. 速解选项1', 'B. 速解选项2', 'C. 速解选项3', 'D. 速解选项4'],
          },
          '其他': {
            q: `（变式练习）${selected.question.slice(0, 30)}...的变式题，正确选项是？`,
            opts: selected.options?.length ? selected.options : ['A. 变式选项1', 'B. 变式选项2', 'C. 变式选项3', 'D. 变式选项4'],
          },
        };
        const variant = tagSpecific[tag] || tagSpecific['其他'];
        return {
          id: `sq-${selected.id}-${tag}-${i}-${Date.now()}`,
          question: variant.q,
          options: variant.opts,
          answer: String.fromCharCode(65 + ((i + tag.length) % 4)),
          targetErrorTag: tag,
        };
      });
    }).slice(0, totalQuestions);

    const store = useAppStore.getState();
    const updated = store.wrongQuestions.map(wq =>
      wq.id === selected.id ? { ...wq, similarQuestions: similar } : wq
    );
    useAppStore.setState({ wrongQuestions: updated });
  };

  if (selected && selected.errorTags) {
    const presetTags = selected.errorTags.filter(t => ERROR_TAGS.includes(t as ErrorTagType)) as ErrorTagType[];
    if (presetTags.length > 0 && presetTags.length !== selectedErrorTags.length) {
      setSelectedErrorTags(presetTags);
    }
  }

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

            <div className="p-4 border-b border-brand-100 bg-gradient-to-br from-amber-50/50 to-rose-50/30">
              <h3 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                本周易错章节 TOP3
              </h3>
              {topChapters.length === 0 ? (
                <p className="text-xs text-slate-400">本周暂无新增错题</p>
              ) : (
                <div className="space-y-2">
                  {topChapters.map((item, idx) => (
                    <div key={item.chapter} className="p-2.5 rounded-lg bg-white/70 backdrop-blur-sm border border-amber-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            idx === 0 ? 'bg-rose-500 text-white' : idx === 1 ? 'bg-amber-500 text-white' : 'bg-brand-500 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{item.chapter}</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600">{item.count}题</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                            style={{ width: `${item.ratio}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{item.ratio}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{getSuggestionForChapter(item.chapter)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">暂无错题</div>
              ) : (
                filtered.map((wq, idx) => (
                  <div
                    key={wq.id}
                    onClick={() => {
                      setSelectedId(wq.id);
                      setSelectedErrorTags((wq.errorTags as ErrorTagType[])?.filter(t => ERROR_TAGS.includes(t)) || []);
                      setCustomErrorTag(wq.errorTags?.find(t => !ERROR_TAGS.includes(t as ErrorTagType)) || '');
                    }}
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
                    {wq.errorTags && wq.errorTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wq.errorTags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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

                <div className="glass-panel p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-violet-600 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      错因标签
                    </h3>
                    <button
                      onClick={saveErrorTags}
                      className="text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors font-medium"
                    >
                      保存标签
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ERROR_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleErrorTag(tag)}
                        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                          selectedErrorTags.includes(tag)
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customErrorTag}
                      onChange={(e) => setCustomErrorTag(e.target.value)}
                      placeholder="自定义补充其他错因..."
                      className="input-base flex-1 !py-2 text-sm"
                    />
                  </div>
                  {selected.errorTags && selected.errorTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1.5">已保存标签：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.errorTags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      相似变式练习
                    </h3>
                    <button
                      onClick={generateTargetedPractice}
                      className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:shadow-lg hover:shadow-amber-500/25 transition-all font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      生成针对性练习
                    </button>
                  </div>
                  {selected.similarQuestions && selected.similarQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {selected.similarQuestions.map((sq, i) => (
                        <div key={sq.id} className="p-3 rounded-xl bg-white border border-brand-100">
                          <div className="flex items-center gap-2 mb-2">
                            {sq.targetErrorTag && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100 font-medium">
                                针对：{sq.targetErrorTag}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">第{i + 1}题</span>
                          </div>
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
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      点击右上角按钮生成针对错因的相似练习题
                    </p>
                  )}
                </div>

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
                <p className="text-sm text-slate-400 max-w-xs">从左侧列表选择错题，查看详细解析、错因标签和相似变式练习</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
