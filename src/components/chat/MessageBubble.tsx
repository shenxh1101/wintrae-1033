import { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle, BookOpen, Target, TrendingUp, Award } from 'lucide-react';
import type { Message, StudyTask, WrongQuestion, QuizQuestion } from '@/store/types';
import { useAppStore } from '@/store/useAppStore';
import { processUserMessage } from '@/engine/ChatEngine';
import { cn } from '@/lib/utils';

function renderMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-brand-800">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderContentWithNewlines(text: string) {
  return text.split('\n').map((line, i) => (
    <div key={i}>{line ? renderMarkdownBold(line) : '\u00A0'}</div>
  ));
}

function PriorityBadge({ priority }: { priority: StudyTask['priority'] }) {
  const config = {
    high: { cls: 'badge-danger', label: '高优' },
    medium: { cls: 'badge-accent', label: '中优' },
    low: { cls: 'badge-brand', label: '低优' },
  };
  const { cls, label } = config[priority];
  return <span className={cls}>{label}</span>;
}

function TaskListCard({ tasks }: { tasks: StudyTask[] }) {
  const toggleTask = useAppStore(s => s.toggleTask);
  return (
    <div className="mt-3 space-y-2">
      {tasks.map(task => (
        <div
          key={task.id}
          className={cn(
            'card-base card-hover p-3 flex items-start gap-3',
            task.completed && 'opacity-60'
          )}
        >
          <button
            onClick={() => toggleTask(task.id)}
            className={cn(
              'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
              task.completed
                ? 'bg-success-500 border-success-500 text-white'
                : 'border-slate-300 hover:border-brand-400'
            )}
          >
            {task.completed && <Check size={12} strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge-brand"><BookOpen size={12} />{task.subject}</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <h4 className={cn('font-medium text-slate-800 text-sm', task.completed && 'line-through text-slate-500')}>
              {task.title}
            </h4>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              <Clock size={12} />
              <span>{task.duration} 分钟</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WrongQuestionCard({ wq }: { wq: WrongQuestion }) {
  return (
    <div className="mt-3 card-base p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="badge-brand"><BookOpen size={12} />{wq.subject}</span>
        <span className="badge-accent"><Target size={12} />{wq.chapter}</span>
      </div>
      <div className="text-sm text-slate-800 leading-relaxed">
        <strong className="text-slate-900">题干：</strong>
        <div className="mt-1">{wq.question}</div>
      </div>
      {wq.options && wq.options.length > 0 && (
        <div className="space-y-1">
          {wq.options.map((opt, i) => (
            <div
              key={i}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border',
                String.fromCharCode(65 + i) === wq.correctAnswer
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : String.fromCharCode(65 + i) === wq.userAnswer
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
          <div className="text-xs text-rose-500 mb-1 font-medium">你的答案</div>
          <div className="font-bold text-rose-700 flex items-center gap-1">
            <XCircle size={14} />{wq.userAnswer}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="text-xs text-emerald-600 mb-1 font-medium">正确答案</div>
          <div className="font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={14} />{wq.correctAnswer}
          </div>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-100">
        <div className="text-xs text-brand-600 mb-1 font-medium">💡 解析</div>
        <div className="text-sm text-brand-800 leading-relaxed">{wq.analysis}</div>
      </div>
    </div>
  );
}

function OptionsButtons({ options }: { options: string[] }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => processUserMessage(opt)}
          className="btn-chip justify-start !py-2.5 !px-4 text-left"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function QuizResultCard({ questions, timeSpent }: { questions: QuizQuestion[]; timeSpent?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const correctCount = questions.filter(q => q.userAnswer === q.correctIndex).length;
  const score = Math.round(correctCount / questions.length * 100);
  const circumference = 2 * Math.PI * 28;
  const progress = (score / 100) * circumference;

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mt-3 card-base p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="28" fill="none" stroke="#BFDBFE" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="28"
              fill="none"
              stroke="url(#quizGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="quizGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-brand-700">{score}</span>
            <span className="text-[10px] text-slate-500">得分</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Award className="text-accent-500" size={18} />
            <span className="font-semibold text-slate-800">
              答对 {correctCount}/{questions.length} 题
            </span>
          </div>
          {typeof timeSpent === 'number' && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={14} />
              <span>用时 {Math.floor(timeSpent / 60)}分{timeSpent % 60}秒</span>
            </div>
          )}
          <div className="text-sm text-slate-600">
            {score >= 80 ? '🎉 太棒了！基础非常扎实！' : score >= 60 ? '👍 不错，继续加油！' : '💪 还需努力，多练习薄弱知识点！'}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {questions.map((q, idx) => {
          const isCorrect = q.userAnswer === q.correctIndex;
          const isOpen = expanded.has(q.id);
          return (
            <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(q.id)}
                className={cn(
                  'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                  isCorrect ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'bg-rose-50/70 hover:bg-rose-50'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  )}
                >
                  {isCorrect ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">✕</span>}
                </div>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                  第{idx + 1}题：{q.question.slice(0, 30)}...
                </span>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-3 py-3 border-t border-slate-100 space-y-2 bg-white">
                  <div className="text-sm text-slate-800">{q.question}</div>
                  <div className="space-y-1">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs border',
                          optIdx === q.correctIndex
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : q.userAnswer === optIdx
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        )}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg bg-brand-50/70 text-xs text-brand-800 leading-relaxed">
                    💡 {q.analysis}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressChart({ payload }: { payload: any }) {
  const { progress, masteryAvg, completionRate, hourRate } = payload || {};
  const recent = progress || [];
  const maxHours = Math.max(...recent.map((p: any) => Math.max(p.plannedHours, p.actualHours)), 1);

  const metrics = [
    { label: '任务完成率', value: completionRate ?? 0, icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-50', border: 'border-success-100' },
    { label: '时长完成率', value: hourRate ?? 0, icon: Clock, color: 'text-brand-500', bg: 'bg-brand-50', border: 'border-brand-100' },
    { label: '知识掌握度', value: masteryAvg ?? 0, icon: Award, color: 'text-accent-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: '学习天数', value: recent.filter((p: any) => p.actualHours > 0).length, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
  ];

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="mt-3 card-base p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {metrics.map((m, i) => (
          <div key={i} className={cn('p-3 rounded-xl border', m.bg, m.border)}>
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon size={14} className={m.color} />
              <span className="text-[11px] text-slate-600 font-medium">{m.label}</span>
            </div>
            <div className={cn('text-xl font-bold', m.color)}>
              {i === 3 ? m.value : `${m.value}%`}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <TrendingUp size={16} className="text-brand-500" />
          本周学习时长
        </div>
        <div className="flex items-end justify-between gap-2 h-40 px-1">
          {recent.map((p: any, i: number) => {
            const date = new Date(p.date);
            const dayIdx = date.getDay();
            const plannedH = (p.plannedHours / maxHours) * 100;
            const actualH = (p.actualHours / maxHours) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex justify-center gap-1 items-end h-28">
                  <div
                    className="w-3 rounded-t-md bg-gradient-to-t from-brand-300 to-brand-200 transition-all duration-500"
                    style={{ height: `${Math.max(plannedH, 2)}%` }}
                    title={`计划 ${p.plannedHours}h`}
                  />
                  <div
                    className="w-3 rounded-t-md bg-gradient-to-t from-brand-700 to-brand-500 transition-all duration-500"
                    style={{ height: `${Math.max(actualH, 2)}%` }}
                    title={`实际 ${p.actualHours}h`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">周{dayLabels[dayIdx]}</span>
                <span className="text-[10px] text-slate-400">{p.actualHours}h</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-brand-300 to-brand-200" />
            <span className="text-slate-500">计划</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-brand-700 to-brand-500" />
            <span className="text-slate-500">实际</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'task_list':
        return (
          <div>
            <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>
            {message.payload?.tasks && <TaskListCard tasks={message.payload.tasks} />}
          </div>
        );
      case 'card':
        return (
          <div>
            <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>
            {message.payload?.wrongQuestion && <WrongQuestionCard wq={message.payload.wrongQuestion} />}
          </div>
        );
      case 'options':
        return (
          <div>
            <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>
            {message.payload?.options
              ? <OptionsButtons options={message.payload.options} />
              : message.suggestions && message.suggestions.length > 0 && (
                <OptionsButtons options={message.suggestions} />
              )}
          </div>
        );
      case 'quiz':
        return (
          <div>
            <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>
            {message.payload?.questions && (
              <QuizResultCard questions={message.payload.questions} timeSpent={message.payload.timeSpent} />
            )}
          </div>
        );
      case 'chart':
        return (
          <div>
            <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>
            <ProgressChart payload={message.payload} />
          </div>
        );
      default:
        return <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithNewlines(message.content)}</div>;
    }
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end animate-slide-right' : 'justify-start animate-slide-up'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm',
          isUser
            ? 'bg-gradient-to-br from-brand-700 to-brand-500 text-white rounded-2xl rounded-br-sm shadow-lg shadow-brand-500/20'
            : 'bg-white shadow-card rounded-2xl rounded-bl-sm border border-brand-100/50 text-slate-800'
        )}
      >
        {renderContent()}
        {!isUser && message.suggestions && message.suggestions.length > 0 && message.type !== 'options' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {message.suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => processUserMessage(sug)}
                className="btn-chip"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
