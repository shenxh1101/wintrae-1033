import { useState } from 'react';
import { X, Timer, CheckCircle2, XCircle, ChevronRight, RefreshCw, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getRandomQuestions } from '@/data/questions';
import { uid } from '@/utils/stringUtils';
import { formatDate, getEbbinghausDates } from '@/utils/dateUtils';
import type { QuizQuestion, QuizRecord } from '@/store/types';

export default function QuizModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const examInfo = useAppStore(s => s.examInfo);
  const addQuizRecord = useAppStore(s => s.addQuizRecord);
  const addWrongQuestion = useAppStore(s => s.addWrongQuestion);

  const [stage, setStage] = useState<'config' | 'quiz' | 'result'>('config');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [count, setCount] = useState(5);
  const [subjectName, setSubjectName] = useState<string>('综合');

  if (activeModal !== 'quiz') return null;

  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  const startQuiz = () => {
    const qs = getRandomQuestions(count, subjectName === '综合' ? undefined : subjectName);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setStartTime(Date.now());
    setStage('quiz');
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(answers[currentIdx + 1] ?? null);
    } else {
      const spent = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(spent);
      setStage('result');
      const correctCount = questions.reduce((s, q, i) => s + (newAnswers[i] === q.correctIndex ? 1 : 0), 0);
      const record: QuizRecord = {
        id: uid('qr-modal-'),
        subject: examInfo?.subjects?.[0] || subjectName,
        totalQuestions: questions.length,
        correctCount,
        timeSpent: spent,
        completedAt: Date.now(),
        questions: questions.map((q, i) => ({ ...q, userAnswer: newAnswers[i] ?? 0 })),
      };
      addQuizRecord(record);
      questions.forEach((q, i) => {
        if (newAnswers[i] !== q.correctIndex) {
          addWrongQuestion({
            id: uid('wq-modal-'),
            subject: q.subject,
            chapter: q.chapter,
            question: q.question,
            options: q.options,
            userAnswer: String.fromCharCode(65 + (newAnswers[i] ?? 0)),
            correctAnswer: String.fromCharCode(65 + q.correctIndex),
            analysis: q.analysis,
            addedAt: Date.now(),
            reviewCount: 0,
            nextReviewDate: getEbbinghausDates()[0],
          });
        }
      });
    }
  };

  const correctCount = questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const handleRestart = () => {
    setStage('config');
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswers([]);
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">模拟测验</h2>
              <p className="text-xs text-slate-500">限时模拟，实战演练</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {stage === 'config' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/10 to-sky-500/20 flex items-center justify-center mb-4">
                  <Target className="w-10 h-10 text-cyan-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">配置测验参数</h3>
                <p className="text-sm text-slate-500">选择科目和题量，开始模拟测验</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">选择科目</label>
                <div className="grid grid-cols-2 gap-3">
                  {['综合', '政治', '英语', '数学', '专业课'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubjectName(s)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        subjectName === s
                          ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                          : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                      }`}
                    >
                      <div className="font-semibold text-slate-700">{s}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {s === '综合' ? '随机混合各科目' : `${s}专项题目`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  题目数量：<span className="text-cyan-600 font-bold">{count}</span> 题
                </label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>3 题</span>
                  <span>5 题</span>
                  <span>10 题</span>
                </div>
              </div>

              <button onClick={startQuiz} className="btn-primary w-full !py-3.5 text-base">
                <Timer className="w-5 h-5" />
                <span>开始测验</span>
              </button>
            </div>
          </div>
        )}

        {stage === 'quiz' && questions[currentIdx] && (
          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
            <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className={`badge ${subjectColors[questions[currentIdx].subject] || 'bg-brand-100 text-brand-700'}`}>
                  {questions[currentIdx].subject}
                </span>
                <span className="badge badge-brand">{questions[currentIdx].chapter}</span>
              </div>
              <div className="text-sm font-semibold text-slate-600">
                第 <span className="text-cyan-600 text-lg">{currentIdx + 1}</span> / {questions.length} 题
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="glass-panel p-6">
                  <h3 className="font-bold text-lg text-slate-800 leading-relaxed">
                    📝 {questions[currentIdx].question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {questions[currentIdx].options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedAnswer(i)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                            : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${
                            isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-cyan-800 font-medium' : 'text-slate-700'}`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-100 flex items-center justify-between shrink-0">
              <div className="w-full max-w-md h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className="btn-primary ml-6"
              >
                {currentIdx === questions.length - 1 ? '提交答卷' : '下一题'}
                {currentIdx < questions.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
            <div
              className={`glass-panel p-8 text-center ${
                score >= 70
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
                  : score >= 50
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50'
                  : 'bg-gradient-to-br from-rose-50 to-pink-50'
              }`}
            >
              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  score >= 60 ? 'bg-emerald-100' : 'bg-rose-100'
                }`}
              >
                {score >= 60 ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                ) : (
                  <XCircle className="w-12 h-12 text-rose-500" />
                )}
              </div>
              <div
                className={`text-5xl font-bold mb-2 ${
                  score >= 70
                    ? 'text-emerald-600'
                    : score >= 50
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {score}
                <span className="text-2xl">分</span>
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-1">
                {score >= 80
                  ? '🎉 太棒了！掌握得非常好！'
                  : score >= 60
                  ? '👍 不错！继续努力！'
                  : '📚 还需要加强，多复习哦！'}
              </p>
              <p className="text-sm text-slate-500">
                答对 {correctCount}/{questions.length} 题 · 用时 {Math.floor(timeSpent / 60)}分
                {timeSpent % 60}秒
              </p>
            </div>

            <div className="glass-panel p-5">
              <h3 className="font-semibold text-slate-700 mb-4">📋 答题详情</h3>
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const userAns = answers[i];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-slate-500">第{i + 1}题</span>
                            <span className={`badge ${subjectColors[q.subject] || 'bg-brand-100 text-brand-700'}`}>
                              {q.subject}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">{q.question}</p>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-slate-500">你的答案：</span>
                              <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                                {userAns !== null && userAns !== undefined
                                  ? String.fromCharCode(65 + userAns)
                                  : '未作答'}
                              </span>
                              {!isCorrect && (
                                <>
                                  <span className="mx-2 text-slate-300">|</span>
                                  <span className="text-slate-500">正确答案：</span>
                                  <span className="text-emerald-600 font-semibold">
                                    {String.fromCharCode(65 + q.correctIndex)}
                                  </span>
                                </>
                              )}
                            </div>
                            {!isCorrect && (
                              <div className="text-slate-600 mt-2 p-2 rounded-lg bg-white/80">
                                💡 {q.analysis}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="px-6 py-4 border-t border-brand-100 flex items-center justify-end gap-3 shrink-0">
            <button onClick={() => setActiveModal(null)} className="btn-secondary">
              关闭
            </button>
            <button onClick={handleRestart} className="btn-primary">
              <RefreshCw className="w-4 h-4" />
              <span>再来一套</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
