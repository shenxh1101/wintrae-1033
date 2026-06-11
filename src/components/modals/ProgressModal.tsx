import { X, BarChart3, TrendingUp, Target, BookX, Brain, Clock, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatDate, addDays } from '@/utils/dateUtils';
import { ERROR_TAGS, type ErrorTagType } from '@/store/types';

const ERROR_TAG_COLORS: Record<ErrorTagType, string> = {
  '概念混淆': '#6366F1',
  '审题失误': '#F59E0B',
  '计算错误': '#EF4444',
  '记忆疏漏': '#8B5CF6',
  '方法不当': '#10B981',
  '时间不足': '#EC4899',
  '其他': '#64748B',
};

const ERROR_TAG_SUGGESTIONS: Record<ErrorTagType, string> = {
  '概念混淆': '建议制作概念对比表格，每天花5分钟辨析易混概念的本质区别。',
  '审题失误': '建议读题时圈画关键词，先明确题目要求再作答，避免答非所问。',
  '计算错误': '建议分步计算、回头验算，总结常见计算陷阱，整理计算失误清单。',
  '记忆疏漏': '建议使用艾宾浩斯记忆曲线，每天安排20分钟进行关键词填空默写。',
  '方法不当': '建议整理同类题型的多种解法，归纳最优解题路径，形成方法库。',
  '时间不足': '建议限时训练，合理分配各题型用时，遇到难题先跳过回头再做。',
  '其他': '建议分析具体原因，针对性制定改进策略，持续复盘优化。',
};

