export function uid(prefix: string = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function parseSubjects(text: string): string[] {
  const cleaned = text.replace(/[，、,;；\n]+/g, '|');
  return cleaned
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/科目[一二三四五六七八九十\d]+[:：]?\s*/g, ''))
    .slice(0, 8);
}

export function findSubjectName(text: string, subjects: string[]): string | null {
  const t = text.toLowerCase();
  for (const s of subjects) {
    if (t.includes(s.toLowerCase())) return s;
  }
  const common: Record<string, string> = {
    'zhengzhi': '政治', 'zz': '政治', '政治': '政治',
    'yingyu': '英语', 'yy': '英语', '英语': '英语',
    'shuxue': '数学', 'sx': '数学', '数学': '数学',
    'zhuanye': '专业课', 'zy': '专业课', '专业课': '专业课', '408': '专业课',
  };
  for (const k of Object.keys(common)) {
    if (t.includes(k)) return common[k];
  }
  return null;
}

export function extractNumber(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function parseMCAnswer(text: string): number | null {
  const t = text.trim().toUpperCase();
  const letterMatch = t.match(/^[A-D]/);
  if (letterMatch) {
    return letterMatch[0].charCodeAt(0) - 65;
  }
  const numMatch = t.match(/[1-4]/);
  if (numMatch) return Number(numMatch[0]) - 1;
  if (t.includes('①') || t.includes('第一个')) return 0;
  if (t.includes('②') || t.includes('第二个')) return 1;
  if (t.includes('③') || t.includes('第三个')) return 2;
  if (t.includes('④') || t.includes('第四个')) return 3;
  return null;
}

export function parseWrongQuestion(text: string): {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  options: string[];
} | null {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  
  let question = '';
  const options: string[] = [];
  let userAnswer = '';
  let correctAnswer = '';
  
  for (const line of lines) {
    const optionMatch = line.match(/^([A-D])[\.．、:：\s]+(.+)/);
    if (optionMatch) {
      options.push(`${optionMatch[1]}. ${optionMatch[2]}`);
      continue;
    }
    const userMatch = line.match(/(?:我选的|我的答案|选了|用户答案|错误答案)[:：是为\s]*([A-D]|正确|错误)/i);
    if (userMatch) {
      userAnswer = userMatch[1];
      continue;
    }
    const correctMatch = line.match(/(?:正确答案|答案是|选|正确选项)[:：是为\s]*([A-D])/i);
    if (correctMatch) {
      correctAnswer = correctMatch[1];
      continue;
    }
    if (!question && line.length > 5) {
      question = line;
    }
  }
  
  if (!question) return null;
  if (!userAnswer) {
    const lastOpt = options[options.length - 1];
    if (lastOpt && lines[lines.length - 1] === lastOpt) {
      userAnswer = lines[lines.length - 2] || '未说明';
    }
  }
  if (!correctAnswer) correctAnswer = 'A';
  
  return { question, userAnswer, correctAnswer, options };
}

export function keywordMatch(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some(k => t.includes(k.toLowerCase()));
}

export function similarText(a: string, b: string): number {
  const aSet = new Set(a.split(''));
  const bSet = new Set(b.split(''));
  let common = 0;
  for (const c of aSet) if (bSet.has(c)) common++;
  return common / Math.max(aSet.size, bSet.size);
}

export function answerScore(userAnswer: string, correctContent: string): number {
  const keywords = correctContent.split(/[，。；、,.\s]+/).filter(k => k.length >= 2);
  if (keywords.length === 0) return 50;
  let hit = 0;
  for (const k of keywords) {
    if (userAnswer.includes(k)) hit++;
  }
  const score = Math.round((hit / keywords.length) * 100);
  return Math.min(100, Math.max(20, score + (similarText(userAnswer, correctContent) * 20)));
}
