import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore, FlowType, Message, StudyTask, WrongQuestion, KnowledgePoint, QuizQuestion, QuizRecord, ExamInfo, WeeklyProgress, ModalType } from './types';
import { getRandomGreeting } from '@/data/templates';
import { mockKnowledgePoints, mockSubjects } from '@/data/knowledge';
import { uid } from '@/utils/stringUtils';
import { formatDate, addDays, getWeekDates, getWeekStart, daysBetween } from '@/utils/dateUtils';

const initialMessage: Message = {
  id: 'msg-init',
  role: 'assistant',
  content: getRandomGreeting(),
  type: 'text',
  timestamp: Date.now(),
  suggestions: [
    '📋 帮我制定复习计划',
    '💡 解释一下矛盾普遍性和特殊性',
    '🎯 抽查政治马原知识点',
    '⏱️ 来一套10题综合小测',
    '📊 复盘本周学习',
  ],
};

type Round = 'basic' | 'enhance' | 'sprint';

function getReviewRound(daysToExam: number): Round {
  if (daysToExam <= 30) return 'sprint';
  if (daysToExam <= 90) return 'enhance';
  return 'basic';
}

const taskTitlesByRound: Record<string, Record<Round, string[]>> = {
  '政治': {
    basic: ['马原唯物论部分精读', '马原辩证法核心考点梳理', '毛中特新民主主义革命理论', '毛中特社会主义改造理论', '史纲旧民主主义革命时期', '史纲新民主主义革命时期', '思修人生观与价值观', '思修道德修养精读'],
    enhance: ['马原政经剩余价值理论精讲', '毛中特五位一体总体布局', '史纲社会主义建设探索期', '思修法治观念专项', '政治历年真题选择题精练（一）', '政治历年真题选择题精练（二）', '政治分析题答题模板整理', '时政热点汇总笔记'],
    sprint: ['马原高频考点终极背诵', '毛中特核心押题背诵', '史纲时间轴速记', '思修法律基础必背', '政治模拟卷（一）全真模拟', '政治模拟卷（二）错题复盘', '政治分析题押题背诵', '考前终极知识点串讲'],
  },
  '英语': {
    basic: ['考研核心词汇Unit1-Unit2背诵', '考研核心词汇Unit3-Unit4背诵', '英语阅读Text1精读+长难句分析', '英语阅读Text2精读+长难句分析', '英语语法基础：定语从句专项', '英语语法基础：名词性从句专项', '完形填空基础方法论', '翻译基础：词义选择与语序调整'],
    enhance: ['阅读真题Text1-2限时训练', '阅读真题Text3-4限时训练', '新题型（七选五）方法论+练习', '完形填空真题精练', '翻译真题长难句拆解', '小作文模板：书信类整理', '大作文模板：图画作文整理', '作文仿写练习1篇'],
    sprint: ['高频考词考前速记（一）', '高频考词考前速记（二）', '阅读终极模拟训练', '新题型冲刺训练', '完形填空高频词速记', '作文模板终极背诵', '翻译冲刺精练', '考前模考+错题复盘'],
  },
  '数学': {
    basic: ['高数极限与连续知识点精讲', '高数导数与微分习题精练', '高数中值定理与导数应用', '高数不定积分与定积分', '高数多元函数微分学', '线代行列式与矩阵运算', '线代向量组与线性方程组', '概率论随机变量及其分布'],
    enhance: ['高数积分应用与微分方程', '高数无穷级数专项突破', '线代特征值与特征向量', '线代二次型精讲', '概率论多维随机变量', '概率论数字特征专项', '数学历年真题精练（一）', '数学历年真题精练（二）'],
    sprint: ['高数高频考点终极串讲', '线代核心题型速解', '概率论必背公式默写', '数学模拟卷（一）全真模考', '数学模拟卷（二）错题复盘', '选择填空秒杀技巧训练', '解答题高分模板整理', '考前易错点终极复盘'],
  },
  '专业课': {
    basic: ['专业课第一章核心概念精读', '专业课第二章知识点梳理', '专业课第三章重点笔记', '专业课第四章课后习题', '专业课第五章框架整理', '专业课第六章精读+笔记', '专业课章节练习题（一）', '专业课章节练习题（二）'],
    enhance: ['专业课真题分类精练（一）', '专业课真题分类精练（二）', '专业课核心考点专题突破', '专业课高频题型专项训练', '专业课计算题专题精讲', '专业课论述题答题模板', '专业课历年套卷训练（一）', '专业课历年套卷训练（二）'],
    sprint: ['专业课终极考点背诵（一）', '专业课终极考点背诵（二）', '专业课模拟卷（一）模考', '专业课模拟卷（二）模考', '专业课错题本终极复盘', '专业课高频考点速记', '专业课答题技巧总结', '考前核心知识点串讲'],
  },
};