export default function ProgressModal() {
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const weeklyProgress = useAppStore(s => s.weeklyProgress);
  const wrongQuestions = useAppStore(s => s.wrongQuestions);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const quizRecords = useAppStore(s => s.quizRecords);

  if (activeModal !== 'progress') return null;

  const recent = weeklyProgress.slice(-7);
  const plannedTotal = recent.reduce((s, p) => s + p.plannedHours, 0);
  const actualTotal = recent.reduce((s, p) => s + p.actualHours, 0);
  const tasksDone = recent.reduce((s, p) => s + p.tasksCompleted, 0);
  const tasksTotal = recent.reduce((s, p) => s + p.tasksTotal, 0);
  const completionRate = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const hourRate = plannedTotal ? Math.round((actualTotal / plannedTotal) * 100) : 0;
  const wrongReviewed = wrongQuestions.filter((w) => w.reviewCount > 0).length;
  const wrongTotal = wrongQuestions.length;
  const masteryAvg = knowledgePoints.length
    ? Math.round(knowledgePoints.reduce((s, kp) => s + kp.mastery, 0) / knowledgePoints.length)
    : 0;
  const avgQuizScore = quizRecords.length
    ? Math.round(quizRecords.reduce((s, r) => s + (r.correctCount / r.totalQuestions) * 100, 0) / quizRecords.length)
    : 0;

  const chartData = recent.map((p) => ({
    date: p.date.slice(5),
    计划时长: p.plannedHours,
    实际时长: p.actualHours,
    完成任务: p.tasksCompleted,
  }));

  const masteryData = knowledgePoints.slice(0, 10).map((kp) => ({
    name: kp.title.length > 6 ? kp.title.slice(0, 6) + '...' : kp.title,
    掌握度: kp.mastery,
  }));

  const fourteenDaysAgo = formatDate(addDays(new Date(), -14));
  const recentWrong = wrongQuestions.filter(wq => formatDate(new Date(wq.addedAt)) >= fourteenDaysAgo);
  const chapterWrongCount: Record<string, number> = {};
  recentWrong.forEach(wq => {
    chapterWrongCount[wq.chapter] = (chapterWrongCount[wq.chapter] || 0) + 1;
  });
  const weakChapters = Object.entries(chapterWrongCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([chapter, count]) => {
      const chapterKps = knowledgePoints.filter(kp => kp.chapter === chapter);
      const weakestKps = [...chapterKps].sort((a, b) => a.mastery - b.mastery).slice(0, 2);
      return {
        chapter,
        count,
        weakPoints: weakestKps.map(kp => kp.title),
      };
    });

  const weakChapterChartData = weakChapters.map(wc => ({
    name: wc.chapter.length > 8 ? wc.chapter.slice(0, 8) + '...' : wc.chapter,
    fullName: wc.chapter,
    错题数: wc.count,
  }));

  const errorTagCount: Record<string, number> = {};
  wrongQuestions.forEach(wq => {
    if (wq.errorTags && wq.errorTags.length > 0) {
      wq.errorTags.forEach(tag => {
        errorTagCount[tag] = (errorTagCount[tag] || 0) + 1;
      });
    }
  });
  const pieData = Object.entries(errorTagCount).map(([name, value]) => ({
    name,
    value,
  }));
  if (pieData.length === 0 && wrongTotal > 0) {
    pieData.push({ name: '未标注', value: wrongTotal });
  }

  const suggestions: string[] = [];
  if (hourRate < 70) suggestions.push('使用番茄工作法固定每日学习时段，早间黄金时间优先安排薄弱科目。');
  if (completionRate < 60) suggestions.push('将大任务拆分成 25-40 分钟的小任务，完成后勾选会更有成就感。');
  if (masteryAvg < 65) suggestions.push('每天安排 20 分钟进行知识点抽查，重点关注掌握度<50%的条目。');
  if (wrongTotal > 0 && wrongReviewed < wrongTotal) suggestions.push('今天先复习完待复习的错题，再开始新内容的学习。');
  if (weakChapters.length > 0) suggestions.push(`优先攻克薄弱章节：${weakChapters.slice(0, 2).map(w => w.chapter).join('、')}，集中突破易错点。`);
  if (suggestions.length === 0) suggestions.push('继续保持这个节奏！可以适当增加模拟测验频率，提前适应考试节奏。');

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (hourRate >= 70) strengths.push(`学习时长完成率 ${hourRate}%，持续投入很棒！`);
  else weaknesses.push(`学习时长只完成了 ${hourRate}%，目标 ${plannedTotal}h，实际 ${actualTotal}h，需增加投入。`);
  if (completionRate >= 60) strengths.push(`任务完成率 ${completionRate}%，执行力不错！`);
  else weaknesses.push(`任务完成率仅 ${completionRate}%，建议拆分更细的小任务。`);
  if (masteryAvg >= 65) strengths.push(`知识点平均掌握度 ${masteryAvg}%，基础扎实！`);
  else weaknesses.push(`知识点掌握度 ${masteryAvg}%，需要加强背诵抽查。`);
  if (wrongTotal > 0 && wrongReviewed / wrongTotal >= 0.5)
    strengths.push(`错题回顾率 ${Math.round((wrongReviewed / wrongTotal) * 100)}%，坚持复习的习惯很好！`);
  if (wrongTotal > 0 && wrongReviewed / wrongTotal < 0.5)
    weaknesses.push(`错题只复习了 ${wrongReviewed}/${wrongTotal}，艾宾浩斯计划要跟上哦。`);

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">学习进度复盘</h2>
              <p className="text-xs text-slate-500">数据驱动，科学备考</p>
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
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold text-slate-600">本周学习时长</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                {actualTotal}h
              </div>
              <div className="text-xs text-slate-400 mt-1">目标 {plannedTotal}h · {hourRate}%</div>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-600">任务完成</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {tasksDone}/{tasksTotal}
              </div>
              <div className="text-xs text-slate-400 mt-1">完成率 {completionRate}%</div>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-slate-600">知识掌握</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">
                {masteryAvg}%
              </div>
              <div className="text-xs text-slate-400 mt-1">共 {knowledgePoints.length} 个知识点</div>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-600">测验均分</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                {avgQuizScore || '--'}
              </div>
              <div className="text-xs text-slate-400 mt-1">{quizRecords.length} 次测验记录</div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              本周每日学习数据
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="计划时长" fill="#BFDBFE" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="实际时长" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                薄弱章节分析（近14天）
              </h3>
              {weakChapters.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center">
                  <BookX className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">近14天暂无错题，继续保持！</p>
                </div>
              ) : (
                <>
                  <div className="h-40 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weakChapterChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94A3B8" width={70} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                          }}
                          formatter={(value: number, _name: string, props: any) => [
                            `${value} 道错题`,
                            props.payload.fullName,
                          ]}
                        />
                        <Bar dataKey="错题数" fill="#F43F5E" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {weakChapters.map((wc, i) => (
                      <div key={wc.chapter} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">
                            {i + 1}. {wc.chapter}
                          </span>
                          <span className="text-xs font-bold text-rose-600">{wc.count}题</span>
                        </div>
                        {wc.weakPoints.length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            建议重点复习：<span className="text-rose-600 font-medium">{wc.weakPoints.join('、')}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="glass-panel p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                错因分布
              </h3>
              {pieData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center">
                  <Brain className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">暂无错因标签数据</p>
                  <p className="text-xs text-slate-300 mt-1">去错题本给错题添加错因标签吧</p>
                </div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={ERROR_TAG_COLORS[entry.name as ErrorTagType] || '#94A3B8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} 题 · ${ERROR_TAG_SUGGESTIONS[name as ErrorTagType] || '继续加油'}`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ERROR_TAG_COLORS[item.name as ErrorTagType] || '#94A3B8' }}
                        />
                        <span className="text-[11px] text-slate-600 truncate">
                          {item.name} {item.value}题
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-600" />
                知识点掌握度 TOP10
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94A3B8" width={80} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Bar dataKey="掌握度" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-panel p-5">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  做得好的地方
                </h3>
                {strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">继续加油，发现更多闪光点！</p>
                )}
              </div>

              <div className="glass-panel p-5">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  需要加强
                </h3>
                {weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">表现优秀，继续保持！</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BookX className="w-4 h-4 text-rose-500" />
              错题复习情况
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">错题总数</span>
                  <span className="font-bold text-slate-700">{wrongTotal} 道</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all"
                    style={{ width: `${wrongTotal ? 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">已复习</span>
                  <span className="font-bold text-emerald-600">
                    {wrongReviewed} 道 ({wrongTotal ? Math.round((wrongReviewed / wrongTotal) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${wrongTotal ? (wrongReviewed / wrongTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 bg-gradient-to-br from-brand-50/80 to-violet-50/50">
            <h3 className="font-semibold text-slate-700 mb-3">📈 下一阶段建议</h3>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5 font-bold">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
