import { ClipboardList, BookX, Brain, Target, BarChart3, FileText, CalendarDays, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, getWeekDates, isToday } from '@/utils/dateUtils';

function RingProgress({ value, size = 64, strokeWidth = 6, color = '#3B82F6' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E0E7FF"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700">{value}%</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const tasks = useAppStore(s => s.tasks);
  const wrongQuestions = useAppStore(s => s.wrongQuestions);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const weeklyProgress = useAppStore(s => s.weeklyProgress);
  const setActiveModal = useAppStore(s => s.setActiveModal);

  const todayStr = formatDate(new Date());
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const todayTasksCount = todayTasks.length;
  const todayCompletedCount = todayTasks.filter(t => t.completed).length;

  const wrongTotal = wrongQuestions.length;

  const masteryAvg = knowledgePoints.length
    ? Math.round(knowledgePoints.reduce((s, kp) => s + kp.mastery, 0) / knowledgePoints.length)
    : 0;

  const weekDates = getWeekDates();
  const weekProgress = weeklyProgress.filter(p => weekDates.includes(p.date));
  const tasksCompleted = weekProgress.reduce((s, p) => s + p.tasksCompleted, 0);
  const tasksTotal = weekProgress.reduce((s, p) => s + p.tasksTotal, 0);
  const weekCompletionRate = tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  const todayReviewWrong = wrongQuestions.filter(wq => isToday(wq.nextReviewDate));

  const thisWeekWrong = wrongQuestions.filter(wq => weekDates.includes(formatDate(new Date(wq.addedAt))));
  const chapterStats: Record<string, number> = {};
  thisWeekWrong.forEach(wq => {
    chapterStats[wq.chapter] = (chapterStats[wq.chapter] || 0) + 1;
  });
  const topWeekChapters = Object.entries(chapterStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const statCards = [
    {
      icon: ClipboardList,
      label: '今日任务',
      value: todayTasksCount > 0 ? `${todayCompletedCount}/${todayTasksCount}` : '0',
      sub: todayTasksCount > 0 ? `完成 ${todayCompletedCount} 项` : '暂无任务',
      gradient: 'from-brand-500 to-brand-600',
      bg: 'bg-brand-50',
      iconColor: 'text-brand-600',
    },
    {
      icon: BookX,
      label: '错题总数',
      value: wrongTotal,
      sub: `今日待复习 ${todayReviewWrong.length} 道`,
      gradient: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: Brain,
      label: '知识掌握',
      value: masteryAvg,
      sub: masteryAvg >= 70 ? '基础扎实' : masteryAvg >= 50 ? '还需巩固' : '需要加强',
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      ring: true,
    },
    {
      icon: Target,
      label: '本周完成',
      value: `${weekCompletionRate}%`,
      sub: weekCompletionRate >= 70 ? '表现优秀' : weekCompletionRate >= 40 ? '稳步推进' : '加油冲刺',
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <aside className="w-80 h-full flex flex-col gap-4 p-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="glass-panel p-3 animate-slide-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.ring ? (
                <RingProgress value={masteryAvg} size={44} strokeWidth={5} color="#10B981" />
              ) : null}
            </div>
            {!card.ring && (
              <div className={`text-xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent leading-tight`}>
                {card.value}
              </div>
            )}
            <div className="text-xs font-semibold text-slate-600 mt-0.5">{card.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {topWeekChapters.length > 0 && (
        <div className="glass-panel p-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">本周易错章节</span>
            </div>
            <button
              onClick={() => setActiveModal('progress')}
              className="text-[10px] text-brand-600 hover:text-brand-700 font-medium"
            >
              查看详情 →
            </button>
          </div>
          <div className="space-y-1.5">
            {topWeekChapters.map(([chapter, count], idx) => (
              <div key={chapter} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-amber-50/80 to-rose-50/50 border border-amber-100/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-700 font-medium truncate">{chapter}</span>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                  {count}题
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-100/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookX className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-semibold text-slate-700">今日待复习错题</span>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {todayReviewWrong.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {todayReviewWrong.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <Brain className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-600">太棒啦！</p>
              <p className="text-xs text-slate-400 mt-1">今日没有待复习的错题</p>
            </div>
          ) : (
            todayReviewWrong.map((wq, idx) => (
              <div
                key={wq.id}
                className="card-base card-hover p-3 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${idx * 40}ms` }}
                onClick={() => setActiveModal('wrongbook')}
              >
                <div className="flex items-start gap-2">
                  <span className={`badge ${
                    wq.subject === '政治' ? 'bg-red-100 text-red-700' :
                    wq.subject === '英语' ? 'bg-blue-100 text-blue-700' :
                    wq.subject === '数学' ? 'bg-purple-100 text-purple-700' :
                    'bg-teal-100 text-teal-700'
                  } shrink-0`}>
                    {wq.subject}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium line-clamp-2 leading-snug">
                      {wq.question}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {wq.reviewCount === 0 ? (
                        <span className="badge bg-amber-100 text-amber-700">首次复习</span>
                      ) : wq.reviewCount >= 3 ? (
                        <span className="badge bg-emerald-100 text-emerald-700">复习 {wq.reviewCount} 次</span>
                      ) : (
                        <span className="badge bg-brand-100 text-brand-700">第 {wq.reviewCount + 1} 次</span>
                      )}
                      <span className="text-[11px] text-slate-400 ml-auto">点击查看 →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 shrink-0">
        <button
          onClick={() => setActiveModal('progress')}
          className="glass-panel p-3 flex flex-col items-center gap-1.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-300">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-slate-600">进度复盘</span>
        </button>
        <button
          onClick={() => setActiveModal('wrongbook')}
          className="glass-panel p-3 flex flex-col items-center gap-1.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform duration-300">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-slate-600">错题本</span>
        </button>
        <button
          onClick={() => setActiveModal('plan')}
          className="glass-panel p-3 flex flex-col items-center gap-1.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-slate-600">学习计划</span>
        </button>
      </div>
    </aside>
  );
}
