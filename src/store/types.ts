export type MessageType = 'text' | 'card' | 'quiz' | 'task_list' | 'chart' | 'options';
export type Role = 'user' | 'assistant';
export type FlowType = 'plan' | 'qa' | 'wrongbook' | 'recite' | 'quiz' | 'review' | 'idle';
export type Priority = 'high' | 'medium' | 'low';
export type ModalType = 'wrongbook' | 'progress' | 'plan' | 'recite' | 'quiz' | null;

export type ErrorTagType = '概念混淆' | '审题失误' | '计算错误' | '记忆疏漏' | '方法不当' | '时间不足' | '其他';
export const ERROR_TAGS: ErrorTagType[] = ['概念混淆', '审题失误', '计算错误', '记忆疏漏', '方法不当', '时间不足', '其他'];
export type QuizTimeMode = 'unlimited' | 'per_question' | 'total';

export interface Message {
  id: string;
  role: Role;
  content: string;
  type: MessageType;
  timestamp: number;
  suggestions?: string[];
  payload?: any;
}

export interface ExamInfo {
  name: string;
  subjects: string[];
  examDate: string;
  dailyHours: number;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration: number;
  completed: boolean;
  priority: Priority;
}

export interface WrongQuestion {
  id: string;
  subject: string;
  chapter: string;
  question: string;
  options?: string[];
  userAnswer: string;
  correctAnswer: string;
  analysis: string;
  addedAt: number;
  reviewCount: number;
  nextReviewDate: string;
  similarQuestions?: SimilarQuestion[];
  errorTags?: string[];
  knowledgePointId?: string;
}

export interface SimilarQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  targetErrorTag?: string;
}

export interface KnowledgePoint {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  content: string;
  mastery: number;
  lastReviewAt?: number;
  nextReviewDate?: string;
  keywords?: string[];
  reviewCount?: number;
}

export interface Chapter {
  id: string;
  name: string;
  children?: Chapter[];
  knowledgePoints?: string[];
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface QuizQuestion {
  id: string;
  subject: string;
  chapter: string;
  question: string;
  options: string[];
  correctIndex: number;
  analysis: string;
  userAnswer?: number;
}

export interface QuizRecord {
  id: string;
  subject: string;
  chapter?: string;
  totalQuestions: number;
  correctCount: number;
  timeSpent: number;
  completedAt: number;
  questions: QuizQuestion[];
  timeLimitMode?: 'unlimited' | 'per_question' | 'total';
  timeLimitSeconds?: number;
  wrongByChapter?: { chapter: string; count: number; knowledgePointIds: string[] }[];
}

export interface WeeklyProgress {
  date: string;
  plannedHours: number;
  actualHours: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface FlowState {
  currentFlow: FlowType;
  step: number;
  context: Record<string, any>;
}

export interface QuizPreset {
  subject?: string;
  count?: number;
  timeMode?: QuizTimeMode;
  perQuestionSeconds?: number;
  totalMinutes?: number;
}

export interface AppState {
  messages: Message[];
  flowState: FlowState;
  examInfo: ExamInfo | null;
  tasks: StudyTask[];
  wrongQuestions: WrongQuestion[];
  knowledgePoints: KnowledgePoint[];
  subjects: Subject[];
  quizRecords: QuizRecord[];
  weeklyProgress: WeeklyProgress[];
  isTyping: boolean;
  activeModal: ModalType;
  currentQuiz: QuizQuestion[] | null;
  currentQuizIndex: number;
  currentKnowledgeIndex: number;
  selectedChapters: string[];
  quizPreset: QuizPreset | null;
}

export interface AppActions {
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setFlow: (flow: FlowType, step?: number, context?: Record<string, any>) => void;
  setTyping: (typing: boolean) => void;
  setExamInfo: (info: ExamInfo | null) => void;
  addTask: (task: StudyTask) => void;
  toggleTask: (id: string) => void;
  addWrongQuestion: (q: WrongQuestion) => void;
  reviewWrongQuestion: (id: string) => void;
  updateKnowledgeMastery: (id: string, delta: number) => void;
  updateKnowledgeReviewDate: (id: string, score: number) => void;
  addQuizRecord: (record: QuizRecord) => void;
  setActiveModal: (modal: ModalType) => void;
  setCurrentQuiz: (quiz: QuizQuestion[] | null) => void;
  setCurrentQuizIndex: (idx: number) => void;
  answerQuizQuestion: (questionIdx: number, answerIdx: number) => void;
  setCurrentKnowledgeIndex: (idx: number) => void;
  setSelectedChapters: (chapters: string[]) => void;
  setQuizPreset: (preset: QuizPreset | null) => void;
  clearQuizPreset: () => void;
  resetAll: () => void;
  addMockData: () => void;
  updateWeeklyProgress: (date: string, patch: Partial<WeeklyProgress>) => void;
  getTodayPlannedMinutes: () => number;
  getTodayCompletedMinutes: () => number;
}

export type AppStore = AppState & AppActions;
