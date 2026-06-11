export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date | string, days: number): Date {
  const date = typeof d === 'string' ? new Date(d) : new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function daysBetween(d1: Date | string, d2: Date | string): number {
  const date1 = typeof d1 === 'string' ? new Date(d1) : new Date(d1);
  const date2 = typeof d2 === 'string' ? new Date(d2) : new Date(d2);
  const ms = date2.getTime() - date1.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function getWeekStart(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return formatDate(new Date(date.setDate(diff)));
}

export function getWeekDates(start?: Date | string): string[] {
  const base = start ? (typeof start === 'string' ? new Date(start) : start) : new Date();
  const weekStart = getWeekStart(base);
  return Array.from({ length: 7 }, (_, i) => formatDate(addDays(weekStart, i)));
}

export function parseDateInput(text: string): string | null {
  const today = new Date();
  
  const exactMatch = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (exactMatch) {
    const [, y, m, d] = exactMatch;
    return formatDate(new Date(Number(y), Number(m) - 1, Number(d)));
  }
  
  const monthMatch = text.match(/(\d{1,2})[月-](\d{1,2})/);
  if (monthMatch) {
    const [, m, d] = monthMatch;
    let y = today.getFullYear();
    const date = new Date(y, Number(m) - 1, Number(d));
    if (date.getTime() < today.getTime()) y += 1;
    return formatDate(new Date(y, Number(m) - 1, Number(d)));
  }
  
  const daysMatch = text.match(/还有?\s*(\d+)\s*[天个]?[月日天]/);
  if (daysMatch) {
    const n = Number(daysMatch[1]);
    if (text.includes('月')) return formatDate(addDays(today, n * 30));
    return formatDate(addDays(today, n));
  }
  
  const nextXMatch = text.match(/(下|这|本)\s*([周月日年])/);
  if (nextXMatch) {
    const [, prefix, unit] = nextXMatch;
    if (unit === '周' && prefix === '下') return formatDate(addDays(today, 7));
    if (unit === '月') {
      const d = new Date(today);
      if (prefix === '下') d.setMonth(d.getMonth() + 1);
      return formatDate(d);
    }
    if (unit === '年') {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() + 1);
      return formatDate(d);
    }
  }
  
  const seasonMatch = text.match(/(12月下旬|年底|年初|上半年|下半年)/);
  if (seasonMatch) {
    const s = seasonMatch[1];
    const y = today.getFullYear();
    const map: Record<string, [number, number]> = {
      '12月下旬': [11, 25],
      '年底': [11, 31],
      '年初': [0, 15],
      '上半年': [5, 30],
      '下半年': [11, 31],
    };
    let [m, d] = map[s] || [11, 31];
    let year = y;
    if (s === '年初' && new Date(y, m, d).getTime() < today.getTime()) year += 1;
    return formatDate(new Date(year, m, d));
  }
  
  return null;
}

export function parseHoursInput(text: string): number {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:个)?小时/,
    /(\d+(?:\.\d+)?)\s*[hH]/,
    /每天?\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*(?:小时)?\s*(?:工作日|上班)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Number(m[1]);
  }
  const num = text.match(/(\d+(?:\.\d+)?)/);
  if (num) {
    const n = Number(num[1]);
    if (n >= 1 && n <= 16) return n;
  }
  return 4;
}

export function getEbbinghausDates(baseDate: Date = new Date()): string[] {
  const intervals = [1, 2, 4, 7, 15, 30];
  return intervals.map(d => formatDate(addDays(baseDate, d)));
}

export function isToday(d: string | Date): boolean {
  return formatDate(d) === formatDate(new Date());
}

export function countdownText(targetDate: string): string {
  const days = daysBetween(new Date(), targetDate);
  if (days <= 0) return '考试在即！';
  if (days < 7) return `距离考试还有 ${days} 天 🔥`;
  if (days < 30) return `距离考试还有 ${days} 天 💪`;
  const months = Math.floor(days / 30);
  return `距离考试还有 ${months} 个月（${days} 天）📚`;
}
