import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore, FlowType, Message, StudyTask, WrongQuestion, KnowledgePoint, QuizQuestion, QuizRecord, ExamInfo, WeeklyProgress, ModalType } from './types';
import { getRandomGreeting } from '@/data/templates';
import { mockKnowledgePoints, mockSubjects } from '@/data/knowledge';
import { uid } from '@/utils/stringUtils';
import { formatDate, addDays, getWeekDates, getWeekStart } from '@/utils/dateUtils';

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

function generateInitialTasks(examInfo: ExamInfo): StudyTask[] {
  const tasks: StudyTask[] = [];
  const today = new Date();
  const priorities: Array<StudyTask['priority']> = ['high', 'medium', 'low'];
  const taskPoolBySubject: Record<string, string[]> = {
    '政治': ['通读马原第一章并做笔记', '整理毛中特核心考点', '做史纲历年真题选择题', '背诵思修重要概念', '做一套政治模拟卷'],
    '英语': ['背诵50个考研单词', '精读阅读理解Text 1-2', '完形填空专项训练', '整理作文模板并仿写', '翻译长难句练习'],
    '数学': ['复习高数极限章节', '做导数习题15道', '线代矩阵运算练习', '概率论公式默写', '模拟测试真题一套'],
    '专业课': ['数据结构算法题练习', '计组存储器章节复习', '操作系统进程同步', '计算机网络TCP协议', '做一套专业课真题'],
  };
  
  for (let day = 0; day < 14; day++) {
    const date = formatDate(addDays(today, day));
    examInfo.subjects.forEach((subject, idx) => {
      const pool = taskPoolBySubject[subject] || [`学习${subject}重点知识`];
      const taskTitle = pool[day % pool.length];
      const perDay = Math.max(1, Math.floor(examInfo.dailyHours / examInfo.subjects.length));
      tasks.push({
        id: uid('task-'),
        title: taskTitle,
        subject,
        date,
        duration: perDay * 60 / examInfo.subjects.length,
        completed: day === 0 && idx % 2 === 0,
        priority: priorities[(day + idx) % 3],
      });
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
    existing.push({ date: d, plannedHours: 5, actualHours: Math.floor(Math.random() * 3) + 3, tasksCompleted: Math.floor(Math.random() * 4) + 3, tasksTotal: 8 });
  }
  for (const d of weekDates) {
    existing.push({ date: d, plannedHours: 5, actualHours: 0, tasksCompleted: 0, tasksTotal: 8 });
  }
  return existing;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      messages: [initialMessage],
      flowState: { currentFlow: 'idle', step: 0, context: {} },
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

      setExamInfo: (info) => set(s => ({
        examInfo: info,
        tasks: info ? generateInitialTasks(info) : s.tasks,
      })),

      addTask: (task) => set(s => ({ tasks: [...s.tasks, task] })),

      toggleTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t),
      })),

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
        flowState: { currentFlow: 'idle', step: 0, context: {} },
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
    }),
    {
      name: 'study-buddy-store',
      partialize: (s) => ({
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
  ),
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