function getDefaultTaskTitles(subject: string, round: Round): string[] {
  const templates = [
    `${subject}基础知识点精读（一）`,
    `${subject}基础知识点精读（二）`,
    `${subject}章节习题训练（一）`,
    `${subject}章节习题训练（二）`,
    `${subject}核心考点梳理`,
    `${subject}历年真题精练`,
    `${subject}错题复盘总结`,
    `${subject}模拟测试训练`,
  ];
  if (round === 'enhance') {
    return templates.map(t => t.replace('基础', '强化').replace('章节', '分类'));
  }
  if (round === 'sprint') {
    return templates.map(t => t.replace('基础', '冲刺').replace('知识点', '考点'));
  }
  return templates;
}

function generateInitialTasks(examInfo: ExamInfo): StudyTask[] {
  const tasks: StudyTask[] = [];
  const today = new Date();
  const totalMinutes = Math.round(examInfo.dailyHours * 60);
  const priorities: Array<StudyTask['priority']> = ['high', 'medium', 'low'];
  const daysToExam = daysBetween(today, examInfo.examDate);
  const round = getReviewRound(daysToExam);

  const weightMap: Record<string, number> = {
    '政治': 0.2,
    '英语': 0.2,
    '数学': 0.3,
    '专业课': 0.3,
  };

  const hitWeightSum = examInfo.subjects.reduce((sum, s) => sum + (weightMap[s] ?? 0), 0);
  const hitSubjects = examInfo.subjects.filter(s => weightMap[s] !== undefined);
  const unhitSubjects = examInfo.subjects.filter(s => weightMap[s] === undefined);
  const defaultWeight = 1 / examInfo.subjects.length;

  const normalizedWeights: Record<string, number> = {};

  if (hitWeightSum === 0) {
    examInfo.subjects.forEach(s => {
      normalizedWeights[s] = defaultWeight;
    });
  } else if (unhitSubjects.length > 0) {
    hitSubjects.forEach(s => {
      normalizedWeights[s] = weightMap[s];
    });
    const remainingWeight = 1 - hitWeightSum;
    const unhitWeight = remainingWeight / unhitSubjects.length;
    unhitSubjects.forEach(s => {
      normalizedWeights[s] = unhitWeight;
    });
  } else {
    if (hitWeightSum === 1) {
      hitSubjects.forEach(s => {
        normalizedWeights[s] = weightMap[s];
      });
    } else {
      hitSubjects.forEach(s => {
        normalizedWeights[s] = weightMap[s] / hitWeightSum;
      });
    }
  }

  for (let day = 0; day < 14; day++) {
    const date = formatDate(addDays(today, day));
    let assignedMinutes = 0;
    const subjectMinutes: Record<string, number> = {};

    examInfo.subjects.forEach((subject, idx) => {
      subjectMinutes[subject] = Math.floor(totalMinutes * normalizedWeights[subject]);
      assignedMinutes += subjectMinutes[subject];
    });

    let diff = totalMinutes - assignedMinutes;
    if (diff !== 0 && examInfo.subjects.length > 0) {
      const sortedByWeight = [...examInfo.subjects].sort((a, b) => normalizedWeights[b] - normalizedWeights[a]);
      let i = 0;
      while (diff > 0 && i < sortedByWeight.length) {
        subjectMinutes[sortedByWeight[i]] += 1;
        diff -= 1;
        i += 1;
      }
    }

    examInfo.subjects.forEach((subject, sIdx) => {
      const subjTotal = subjectMinutes[subject];
      const taskCount = subjTotal <= 60 ? 2 : 3;
      const baseMin = Math.floor(subjTotal / taskCount);
      const remainder = subjTotal - baseMin * taskCount;
      const titlePool = taskTitlesByRound[subject]?.[round] || getDefaultTaskTitles(subject, round);

      for (let t = 0; t < taskCount; t++) {
        const duration = baseMin + (t < remainder ? 1 : 0);
        const titleIdx = (day * 3 + sIdx * 2 + t) % titlePool.length;
        tasks.push({
          id: uid('task-'),
          title: titlePool[titleIdx],
          subject,
          date,
          duration,
          completed: false,
          priority: priorities[(day + sIdx + t) % 3],
        });
      }
    });
  }
  return tasks;
}

