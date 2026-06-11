export interface ResponseTemplate {
  greetings: string[];
  plan: {
    askExamName: string;
    askSubjects: string;
    askExamDate: string;
    askDailyHours: string;
    confirmInfo: (name: string, subjects: string[], date: string, hours: number) => string;
    planGenerated: string;
  };
  qa: {
    conceptIntro: string;
    followUp: string;
    needMore: string;
  };
  wrongbook: {
    askForQuestion: string;
    received: string;
    suggestReview: string;
  };
  recite: {
    chooseChapter: string;
    asking: (title: string) => string;
    evaluateGood: string;
    evaluateImprove: string;
    nextReview: (date: string) => string;
  };
  quiz: {
    chooseRange: string;
    startQuiz: (count: number) => string;
    resultGood: (score: number, total: number) => string;
    resultImprove: (score: number, total: number) => string;
    analysisHint: string;
  };
  review: {
    summaryHeader: string;
    goodPerformance: string;
    needImprove: string;
    suggestions: string;
  };
  fallback: string[];
}

export const responseTemplates: ResponseTemplate = {
  greetings: [
    '你好！我是你的备考伙伴小研 🎓 有什么可以帮到你的？\n\n你可以告诉我你正在准备什么考试，或者直接从以下功能开始：\n\n📋 制定复习计划\n💡 知识点问答\n📝 整理错题本\n🎯 背诵知识点抽查\n⏱️ 模拟小测\n📊 复盘本周进度',
    'Hi～备考路上有我陪伴！✨ 不管是制定计划、解答知识点，还是想练题抽查，都可以随时跟我说哦～今天想从哪里开始？',
    '欢迎回来！今天也是向目标迈进的一天 💪 需要我帮你做什么？直接说需求就好，比如"帮我制定考研计划"或"抽查一下政治第二章"。'
  ],

  plan: {
    askExamName: '好的，我们一起来制定适合你的复习计划！🎯\n\n首先告诉我，你准备的是哪场考试呢？比如"2026年考研"、"一级建造师"、"CPA会计"都可以～',
    askSubjects: '了解了！那么这场考试包含哪些科目呢？可以用逗号分隔告诉我，例如"政治, 英语一, 数学一, 计算机专业课"',
    askExamDate: '科目收到了！📚 考试日期是什么时候呢？你可以直接说具体日期（如2025-12-21），或者"今年12月下旬"、"还有6个月"这样我也能理解～',
    askDailyHours: '知道啦！最后一个问题：你平均每天能拿出多少小时来复习呢？（工作日和周末差别大也可以分别说哦）',
    confirmInfo: (name, subjects, date, hours) => `太棒啦！我来确认一下你的考试信息：\n\n📝 **考试名称**：${name}\n📚 **考试科目**：${subjects.join('、')}\n📅 **考试日期**：${date}\n⏰ **每日复习**：${hours} 小时\n\n这些信息对吗？如果需要修改，直接告诉我要改哪项就好～一切正确的话，我马上为你生成专属复习计划！`,
    planGenerated: '根据你的情况，我已经为你生成了一份个性化复习计划！📋 我会根据考试时间和科目特点，按阶段拆分成每日任务。下面展示的是近期一周的任务安排，完整计划你可以在"复习计划"弹窗中查看哦～\n\n有什么需要调整的随时告诉我！比如"数学多分配些时间"、"周末任务减一半"都可以 💡'
  },

  qa: {
    conceptIntro: '关于这个知识点，我来为你详细解释一下：\n\n',
    followUp: '\n\n💡 检验一下你掌握得怎么样——我来追问一个相关的问题：',
    needMore: '需要我继续解释其他相关知识点吗？比如类似的概念、易混淆的对比，或者来一道例题？'
  },

  wrongbook: {
    askForQuestion: '好的，我们来整理错题！📝\n\n请把你做错的题目发给我，可以直接粘贴题目内容，或者告诉我：\n- 是哪道题？\n- 你选的什么答案？\n- 正确答案是什么？\n\n（选择题直接发题目和选项就可以哦）',
    received: '收到！我已经帮你把这道题加入错题本了 ✅\n\n我会按艾宾浩斯遗忘曲线帮你安排复习时间，到时提醒你。要不要现在来几道相似题巩固一下？',
    suggestReview: '对了，根据复习计划，今天有 {count} 道错题该复习了，要现在开始吗？'
  },

  recite: {
    chooseChapter: '背诵抽查开始！🎯\n\n想抽查哪个科目的哪些章节呢？你可以告诉我科目名+章节，比如"政治 马原第一章和第二章"，或者直接选择下面的章节：',
    asking: (title) => `好的，请回答这个知识点：\n\n**📖 ${title}**\n\n你可以用自己的话完整描述这个知识点的内容～`,
    evaluateGood: '回答得不错！👍 关键点都覆盖到了，这个知识点的掌握度又提升啦！',
    evaluateImprove: '嗯，这个知识点还有些薄弱哦，需要加强。让我再帮你回顾一遍完整内容：\n\n',
    nextReview: (date) => `下次复习安排在 ${date}，到时候我会提醒你！`
  },

  quiz: {
    chooseRange: '模拟测验模式启动！⏱️\n\n请告诉我：\n1. 想测验哪个科目？\n2. 想考多少道题？（建议5-15题）\n\n或者直接来一套"随机10题综合测验"？',
    startQuiz: (count) => `好的！${count}道选择题测验开始，计时进行中～加油！💪`,
    resultGood: (score, total) => `太棒了！得分 ${score}/${total}，正确率 ${Math.round(score / total * 100)}% 🎉\n\n这个水平保持下去，考试肯定没问题！`,
    resultImprove: (score, total) => `测验完成！得分 ${score}/${total}，正确率 ${Math.round(score / total * 100)}%\n\n还有提升空间，我们来看看错题解析，重点攻克薄弱环节！`,
    analysisHint: '点击每道题可以查看详细解析哦～'
  },

  review: {
    summaryHeader: '📊 本周学习复盘报告\n\n让我来帮你总结一下这一周的学习情况：',
    goodPerformance: '🌟 做得好的地方：\n\n',
    needImprove: '💪 需要加强的地方：\n\n',
    suggestions: '📈 下一阶段建议：\n\n'
  },

  fallback: [
    '抱歉，我没太理解你的意思 🤔 可以换个说法再试试？或者从这些功能里选一个开始：计划制定、知识问答、错题整理、背诵抽查、模拟测验、进度复盘。',
    '嗯...这个我还在学习中！要不我们先从其他功能开始？比如制定复习计划、抽查知识点，或者来做几道题？',
    '可以再说得具体一点吗？比如告诉我是哪个科目、哪一章的内容，我就能更好地帮到你啦！'
  ]
};

export function getRandomGreeting(): string {
  return responseTemplates.greetings[Math.floor(Math.random() * responseTemplates.greetings.length)];
}

export function getRandomFallback(): string {
  return responseTemplates.fallback[Math.floor(Math.random() * responseTemplates.fallback.length)];
}
