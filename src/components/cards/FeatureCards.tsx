import { Calendar, BrainCircuit, BookX, FileSearch, Timer, BarChart3 } from 'lucide-react';
import { processUserMessage } from '@/engine/ChatEngine';

const features = [
  {
    icon: Calendar,
    title: '计划制定',
    desc: '智能生成个性化复习计划，合理分配每日任务',
    message: '帮我制定复习计划',
    gradient: 'from-brand-500 via-brand-600 to-brand-700',
    glow: 'shadow-brand-500/30',
    ring: 'ring-brand-200',
  },
  {
    icon: BrainCircuit,
    title: '知识问答',
    desc: '随时提问知识点，AI 深度解析概念原理',
    message: '帮我讲解一下重要知识点',
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    glow: 'shadow-violet-500/30',
    ring: 'ring-violet-200',
  },
  {
    icon: BookX,
    title: '错题整理',
    desc: '一键收录错题，按艾宾浩斯曲线智能安排复习',
    message: '帮我整理错题',
    gradient: 'from-rose-500 via-red-600 to-pink-700',
    glow: 'shadow-rose-500/30',
    ring: 'ring-rose-200',
  },
  {
    icon: FileSearch,
    title: '背诵抽查',
    desc: '随机抽取知识点进行默写，强化记忆效果',
    message: '帮我抽查背诵知识点',
    gradient: 'from-amber-500 via-orange-600 to-yellow-600',
    glow: 'shadow-amber-500/30',
    ring: 'ring-amber-200',
  },
  {
    icon: Timer,
    title: '模拟测验',
    desc: '限时模拟考试，实时评分并生成错题解析',
    message: '帮我来一套模拟测验',
    gradient: 'from-cyan-500 via-sky-600 to-blue-700',
    glow: 'shadow-cyan-500/30',
    ring: 'ring-cyan-200',
  },
  {
    icon: BarChart3,
    title: '进度复盘',
    desc: '可视化学习数据，深度分析薄弱环节',
    message: '帮我复盘本周学习进度',
    gradient: 'from-emerald-500 via-teal-600 to-green-700',
    glow: 'shadow-emerald-500/30',
    ring: 'ring-emerald-200',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-4 animate-fade-in p-6">
      {features.map((f, idx) => (
        <button
          key={f.title}
          onClick={() => processUserMessage(f.message)}
          className="card-base card-hover p-5 text-left group animate-slide-up active:scale-[0.97] transition-all duration-300 relative overflow-hidden"
          style={{ animationDelay: `${idx * 70}ms` }}
        >
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${f.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />

          <div className="relative z-10 flex flex-col gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-xl ${f.glow} ring-4 ${f.ring} ring-offset-2 ring-offset-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
              <f.icon className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-colors duration-300 flex items-center gap-2">
                {f.title}
                <span className="inline-block translate-x-0 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300 text-brand-500">
                  →
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {f.desc}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