function generateInitialProgress(): WeeklyProgress[] {
  const weekDates = getWeekDates();
  const weekStart = getWeekStart();
  const existing: WeeklyProgress[] = [];
  const weekDates2 = getWeekDates(addDays(weekStart, -7));
  const prevWeekDates = weekDates2.filter(d => d < weekStart);
  for (const d of prevWeekDates) {
    existing.push({ date: d, plannedHours: 0, actualHours: Math.floor(Math.random() * 3) + 3, tasksCompleted: Math.floor(Math.random() * 4) + 3, tasksTotal: 8 });
  }
  for (const d of weekDates) {
    existing.push({ date: d, plannedHours: 0, actualHours: 0, tasksCompleted: 0, tasksTotal: 8 });
  }
  return existing;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      return {
        messages: [initialMessage],
        flowState: { currentFlow: 'idle' as FlowType, step: 0, context: {} },
        examInfo: null,
        tasks: [],
        wrongQuestions: [],
        knowledgePoints: mockKnowledgePoints,
        subjects: mockSubjects,
        quizRecords: [],
        weeklyProgress: generateInitialProgress(),
        isTyping: false,
        activeModal: null,
        currentQuiz: null,
        currentQuizIndex: 0,
        currentKnowledgeIndex: 0,
        selectedChapters: [],

        addMessage: (msg) => set(s => ({
          messages: [...s.messages, { ...msg, id: uid('msg-'), timestamp: Date.now() }],
        })),

        clearMessages: () => set({ messages: [] }),

        setFlow: (flow, step = 0, context = {}) => set(s => ({
          flowState: {
            currentFlow: flow,
            step,
            context: flow === s.flowState.currentFlow ? { ...s.flowState.context, ...context } : context,
          },
        })),

        setTyping: (typing) => set({ isTyping: typing }),

        setExamInfo: (info) => set(s => {
          if (!info) {
            return { examInfo: null };
          }
          let progress = s.weeklyProgress;
          if (!progress || progress.length === 0) {
            progress = generateInitialProgress();
          }
          progress = progress.map(p => ({ ...p, plannedHours: info.dailyHours }));
          return {
            examInfo: info,
            tasks: generateInitialTasks(info),
            weeklyProgress: progress,
          };
        }),

        addTask: (task) => set(s => ({ tasks: [...s.tasks, task] })),

        toggleTask: (id) => set(s => {
          const task = s.tasks.find(t => t.id === id);
          if (!task) return {};
          const newCompleted = !task.completed;
          const deltaHours = task.duration / 60;
          const date = task.date;
          const tasksForDate = s.tasks.filter(t => t.date === date);
          const tasksTotal = tasksForDate.length;

          let existingProgress = s.weeklyProgress.find(p => p.date === date);
          let baseActual = existingProgress?.actualHours ?? 0;
          let baseCompleted = existingProgress?.tasksCompleted ?? 0;

          if (task.completed) {
            baseActual -= deltaHours;
            baseCompleted -= 1;
          }

          const newActual = newCompleted ? baseActual + deltaHours : baseActual;
          const newTasksCompleted = newCompleted ? baseCompleted + 1 : baseCompleted;

          const updatedProgress: WeeklyProgress = existingProgress
            ? { ...existingProgress, actualHours: newActual, tasksCompleted: Math.max(0, newTasksCompleted), tasksTotal }
            : { date, plannedHours: s.examInfo?.dailyHours ?? 0, actualHours: newActual, tasksCompleted: Math.max(0, newTasksCompleted), tasksTotal };

          const newWeeklyProgress = s.weeklyProgress.some(p => p.date === date)
            ? s.weeklyProgress.map(p => p.date === date ? updatedProgress : p)
            : [...s.weeklyProgress, updatedProgress];

          return {
            tasks: s.tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t),
            weeklyProgress: newWeeklyProgress,
          };
        }),

        updateWeeklyProgress: (date, patch) => set(s => {
          const existing = s.weeklyProgress.find(p => p.date === date);
          if (existing) {
            return {
              weeklyProgress: s.weeklyProgress.map(p => p.date === date ? { ...p, ...patch } : p),
            };
          }
          return {
            weeklyProgress: [...s.weeklyProgress, {
              date,
              plannedHours: patch.plannedHours ?? s.examInfo?.dailyHours ?? 0,
              actualHours: patch.actualHours ?? 0,
              tasksCompleted: patch.tasksCompleted ?? 0,
              tasksTotal: patch.tasksTotal ?? 0,
            }],
          };
        }),

        getTodayPlannedMinutes: () => {
          const state = useAppStore.getState();
          const today = formatDate(new Date());
          return state.tasks.filter(t => t.date === today).reduce((sum, t) => sum + t.duration, 0);
        },

        getTodayCompletedMinutes: () => {
          const state = useAppStore.getState();
          const today = formatDate(new Date());
          return state.tasks.filter(t => t.date === today && t.completed).reduce((sum, t) => sum + t.duration, 0);
        },

        addWrongQuestion: (q) => set(s => ({ wrongQuestions: [...s.wrongQuestions, q] })),

        reviewWrongQuestion: (id) => set(s => ({
          wrongQuestions: s.wrongQuestions.map(q => {
            if (q.id !== id) return q;
            const dates = [1, 2, 4, 7, 15, 30];
            const idx = Math.min(q.reviewCount, dates.length - 1);
            return {
              ...q,
              reviewCount: q.reviewCount + 1,
              nextReviewDate: formatDate(addDays(new Date(), dates[idx])),
            };
          }),
        })),

        updateKnowledgeMastery: (id, delta) => set(s => ({
          knowledgePoints: s.knowledgePoints.map(kp => {
            if (kp.id !== id) return kp;
            return {
              ...kp,
              mastery: Math.max(0, Math.min(100, kp.mastery + delta)),
              lastReviewAt: Date.now(),
              nextReviewDate: formatDate(addDays(new Date(), 3)),
            };
          }),
        })),

        updateKnowledgeReviewDate: (id, score) => set(s => ({
          knowledgePoints: s.knowledgePoints.map(kp => {
            if (kp.id !== id) return kp;
            const currentCount = kp.reviewCount ?? 0;
            const intervals = [1, 3, 7, 15, 30];
            let intervalDays: number;
            if (score >= 80) {
              intervalDays = 3;
            } else if (score >= 60) {
              intervalDays = 2;
            } else {
              intervalDays = 1;
            }
            const idx = Math.min(currentCount, intervals.length - 1);
            const finalInterval = Math.max(intervalDays, intervals[idx] ?? 1);
            return {
              ...kp,
              reviewCount: currentCount + 1,
              lastReviewAt: Date.now(),
              nextReviewDate: formatDate(addDays(new Date(), finalInterval)),
            };
          }),
        })),

        addQuizRecord: (record) => set(s => ({ quizRecords: [...s.quizRecords, record] })),

        setActiveModal: (modal: ModalType) => set({ activeModal: modal }),

        setCurrentQuiz: (quiz: QuizQuestion[] | null) => set({ currentQuiz: quiz, currentQuizIndex: 0 }),

        setCurrentQuizIndex: (idx: number) => set({ currentQuizIndex: idx }),

        answerQuizQuestion: (qIdx: number, ansIdx: number) => set(s => {
          if (!s.currentQuiz) return {};
          const newQuiz = [...s.currentQuiz];
          newQuiz[qIdx] = { ...newQuiz[qIdx], userAnswer: ansIdx };
          return { currentQuiz: newQuiz };
        }),

        setCurrentKnowledgeIndex: (idx: number) => set({ currentKnowledgeIndex: idx }),

        setSelectedChapters: (chapters: string[]) => set({ selectedChapters: chapters }),

        resetAll: () => set({
          messages: [initialMessage],
          flowState: { currentFlow: 'idle' as FlowType, step: 0, context: {} },
          examInfo: null,
          tasks: [],
          wrongQuestions: [],
          quizRecords: [],
          currentQuiz: null,
          currentQuizIndex: 0,
        }),

        addMockData: () => set(s => {
          const examInfo: ExamInfo = {
            name: '2026年全国硕士研究生招生考试',
            subjects: ['政治', '英语', '数学', '专业课'],
            examDate: formatDate(addDays(new Date(), 180)),
            dailyHours: 6,
          };
          const tasks = generateInitialTasks(examInfo);
          const wrongQuestions: WrongQuestion[] = [
            {
              id: uid('wq-'),
              subject: '政治',
              chapter: '马克思主义哲学',
              question: '物质和意识的对立只有在非常有限的范围内才有绝对的意义，超出这个范围便是相对的了。这个范围是指？',
              options: ['A. 物质和意识何者为第一性', 'B. 物质和意识是否具有同一性', 'C. 物质和意识何者更重要', 'D. 物质和意识何者与社会生活的关系更密切'],
              userAnswer: 'B',
              correctAnswer: 'A',
              analysis: '列宁指出：物质和意识的对立，仅在承认什么是第一性和什么是第二性的认识论基本问题范围内才有绝对意义。',
              addedAt: Date.now() - 86400000,
              reviewCount: 1,
              nextReviewDate: formatDate(new Date()),
            },
            {
              id: uid('wq-'),
              subject: '数学',
              chapter: '矩阵',
              question: '设A是3阶方阵，det(A)=2，det(2A⁻¹)等于？',
              options: ['A. 4', 'B. 2', 'C. 1', 'D. 8'],
              userAnswer: 'B',
              correctAnswer: 'A',
              analysis: 'det(kA)=kⁿ·det(A)，det(A⁻¹)=1/det(A)。所以det(2A⁻¹)=8·1/2=4',
              addedAt: Date.now() - 172800000,
              reviewCount: 0,
              nextReviewDate: formatDate(addDays(new Date(), 1)),
            },
          ];
          return { examInfo, tasks, wrongQuestions: [...s.wrongQuestions, ...wrongQuestions] };
        }),
      };
    },
    {
      name: 'study-buddy-store',
      partialize: (s: AppStore) => ({
        messages: s.messages,
        flowState: s.flowState,
        examInfo: s.examInfo,
        tasks: s.tasks,
        wrongQuestions: s.wrongQuestions,
        knowledgePoints: s.knowledgePoints,
        quizRecords: s.quizRecords,
        weeklyProgress: s.weeklyProgress,
      }),
    },
  ) as any,
);

export function useFlowState() {
  return useAppStore(s => s.flowState);
}

export function useMessages() {
  return useAppStore(s => s.messages);
}

export function useCurrentFlow(): FlowType {
  return useAppStore(s => s.flowState.currentFlow);
}
