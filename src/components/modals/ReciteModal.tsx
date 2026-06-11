import { useState } from 'react';
import { X, FileSearch, ChevronLeft, ChevronRight, CheckCircle2, Brain, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { answerScore } from '@/utils/stringUtils';

export default function ReciteModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const updateKnowledgeMastery = useAppStore(s => s.updateKnowledgeMastery);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [scored, setScored] = useState<{ score: number; delta: number } | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [weakOnly, setWeakOnly] = useState(false);

  if (activeModal !== 'recite') return null;

  const subjects = Array.from(new Set(knowledgePoints.map((kp) => kp.subject)));
  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  let pool = knowledgePoints;
  if (subjectFilter !== 'all') pool = pool.filter((kp) => kp.subject === subjectFilter);
  if (weakOnly) pool = pool.filter((kp) => kp.mastery < 60);
  if (pool.length === 0) pool = knowledgePoints;

  const currentKp = pool[currentIdx % pool.length];

  const handleScore = () => {
    if (!currentKp || !userAnswer.trim()) return;
    const score = answerScore(userAnswer, currentKp.content);
    const delta = score >= 70 ? 10 : score >= 50 ? 3 : -5;
    setScored({ score, delta });
    updateKnowledgeMastery(currentKp.id, delta);
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

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
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

        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSubjectFilter('all');
                setCurrentIdx(0);
                setScored(null);
              }}
              className={`btn-chip !py-1 text-xs ${
                subjectFilter === 'all' ? '!bg-brand-600 !text-white !border-brand-600' : ''
              }`}
            >
              全部
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSubjectFilter(s);
                  setCurrentIdx(0);
                  setScored(null);
                }}
                className={`btn-chip !py-1 text-xs ${
                  subjectFilter === s ? '!bg-brand-600 !text-white !border-brand-600' : ''
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setWeakOnly(!weakOnly)}
              className={`btn-chip !py-1 text-xs ${weakOnly ? '!bg-rose-600 !text-white !border-rose-600' : ''}`}
            >
              仅薄弱点
            </button>
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
              <div className="flex items-center gap-3">
                <span className={`badge ${subjectColors[currentKp.subject] || 'bg-brand-100 text-brand-700'}`}>
                  {currentKp.subject}
                </span>
                <span className="badge badge-brand">{currentKp.chapter}</span>
                <div className="ml-auto flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-violet-600">掌握度 {currentKp.mastery}%</span>
                </div>
              </div>

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

              {(showAnswer || scored) && (
                <div className="glass-panel p-5">
                  <h3 className="text-sm font-semibold text-brand-600 mb-3">📖 参考答案</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{currentKp.content}</p>
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
  );
}
