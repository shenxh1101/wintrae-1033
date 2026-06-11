import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Timer, CheckCircle2, XCircle, ChevronRight, RefreshCw, Target, AlertTriangle, Plus, Calendar, BookOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getRandomQuestions } from '@/data/questions';
import { uid } from '@/utils/stringUtils';
import { formatDate, getEbbinghausDates, addDays } from '@/utils/dateUtils';
import type { QuizQuestion, QuizRecord, QuizTimeMode, StudyTask } from '@/store/types';

export default function QuizModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const examInfo = useAppStore(s => s.examInfo);
  const addQuizRecord = useAppStore(s => s.addQuizRecord);
  const addWrongQuestion = useAppStore(s => s.addWrongQuestion);
  const wrongQuestions = useAppStore(s => s.wrongQuestions);
  const addTask = useAppStore(s => s.addTask);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);

  const [stage, setStage] = useState<'config' | 'quiz' | 'result'>('config');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [count, setCount] = useState(5);
  const [subjectName, setSubjectName] = useState<string>('综合');
  const [timeMode, setTimeMode] = useState<QuizTimeMode>('unlimited');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(60);
  const [totalMinutes, setTotalMinutes] = useState(20);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [perQuestionRemaining, setPerQuestionRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const perQuestionTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const selectedAnswerRef = useRef<number | null>(null);

  const setAnswer = (v: number | null) => {
    setSelectedAnswer(v);
    selectedAnswerRef.current = v;
  };

  if (activeModal !== 'quiz') return null;

  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  const totalSeconds = useMemo(() => {
    if (timeMode === 'total') return totalMinutes * 60;
    if (timeMode === 'per_question') return perQuestionSeconds * questions.length;
    return 0;
  }, [timeMode, totalMinutes, perQuestionSeconds, questions.length]);

  useEffect(() => {
    if (stage !== 'quiz') return;
    setElapsedSeconds(0);
    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== 'quiz' || timeMode !== 'total') return;
    if (remainingSeconds <= 0) return;
    timerRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeMode]);

  useEffect(() => {
    if (stage !== 'quiz' || timeMode !== 'per_question') return;
    if (perQuestionTimerRef.current) clearInterval(perQuestionTimerRef.current);
    setPerQuestionRemaining(perQuestionSeconds);
    perQuestionTimerRef.current = window.setInterval(() => {
      setPerQuestionRemaining(prev => {
        if (prev <= 1) {
          if (perQuestionTimerRef.current) clearInterval(perQuestionTimerRef.current);
          if (selectedAnswerRef.current !== null) {
            handleNextOrSubmit();
          } else {
            const newAnswers = [...answers];
            newAnswers[currentIdx] = -1;
            setAnswers(newAnswers);
            if (currentIdx < questions.length - 1) {
              setCurrentIdx(currentIdx + 1);
              setAnswer(null);
            } else {
              handleAutoSubmit();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (perQuestionTimerRef.current) clearInterval(perQuestionTimerRef.current);
    };
  }, [stage, timeMode, currentIdx]);

  const handleAutoSubmit = () => {
    const finalAnswers = answers.map((a, i) => a === null ? -1 : a);
    const spent = Math.floor((Date.now() - startTime) / 1000);
    setTimeSpent(spent);
    setStage('result');
    const correctCount = questions.reduce((s, q, i) => s + (finalAnswers[i] === q.correctIndex ? 1 : 0), 0);
    processResults(finalAnswers, spent, correctCount);
  };

  const processResults = (finalAnswers: (number | null)[], spent: number, correctCount: number) => {
    const wrongByChapter: Record<string, { count: number; questions: QuizQuestion[]; knowledgePointIds: string[] }> = {};
    questions.forEach((q, i) => {
      if (finalAnswers[i] !== q.correctIndex) {
        if (!wrongByChapter[q.chapter]) {
          wrongByChapter[q.chapter] = { count: 0, questions: [], knowledgePointIds: [] };
        }
        wrongByChapter[q.chapter].count++;
        wrongByChapter[q.chapter].questions.push(q);
        const kpIds = knowledgePoints
          .filter(kp => kp.chapter === q.chapter)
          .map(kp => kp.id);
        wrongByChapter[q.chapter].knowledgePointIds = kpIds;
      }
    });

    const record: QuizRecord = {
      id: uid('qr-modal-'),
      subject: examInfo?.subjects?.[0] || subjectName,
      totalQuestions: questions.length,
      correctCount,
      timeSpent: spent,
      completedAt: Date.now(),
      questions: questions.map((q, i) => ({ ...q, userAnswer: finalAnswers[i] ?? -1 })),
      timeLimitMode: timeMode,
      timeLimitSeconds: totalSeconds || undefined,
      wrongByChapter: Object.entries(wrongByChapter).map(([chapter, data]) => ({
        chapter,
        count: data.count,
        knowledgePointIds: data.knowledgePointIds,
      })),
    };
    addQuizRecord(record);

    questions.forEach((q, i) => {
      if (finalAnswers[i] !== q.correctIndex) {
        const existingWrong = wrongQuestions.find(wq => wq.question === q.question);
        const reviewCount = existingWrong?.reviewCount ?? 0;
        const intervals = [1, 2, 4, 7, 15, 30];
        const intervalIdx = Math.min(reviewCount, intervals.length - 1);
        addWrongQuestion({
          id: uid('wq-modal-'),
          subject: q.subject,
          chapter: q.chapter,
          question: q.question,
          options: q.options,
          userAnswer: (finalAnswers[i] ?? -1) >= 0 ? String.fromCharCode(65 + (finalAnswers[i] ?? 0)) : '未作答',
          correctAnswer: String.fromCharCode(65 + q.correctIndex),
          analysis: q.analysis,
          addedAt: Date.now(),
          reviewCount: reviewCount,
          nextReviewDate: formatDate(addDays(new Date(), intervals[intervalIdx])),
        });
      }
    });
  };

  const startQuiz = () => {
    const qs = getRandomQuestions(count, subjectName === '综合' ? undefined : subjectName);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIdx(0);
    setAnswer(null);
    setStartTime(Date.now());
    setTimeSpent(0);
    if (timeMode === 'total') {
      setRemainingSeconds(totalMinutes * 60);
    } else if (timeMode === 'per_question') {
      setPerQuestionRemaining(perQuestionSeconds);
    }
    setStage('quiz');
  };

  const handleNextOrSubmit = () => {
    if (selectedAnswerRef.current === null) return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = selectedAnswerRef.current;
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswer(answers[currentIdx + 1] ?? null);
    } else {
      const spent = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(spent);
      setStage('result');
      const correctCount = questions.reduce((s, q, i) => s + (newAnswers[i] === q.correctIndex ? 1 : 0), 0);
      processResults(newAnswers, spent, correctCount);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    const newAnswers = [...answers];
    if (selectedAnswerRef.current !== null) {
      newAnswers[currentIdx] = selectedAnswerRef.current;
    }
    setAnswers(newAnswers);
    setCurrentIdx(idx);
    setAnswer(newAnswers[idx] ?? null);
  };

  const addWrongChaptersToPlan = () => {
    const wrongChaptersSet = new Set<string>();
    const wrongSubjectsSet = new Set<string>();
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        wrongChaptersSet.add(q.chapter);
        wrongSubjectsSet.add(q.subject);
      }
    });
    const chapters = Array.from(wrongChaptersSet);
    const subjects = Array.from(wrongSubjectsSet);
    const today = formatDate(new Date());
    chapters.forEach((chapter, idx) => {
      const task: StudyTask = {
        id: uid('task-review-'),
        title: `复习错题：${chapter}`,
        subject: subjects[idx % subjects.length],
        date: formatDate(addDays(new Date(), Math.min(idx, 3))),
        duration: 30,
        completed: false,
        priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      };
      addTask(task);
    });
    alert(`已将 ${chapters.length} 个薄弱章节加入复习计划！`);
  };

  const correctCount = questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const wrongQuestionsByChapter = useMemo(() => {
    const map: Record<string, { count: number; questions: { question: QuizQuestion; userAns: number | null; idx: number }[] }> = {};
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        if (!map[q.chapter]) {
          map[q.chapter] = { count: 0, questions: [] };
        }
        map[q.chapter].count++;
        map[q.chapter].questions.push({ question: q, userAns: answers[i], idx: i });
      }
    });
    return map;
  }, [questions, answers]);

  const handleRestart = () => {
    setStage('config');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswer(null);
    setAnswers([]);
    setTimeSpent(0);
    setRemainingSeconds(0);
    setPerQuestionRemaining(0);
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (perQuestionTimerRef.current) clearInterval(perQuestionTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimeLow = (timeMode === 'total' && remainingSeconds <= 30) || (timeMode === 'per_question' && perQuestionRemaining <= 30);

  const renderAnswerCard = () => {
    return (
      <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isAnswered = userAns !== null;
          const isCurrent = i === currentIdx;
          const isWrong = stage === 'result' && userAns !== q.correctIndex;
          const isCorrect = stage === 'result' && userAns === q.correctIndex;
          let className = 'w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ';
          if (isWrong) {
            className += 'bg-rose-500 text-white border-2 border-rose-600';
          } else if (isCorrect) {
            className += 'bg-emerald-500 text-white border-2 border-emerald-600';
          } else if (isCurrent) {
            className += 'bg-white text-cyan-700 border-2 border-cyan-500 shadow-md shadow-cyan-500/30';
          } else if (isAnswered) {
            className += 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200';
          } else {
            className += 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200';
          }
          return (
            <button
              key={i}
              onClick={() => stage === 'quiz' && handleJumpToQuestion(i)}
              className={className}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    );
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">时间模式</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setTimeMode('unlimited')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      timeMode === 'unlimited'
                        ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                        : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                    }`}
                  >
                    <Timer className={`w-5 h-5 ${timeMode === 'unlimited' ? 'text-cyan-500' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-semibold text-slate-700 text-sm">不限时</div>
                      <div className="text-xs text-slate-400">仅记录答题用时，无时间限制</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setTimeMode('per_question')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      timeMode === 'per_question'
                        ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                        : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${timeMode === 'per_question' ? 'text-cyan-500' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-700 text-sm">每题限时</div>
                      <div className="text-xs text-slate-400">每道题独立计时，超时自动进入下一题</div>
                    </div>
                    {timeMode === 'per_question' && (
                      <select
                        value={perQuestionSeconds}
                        onChange={(e) => setPerQuestionSeconds(Number(e.target.value))}
                        className="text-sm border border-cyan-300 rounded-lg px-2 py-1 bg-white text-slate-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Array.from({ length: 16 }, (_, i) => (i + 1) * 30).filter(n => n >= 30 && n <= 180).map(n => (
                          <option key={n} value={n}>{n}秒</option>
                        ))}
                      </select>
                    )}
                  </button>
                  <button
                    onClick={() => setTimeMode('total')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      timeMode === 'total'
                        ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                        : 'border-brand-100 bg-white hover:border-brand-200 hover:bg-brand-50/50'
                    }`}
                  >
                    <Timer className={`w-5 h-5 ${timeMode === 'total' ? 'text-cyan-500' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-700 text-sm">整卷限时</div>
                      <div className="text-xs text-slate-400">整套试卷总时限，时间到自动提交</div>
                    </div>
                    {timeMode === 'total' && (
                      <select
                        value={totalMinutes}
                        onChange={(e) => setTotalMinutes(Number(e.target.value))}
                        className="text-sm border border-cyan-300 rounded-lg px-2 py-1 bg-white text-slate-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 5).filter(n => n >= 5 && n <= 60 && n % 5 === 0).map(n => (
                          <option key={n} value={n}>{n}分钟</option>
                        ))}
                      </select>
                    )}
                  </button>
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
            <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`badge ${subjectColors[questions[currentIdx].subject] || 'bg-brand-100 text-brand-700'}`}>
                  {questions[currentIdx].subject}
                </span>
                <span className="badge badge-brand truncate">{questions[currentIdx].chapter}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {timeMode === 'per_question' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">单题剩余</span>
                      <span
                        className={`text-lg font-bold font-mono tabular-nums ${
                          perQuestionRemaining <= 30 ? 'text-rose-500 animate-pulse' : 'text-cyan-600'
                        }`}
                      >
                        {perQuestionRemaining}秒
                      </span>
                    </div>
                  )}
                  {timeMode === 'total' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">总剩余</span>
                      <span
                        className={`text-lg font-bold font-mono tabular-nums ${
                          remainingSeconds <= 30 ? 'text-rose-500 animate-pulse' : 'text-cyan-600'
                        }`}
                      >
                        {formatTime(remainingSeconds)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">已用</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-cyan-600">
                      {formatTime(elapsedSeconds)}
                    </span>
                  </div>
                </div>
                {renderAnswerCard()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      第 {currentIdx + 1} / {questions.length} 题
                    </span>
                  </div>
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
                        onClick={() => setAnswer(i)}
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

            <div className="px-6 py-4 border-t border-brand-100 flex items-center justify-between shrink-0 gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden max-w-md">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              <button
                onClick={handleNextOrSubmit}
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
                {timeMode !== 'unlimited' && ` · ${timeMode === 'per_question' ? '每题限时' : '整卷限时'}`}
              </p>
            </div>

            {Object.keys(wrongQuestionsByChapter).length > 0 && (
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-slate-700">错题归类分析</h3>
                  </div>
                  <button
                    onClick={addWrongChaptersToPlan}
                    className="btn-primary !py-1.5 !px-3 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    一键加入复习计划
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(wrongQuestionsByChapter).map(([chapter, data]) => {
                    const sampleQuestion = data.questions[0]?.question;
                    const subject = data.questions[0]?.question.subject;
                    return (
                      <div
                        key={chapter}
                        className="p-4 rounded-xl border border-rose-100 bg-rose-50/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="font-semibold text-slate-700 text-sm">{chapter}</span>
                            {subject && (
                              <span className={`badge text-xs ${subjectColors[subject] || 'bg-brand-100 text-brand-700'}`}>
                                {subject}
                              </span>
                            )}
                          </div>
                          <span className="text-rose-600 font-semibold text-sm">
                            {data.count} 题错误
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">
                          <span className="text-slate-500">薄弱知识点：</span>
                          {data.questions.slice(0, 2).map((q, i) => (
                            <span key={i} className="inline-block mr-2 bg-rose-100 text-rose-700 px-2 py-0.5 rounded mt-1">
                              第{q.idx + 1}题
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          建议优先复习「{chapter}」相关章节
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-500">第{i + 1}题</span>
                            <span className={`badge ${subjectColors[q.subject] || 'bg-brand-100 text-brand-700'}`}>
                              {q.subject}
                            </span>
                            <span className="badge badge-brand">{q.chapter}</span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">{q.question}</p>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-slate-500">你的答案：</span>
                              <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                                {userAns !== null && userAns !== undefined && userAns >= 0
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
