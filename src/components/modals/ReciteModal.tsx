import { useState, useMemo } from 'react';
import { X, FileSearch, ChevronLeft, ChevronRight, CheckCircle2, Brain, RefreshCw, ChevronDown, ChevronRight as ChevronRightIcon, Calendar, CheckSquare, Square, Minus, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { answerScore, analyzeKeywords } from '@/utils/stringUtils';
import { formatDate, addDays, daysBetween } from '@/utils/dateUtils';
import type { Subject, Chapter } from '@/store/types';

export default function ReciteModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const subjects = useAppStore(s => s.subjects);
  const updateKnowledgeMastery = useAppStore(s => s.updateKnowledgeMastery);
  const updateKnowledgeReviewDate = useAppStore(s => s.updateKnowledgeReviewDate);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [scored, setScored] = useState<{ score: number; delta: number } | null>(null);
  const [weakOnly, setWeakOnly] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

  if (activeModal !== 'recite') return null;

  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getAllLeafChapters = (chapters: Chapter[]): Chapter[] => {
    const leaves: Chapter[] = [];
    const traverse = (ch: Chapter) => {
      if (ch.knowledgePoints && ch.knowledgePoints.length > 0) {
        leaves.push(ch);
      }
      if (ch.children) {
        ch.children.forEach(traverse);
      }
    };
    chapters.forEach(traverse);
    return leaves;
  };

  const getAllDescendantLeafIds = (node: Subject | Chapter): string[] => {
    const ids: string[] = [];
    if ('chapters' in node) {
      node.chapters.forEach(ch => ids.push(...getAllDescendantLeafIds(ch)));
    } else {
      if (node.knowledgePoints && node.knowledgePoints.length > 0) {
        ids.push(node.id);
      }
      if (node.children) {
        node.children.forEach(ch => ids.push(...getAllDescendantLeafIds(ch)));
      }
    }
    return ids;
  };

  const isNodeSelected = (node: Subject | Chapter): boolean => {
    const leafIds = getAllDescendantLeafIds(node);
    if (leafIds.length === 0) return false;
    return leafIds.every(id => selectedChapters.has(id));
  };

  const isNodePartial = (node: Subject | Chapter): boolean => {
    const leafIds = getAllDescendantLeafIds(node);
    if (leafIds.length === 0) return false;
    const selectedCount = leafIds.filter(id => selectedChapters.has(id)).length;
    return selectedCount > 0 && selectedCount < leafIds.length;
  };

  const toggleNodeSelect = (node: Subject | Chapter) => {
    const leafIds = getAllDescendantLeafIds(node);
    const isSelected = isNodeSelected(node);
    setSelectedChapters(prev => {
      const next = new Set(prev);
      if (isSelected) {
        leafIds.forEach(id => next.delete(id));
      } else {
        leafIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAllChapters = () => {
    const allLeaves = subjects.flatMap(s => getAllLeafChapters(s.chapters));
    setSelectedChapters(new Set(allLeaves.map(l => l.id)));
  };

  const clearAllChapters = () => {
    setSelectedChapters(new Set());
  };

  const selectedKnowledgePointIds = useMemo(() => {
    const ids = new Set<string>();
    subjects.forEach(subject => {
      const leaves = getAllLeafChapters(subject.chapters);
      leaves.forEach(leaf => {
        if (selectedChapters.has(leaf.id) && leaf.knowledgePoints) {
          leaf.knowledgePoints.forEach(kpId => ids.add(kpId));
        }
      });
    });
    return ids;
  }, [subjects, selectedChapters]);

  const selectedKpCount = selectedKnowledgePointIds.size;

  let pool = knowledgePoints;
  if (selectedKpCount > 0) {
    pool = pool.filter(kp => selectedKnowledgePointIds.has(kp.id));
  }
  if (weakOnly) pool = pool.filter((kp) => kp.mastery < 60);
  if (pool.length === 0) pool = knowledgePoints;

  const currentKp = pool[currentIdx % pool.length];

  const keywordAnalysis = useMemo(() => {
    if (!scored || !currentKp?.keywords) return null;
    return analyzeKeywords(userAnswer, currentKp.keywords);
  }, [scored, userAnswer, currentKp]);

  const handleScore = () => {
    if (!currentKp || !userAnswer.trim()) return;
    const score = answerScore(userAnswer, currentKp.content);
    const delta = score >= 70 ? 10 : score >= 50 ? 3 : -5;
    setScored({ score, delta });
    updateKnowledgeMastery(currentKp.id, delta);
    updateKnowledgeReviewDate(currentKp.id, score);
  };

  const handleNext = () => {
    setCurrentIdx((i) => (i + 1) % pool.length);
    setShowAnswer(false);
    setUserAnswer('');
    setScored(null);
  };

  const handlePrev = () => {
    setCurrentIdx((i) => (i - 1 + pool.length) % pool.length);
    setShowAnswer(false);
    setUserAnswer('');
    setScored(null);
  };

  const renderChapterTree = () => {
    const renderChapter = (chapter: Chapter, depth: number) => {
      const hasChildren = chapter.children && chapter.children.length > 0;
      const isExpanded = expandedNodes.has(chapter.id);
      const isSelected = isNodeSelected(chapter);
      const isPartial = isNodePartial(chapter);
      const kpCount = getAllDescendantLeafIds(chapter).reduce((sum, id) => {
        const leaf = subjects.flatMap(s => getAllLeafChapters(s.chapters)).find(l => l.id === id);
        return sum + (leaf?.knowledgePoints?.length || 0);
      }, 0);

      return (
        <div key={chapter.id}>
          <div
            className={`flex items-center gap-1 py-1.5 pr-2 rounded hover:bg-brand-50 cursor-pointer`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(chapter.id)}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <button
              onClick={() => toggleNodeSelect(chapter)}
              className="w-5 h-5 flex items-center justify-center"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-100" />
              ) : isPartial ? (
                <Minus className="w-4 h-4 text-brand-600 fill-brand-100" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <span className="text-sm text-slate-700 flex-1 truncate">{chapter.name}</span>
            {kpCount > 0 && (
              <span className="text-xs text-slate-400">{kpCount}</span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div>
              {chapter.children!.map(ch => renderChapter(ch, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return subjects.map(subject => {
      const isExpanded = expandedNodes.has(subject.id);
      const isSelected = isNodeSelected(subject);
      const isPartial = isNodePartial(subject);
      const kpCount = getAllDescendantLeafIds(subject).reduce((sum, id) => {
        const leaf = subjects.flatMap(s => getAllLeafChapters(s.chapters)).find(l => l.id === id);
        return sum + (leaf?.knowledgePoints?.length || 0);
      }, 0);

      return (
        <div key={subject.id} className="mb-1">
          <div
            className="flex items-center gap-1 py-2 px-2 rounded hover:bg-brand-50 cursor-pointer bg-slate-50/50"
          >
            <button
              onClick={() => toggleExpand(subject.id)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleNodeSelect(subject)}
              className="w-5 h-5 flex items-center justify-center"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-100" />
              ) : isPartial ? (
                <Minus className="w-4 h-4 text-brand-600 fill-brand-100" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <span className="text-sm font-semibold text-slate-800 flex-1">{subject.name}</span>
            <span className="text-xs text-slate-400">{kpCount}</span>
          </div>
          {isExpanded && (
            <div>
              {subject.chapters.map(ch => renderChapter(ch, 1))}
            </div>
          )}
        </div>
      );
    });
  };

  const renderReviewCard = () => {
    if (!scored || !currentKp) return null;
    const reviewCount = currentKp.reviewCount ?? 0;
    let intervalDays: number;
    if (scored.score >= 80) {
      intervalDays = 3;
    } else if (scored.score >= 60) {
      intervalDays = 2;
    } else {
      intervalDays = 1;
    }
    const nextDate = formatDate(addDays(new Date(), intervalDays));
    const dateObj = new Date(nextDate);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    return (
      <div className="glass-panel p-5 bg-gradient-to-br from-violet-50/80 to-indigo-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">复习安排</div>
            <div className="text-xs text-slate-500">基于艾宾浩斯遗忘曲线</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">下次复习</div>
            <div className="text-lg font-bold text-violet-600">
              {dateObj.getMonth() + 1}/{dateObj.getDate()}
            </div>
            <div className="text-xs text-slate-400">{weekdays[dateObj.getDay()]}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">间隔天数</div>
            <div className="text-lg font-bold text-indigo-600">{intervalDays} 天</div>
            <div className="text-xs text-slate-400">
              {scored.score >= 80 ? '掌握良好' : scored.score >= 60 ? '基本掌握' : '需加强'}
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">第几次复习</div>
            <div className="text-lg font-bold text-fuchsia-600">第 {reviewCount} 次</div>
            <div className="text-xs text-slate-400">共 {Math.min(reviewCount, 5)} 阶段</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">背诵抽查</h2>
              <p className="text-xs text-slate-500">强化记忆，深度掌握</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-brand-100 flex flex-col shrink-0 bg-slate-50/30">
            <div className="px-4 py-3 border-b border-brand-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">选择章节</span>
              <span className="text-xs text-brand-600 font-medium">
                已选 {selectedKpCount} 个知识点
              </span>
            </div>
            <div className="px-4 py-2 border-b border-brand-100 flex items-center gap-2">
              <button
                onClick={selectAllChapters}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                全选
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={clearAllChapters}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                取消全选
              </button>
              <div className="ml-auto">
                <button
                  onClick={() => setWeakOnly(!weakOnly)}
                  className={`btn-chip !py-0.5 !px-2 text-xs ${weakOnly ? '!bg-rose-600 !text-white !border-rose-600' : ''}`}
                >
                  仅薄弱
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              {renderChapterTree()}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {currentKp && (
                  <>
                    <span className={`badge ${subjectColors[currentKp.subject] || 'bg-brand-100 text-brand-700'}`}>
                      {currentKp.subject}
                    </span>
                    <span className="badge badge-brand">{currentKp.chapter}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <Brain className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-violet-600">掌握度 {currentKp.mastery}%</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>
                  {currentIdx + 1} / {pool.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-lg border border-brand-200 hover:bg-brand-50 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-8 h-8 rounded-lg border border-brand-200 hover:bg-brand-50 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              {currentKp ? (
                <div className="space-y-6">
                  <div className="glass-panel p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
                    <div className="flex items-center gap-2 mb-4">
                      <FileSearch className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-lg text-slate-800">请背诵并简述：{currentKp.title}</h3>
                    </div>
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="请用自己的话描述这个知识点的核心内容...（完成后点击下方评分按钮）"
                      className="input-base min-h-[160px] resize-none"
                      disabled={!!scored}
                    />
                  </div>

                  {scored && keywordAnalysis && (
                    <div className="glass-panel p-5 bg-gradient-to-br from-slate-50 to-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-slate-600" />
                          <h3 className="font-semibold text-slate-700">关键点分析</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">
                            命中 {keywordAnalysis.hit.length}/{keywordAnalysis.hit.length + keywordAnalysis.missed.length}
                          </span>
                          <div className="w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${keywordAnalysis.hitRate * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            {Math.round(keywordAnalysis.hitRate * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {keywordAnalysis.hit.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              命中的关键点
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {keywordAnalysis.hit.map(kw => (
                                <span
                                  key={kw}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200"
                                >
                                  ✅ {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {keywordAnalysis.missed.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-rose-700 mb-2 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              遗漏的关键点
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {keywordAnalysis.missed.map(kw => (
                                <span
                                  key={kw}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-400 text-xs font-medium border border-rose-100 line-through opacity-60"
                                >
                                  ❌ {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {scored && (
                    <div
                      className={`glass-panel p-5 ${
                        scored.score >= 70
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
                          : scored.score >= 50
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50'
                          : 'bg-gradient-to-br from-rose-50 to-pink-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {scored.score >= 60 ? (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                              <RefreshCw className="w-6 h-6 text-rose-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-slate-500">背诵评分</div>
                            <div
                              className={`text-3xl font-bold ${
                                scored.score >= 70
                                  ? 'text-emerald-600'
                                  : scored.score >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {scored.score}
                              <span className="text-lg">/100</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500 mb-1">掌握度变化</div>
                          <div
                            className={`text-xl font-bold ${
                              scored.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {scored.delta >= 0 ? '+' : ''}
                            {scored.delta}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        {scored.score >= 80
                          ? '⭐ 太棒了！掌握得非常好，继续保持！'
                          : scored.score >= 60
                          ? '👍 不错！核心要点都说到了，细节还可以再完善。'
                          : '📚 还需要加强哦，建议对照参考答案再复习一遍。'}
                      </p>
                    </div>
                  )}

                  {scored && renderReviewCard()}

                  {(showAnswer || scored) && (
                    <div className="glass-panel p-5">
                      <h3 className="text-sm font-semibold text-brand-600 mb-3">📖 参考答案</h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{currentKp.content}</p>
                      {currentKp.keywords && currentKp.keywords.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-brand-100">
                          <div className="text-xs text-slate-500 mb-2">核心关键词</div>
                          <div className="flex flex-wrap gap-1.5">
                            {currentKp.keywords.map(kw => (
                              <span
                                key={kw}
                                className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                  <Brain className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-600 mb-2">暂无知识点</h3>
                  <p className="text-sm text-slate-400">请先加载示例数据或在聊天中开始学习</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-brand-100 flex items-center justify-between gap-3 shrink-0">
              {!showAnswer && !scored ? (
                <button onClick={() => setShowAnswer(true)} className="btn-secondary">
                  查看参考答案
                </button>
              ) : (
                <div />
              )}
              {!scored ? (
                <button onClick={handleScore} disabled={!userAnswer.trim()} className="btn-primary">
                  提交并评分
                </button>
              ) : (
                <button onClick={handleNext} className="btn-primary">
                  下一题
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
