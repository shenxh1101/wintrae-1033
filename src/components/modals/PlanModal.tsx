import { X, CalendarDays, CheckCircle2, Clock, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, isToday, countdownText } from '@/utils/dateUtils';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分`;
}

export default function PlanModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const examInfo = useAppStore(s => s.examInfo);
  const tasks = useAppStore(s => s.tasks);
  const toggleTask = useAppStore(s => s.toggleTask);
  const getTodayPlannedMinutes = useAppStore(s => s.getTodayPlannedMinutes);
  const getTodayCompletedMinutes = useAppStore(s => s.getTodayCompletedMinutes);

  if (activeModal !== 'plan') return null;

  const today = formatDate(new Date());
  const todayTasks = tasks.filter(t => t.date === today);
  const futureTasks = tasks.filter(t => t.date > today).slice(0, 20);
  const plannedMinutes = getTodayPlannedMinutes();
  const completedMinutes = getTodayCompletedMinutes();
  const progressPercent = plannedMinutes > 0 ? Math.min(100, Math.round((completedMinutes / plannedMinutes) * 100)) : 0;
  const priorityStyles: Record<string, string> = {
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const subjectColors: Record<string, string> = {
    '政治': 'bg-red-100 text-red-700',
    '英语': 'bg-blue-100 text-blue-700',
    '数学': 'bg-purple-100 text-purple-700',
    '专业课': 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">学习计划</h2>
              <p className="text-xs text-slate-500">合理规划，高效备考</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {examInfo ? (
            <>
              <div className="glass-panel p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800">{examInfo.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">考试日期：{examInfo.examDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                      {countdownText(examInfo.examDate)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">每日目标 {examInfo.dailyHours}h</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {examInfo.subjects.map((s) => (
                    <span key={s} className={`badge ${subjectColors[s] || 'bg-brand-100 text-brand-700'}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-slate-700">今日任务</h3>
                  <span className="badge badge-brand">
                    {todayTasks.filter(t => t.completed).length}/{todayTasks.length}
                  </span>
                </div>
                {todayTasks.length > 0 && (
                  <div className="mb-4 p-4 glass-panel">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">
                        已完成 <span className="font-bold text-brand-600">{completedMinutes}</span> 分钟 / 计划共 <span className="font-bold text-slate-700">{plannedMinutes}</span> 分钟
                      </span>
                      <span className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-brand-600 bg-clip-text text-transparent">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-brand-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {todayTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      暂无今日任务，请先设置考试信息
                    </div>
                  ) : (
                    todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`card-base p-4 flex items-center gap-3 ${task.completed ? 'opacity-60' : ''}`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-300 hover:border-brand-400'
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`badge ${subjectColors[task.subject] || 'bg-brand-100 text-brand-700'}`}>
                              {task.subject}
                            </span>
                            <span className={`badge border ${priorityStyles[task.priority]}`}>
                              {task.priority === 'high' ? '高优' : task.priority === 'medium' ? '中优' : '低优'}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(task.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {futureTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-brand-600" />
                    <h3 className="font-semibold text-slate-700">后续安排</h3>
                  </div>
                  <div className="space-y-2">
                    {futureTasks.map((task) => (
                      <div
                        key={task.id}
                        className="card-base p-3 flex items-center gap-3"
                      >
                        <div className="text-xs text-slate-400 w-16 shrink-0 font-medium">
                          {isToday(task.date) ? '今天' : task.date.slice(5)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{task.title}</p>
                        </div>
                        <span className={`badge ${subjectColors[task.subject] || 'bg-brand-100 text-brand-700'}`}>
                          {task.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mb-4">
                <CalendarDays className="w-10 h-10 text-brand-400" />
              </div>
              <h3 className="font-bold text-slate-700 mb-2">还未设置考试信息</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">
                在聊天中输入「制定复习计划」或点击顶部「加载示例数据」快速体验
              </p>
              <button
                onClick={() => {
                  useAppStore.getState().addMockData();
                }}
                className="btn-primary"
              >
                加载示例数据
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
