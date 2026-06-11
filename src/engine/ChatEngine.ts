import type { FlowType, Message, StudyTask, WrongQuestion, ExamInfo, QuizQuestion, ErrorTagType } from '@/store/types';
import { ERROR_TAGS } from '@/store/types';
import { useAppStore } from '@/store/useAppStore';
import { parseSubjects, findSubjectName, parseMCAnswer, parseWrongQuestion, keywordMatch, answerScore, uid, extractNumber } from '@/utils/stringUtils';
import { parseDateInput, parseHoursInput, formatDate, addDays, isToday, getEbbinghausDates, getWeekDates } from '@/utils/dateUtils';
import { mockKnowledgePoints, mockSubjects } from '@/data/knowledge';
import { getRandomQuestions } from '@/data/questions';
import { responseTemplates, getRandomFallback } from '@/data/templates';

export interface IntentResult {
  intent: string;
  flowType: FlowType;
  entities: Record<string, any>;
  confidence: number;
}

export interface EngineResponse {
  content: string;
  type: Message['type'];
  suggestions?: string[];
  payload?: any;
  newFlow?: { flow: FlowType; step: number; context: Record<string, any> };
  sideEffects?: () => void;
}

export class IntentParser {
  static parse(text: string, currentFlow: FlowType, context: Record<string, any>): IntentResult {
    const t = text.toLowerCase().trim();
    
    if (currentFlow !== 'idle') {
      return this.parseFlowContext(text, currentFlow, context);
    }
    
    const intents: Array<{ keywords: string[]; intent: string; flow: FlowType; weight: number }> = [
      { keywords: ['计划', '规划', '安排', '日程', 'schedule', 'plan', '制定计划', '复习计划'], intent: 'start_plan', flow: 'plan', weight: 10 },
      { keywords: ['解释', '什么是', '请问', '概念', '含义', '意思是', '讲解', '说明', 'explain', 'define'], intent: 'ask_concept', flow: 'qa', weight: 10 },
      { keywords: ['错题', '做错了', '错了', '错题本', '收集错题', '整理错题'], intent: 'start_wrongbook', flow: 'wrongbook', weight: 10 },
      { keywords: ['背诵', '抽背', '抽查', '记忆', '默写', 'recite', 'quiz me'], intent: 'start_recite', flow: 'recite', weight: 10 },
      { keywords: ['测验', '考试', '模拟', '小测', '做题', '刷题', 'quiz', 'test', 'exam'], intent: 'start_quiz', flow: 'quiz', weight: 10 },
      { keywords: ['复盘', '总结', '进度', '统计', '回顾', '本周', 'review', 'progress', 'summary'], intent: 'start_review', flow: 'review', weight: 10 },
      { keywords: ['你好', 'hi', 'hello', '在吗', '哈喽', '嗨'], intent: 'greeting', flow: 'idle', weight: 5 },
      { keywords: ['谢谢', '感谢', 'thanks'], intent: 'thanks', flow: 'idle', weight: 3 },
      { keywords: ['退出', '取消', '结束', '换一个', '切换'], intent: 'exit_flow', flow: 'idle', weight: 8 },
    ];

    let best: IntentResult = { intent: 'unknown', flowType: 'idle', entities: {}, confidence: 0 };
    
    for (const rule of intents) {
      let hits = 0;
      for (const k of rule.keywords) {
        if (t.includes(k.toLowerCase())) hits++;
      }
      const conf = hits * rule.weight / rule.keywords.length;
      if (conf > best.confidence) {
        best = { intent: rule.intent, flowType: rule.flow, entities: this.extractEntities(text), confidence: conf };
      }
    }
    
    if (best.confidence >= 3) return best;
    
    if (t.length > 3 && best.confidence === 0) {
      if (t.match(/(是什么|什么|怎么|为什么|哪|？|\?)/) || t.length > 8) {
        return { intent: 'ask_concept', flowType: 'qa', entities: this.extractEntities(text), confidence: 5 };
      }
    }
    
    return best;
  }

  static parseFlowContext(text: string, flow: FlowType, context: Record<string, any>): IntentResult {
    const t = text.toLowerCase();
    
    if (keywordMatch(text, ['退出', '取消', '结束', '换功能', '重新开始', '不用了'])) {
      return { intent: 'exit_flow', flowType: 'idle', entities: {}, confidence: 10 };
    }
    
    const yes = keywordMatch(text, ['是', '对', '好的', '可以', 'ok', 'yes', '嗯', '没问题', '确认', '正确']);
    const no = keywordMatch(text, ['不是', '不对', 'no', '修改', '调整', '重新']);
    
    switch (flow) {
      case 'plan':
        return this.parsePlanFlow(text, context, yes, no);
      case 'qa':
        return { intent: 'qa_followup', flowType: 'qa', entities: { answer: text }, confidence: 10 };
      case 'wrongbook':
        return this.parseWrongbookFlow(text, context);
      case 'recite':
        return this.parseReciteFlow(text, context);
      case 'quiz':
        return this.parseQuizFlow(text, context);
      case 'review':
        return { intent: 'review_done', flowType: 'idle', entities: {}, confidence: 5 };
      default:
        return { intent: 'unknown', flowType: 'idle', entities: {}, confidence: 0 };
    }
  }

  static parsePlanFlow(text: string, ctx: Record<string, any>, yes: boolean, no: boolean): IntentResult {
    const step = ctx.step ?? 0;
    const entities: Record<string, any> = {};
    
    if (step === 0) {
      entities.examName = text.replace(/我要考|准备|打算考|参加|考/g, '').trim();
      return { intent: 'plan_exam_name', flowType: 'plan', entities, confidence: 10 };
    }
    if (step === 1) {
      entities.subjects = parseSubjects(text);
      return { intent: 'plan_subjects', flowType: 'plan', entities, confidence: 10 };
    }
    if (step === 2) {
      const d = parseDateInput(text);
      if (d) entities.examDate = d;
      return { intent: 'plan_date', flowType: 'plan', entities, confidence: d ? 10 : 5 };
    }
    if (step === 3) {
      entities.hours = parseHoursInput(text);
      return { intent: 'plan_hours', flowType: 'plan', entities, confidence: 10 };
    }
    if (step === 4) {
      if (yes) return { intent: 'plan_confirm_yes', flowType: 'plan', entities: {}, confidence: 10 };
      if (no) return { intent: 'plan_confirm_no', flowType: 'plan', entities: { resetStep: 0 }, confidence: 10 };
      return { intent: 'plan_confirm_maybe', flowType: 'plan', entities: {}, confidence: 3 };
    }
    if (step === 5) {
      if (yes) return { intent: 'plan_adjust_yes', flowType: 'plan', entities: { adjust: true }, confidence: 10 };
      return { intent: 'plan_done', flowType: 'idle', entities: {}, confidence: 8 };
    }
    return { intent: 'unknown', flowType: 'plan', entities, confidence: 1 };
  }

  static parseWrongbookFlow(text: string, ctx: Record<string, any>): IntentResult {
    const step = ctx.step ?? 0;
    if (step === 0) {
      const parsed = parseWrongQuestion(text);
      return { intent: 'wrong_submit', flowType: 'wrongbook', entities: { parsed, raw: text }, confidence: parsed ? 10 : 5 };
    }
    if (step === 1) {
      const selectedTags = ERROR_TAGS.filter(tag => text.includes(tag));
      if (selectedTags.length > 0) {
        return { intent: 'wrong_error_tags', flowType: 'wrongbook', entities: { errorTags: selectedTags }, confidence: 10 };
      }
      const skip = keywordMatch(text, ['跳过', '不选', '下一步', '继续']);
      if (skip) {
        return { intent: 'wrong_error_tags_skip', flowType: 'wrongbook', entities: {}, confidence: 10 };
      }
      return { intent: 'wrong_error_tags_custom', flowType: 'wrongbook', entities: { customTag: text.trim() }, confidence: 8 };
    }
    if (step === 2) {
      const yes = keywordMatch(text, ['好', '来', '要', '开始', '可以', 'yes']);
      return { intent: yes ? 'wrong_do_similar' : 'wrong_skip_similar', flowType: yes ? 'wrongbook' : 'idle', entities: {}, confidence: 10 };
    }
    if (step === 3) {
      const ans = parseMCAnswer(text);
      return { intent: 'wrong_similar_answer', flowType: 'wrongbook', entities: { answer: ans ?? -1 }, confidence: 8 };
    }
    return { intent: 'unknown', flowType: 'wrongbook', entities: {}, confidence: 0 };
  }

  static parseReciteFlow(text: string, ctx: Record<string, any>): IntentResult {
    const step = ctx.step ?? 0;
    if (step === 0) {
      const subjectName = findSubjectName(text, mockSubjects.map(s => s.name));
      return { intent: 'recite_choose', flowType: 'recite', entities: { subjectName, raw: text }, confidence: 10 };
    }
    if (step === 1) {
      return { intent: 'recite_chapters_selected', flowType: 'recite', entities: {}, confidence: 8 };
    }
    if (step === 2) {
      return { intent: 'recite_answer', flowType: 'recite', entities: { answer: text }, confidence: 10 };
    }
    if (step === 3) {
      const yes = keywordMatch(text, ['好', '继续', '下一个', '再来', '要', 'yes']);
      return { intent: yes ? 'recite_next' : 'recite_done', flowType: yes ? 'recite' : 'idle', entities: {}, confidence: 10 };
    }
    return { intent: 'unknown', flowType: 'recite', entities: {}, confidence: 0 };
  }

  static parseQuizFlow(text: string, ctx: Record<string, any>): IntentResult {
    const step = ctx.step ?? 0;
    if (step === 0) {
      const subjectName = findSubjectName(text, mockSubjects.map(s => s.name));
      const n = extractNumber(text);
      const count = keywordMatch(text, ['10题', '随机10', '综合', '一套']) ? 10 : (n || 5);
      return { intent: 'quiz_config', flowType: 'quiz', entities: { subjectName, count }, confidence: 10 };
    }
    if (step === 1) {
      const ans = parseMCAnswer(text);
      return { intent: 'quiz_answer', flowType: 'quiz', entities: { answer: ans ?? -1 }, confidence: 8 };
    }
    return { intent: 'unknown', flowType: 'quiz', entities: {}, confidence: 0 };
  }

  static extractEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    const subject = findSubjectName(text, mockSubjects.map(s => s.name));
    if (subject) entities.subject = subject;
    const num = extractNumber(text);
    if (num) entities.number = num;
    return entities;
  }
}

export class FlowController {
  static handle(intent: IntentResult, userText: string): EngineResponse {
    const store = useAppStore.getState();
    
    if (intent.intent === 'exit_flow') {
      return {
        content: '好的，已退出当前流程。想开始什么新的复习内容？',
        type: 'text',
        newFlow: { flow: 'idle', step: 0, context: {} },
        suggestions: ['📋 制定复习计划', '💡 知识问答', '⏱️ 模拟测验', '📊 复盘进度'],
      };
    }

    if (intent.intent === 'greeting') {
      return { content: '嗨！随时为你服务～今天想从哪个功能开始？', type: 'text',
        suggestions: ['📋 制定复习计划', '💡 解释知识点', '⏱️ 来套小测', '📊 复盘本周'] };
    }
    if (intent.intent === 'thanks') {
      return { content: '不客气！💪 加油备考，有需要随时叫我～', type: 'text' };
    }

    const { flowType } = intent;
    const currentStep = store.flowState.currentFlow === flowType ? store.flowState.step : 0;
    const ctx = { ...store.flowState.context, ...intent.entities, step: currentStep };

    switch (flowType) {
      case 'plan': return FlowController.handlePlan(intent, ctx, userText);
      case 'qa': return FlowController.handleQA(intent, ctx, userText);
      case 'wrongbook': return FlowController.handleWrongbook(intent, ctx, userText);
      case 'recite': return FlowController.handleRecite(intent, ctx, userText);
      case 'quiz': return FlowController.handleQuiz(intent, ctx, userText);
      case 'review': return FlowController.handleReview(intent, ctx);
      default: return { content: getRandomFallback(), type: 'text' };
    }
  }

  static handlePlan(intent: IntentResult, ctx: Record<string, any>, userText: string): EngineResponse {
    const t = responseTemplates.plan;
    const step = ctx.step ?? 0;
    
    if (intent.intent === 'start_plan' || step === 0) {
      return { content: t.askExamName, type: 'text', newFlow: { flow: 'plan', step: 1, context: {} } };
    }
    if (step === 1 || intent.intent === 'plan_exam_name') {
      const examName = ctx.examName || userText;
      return { content: t.askSubjects, type: 'text', newFlow: { flow: 'plan', step: 2, context: { examName } } };
    }
    if (step === 2 || intent.intent === 'plan_subjects') {
      const subjects = ctx.subjects || parseSubjects(userText);
      const { examName } = useAppStore.getState().flowState.context;
      return { content: t.askExamDate, type: 'text', newFlow: { flow: 'plan', step: 3, context: { examName, subjects } } };
    }
    if (step === 3 || intent.intent === 'plan_date') {
      const examDate = ctx.examDate || parseDateInput(userText) || formatDate(addDays(new Date(), 180));
      const { examName, subjects } = useAppStore.getState().flowState.context;
      return { content: t.askDailyHours, type: 'text', newFlow: { flow: 'plan', step: 4, context: { examName, subjects, examDate } } };
    }
    if (step === 4 || intent.intent === 'plan_hours') {
      const dailyHours = ctx.hours || parseHoursInput(userText);
      const { examName, subjects, examDate } = useAppStore.getState().flowState.context;
      const finalSubjects = subjects?.length ? subjects : ['政治', '英语', '数学', '专业课'];
      return {
        content: t.confirmInfo(examName || '复习考试', finalSubjects, examDate, dailyHours),
        type: 'text',
        suggestions: ['✅ 正确，生成计划', '❌ 重新填写考试名称', '❌ 重新选择科目'],
        newFlow: { flow: 'plan', step: 5, context: { examName, subjects: finalSubjects, examDate, dailyHours } },
      };
    }
    if (step === 5) {
      if (intent.intent === 'plan_confirm_yes' || keywordMatch(userText, ['正确', '生成', '是', '对', 'ok', '没问题', '✅'])) {
        const { examName, subjects, examDate, dailyHours } = useAppStore.getState().flowState.context;
        const info: ExamInfo = { name: examName || '复习考试', subjects, examDate, dailyHours };
        const todayTasks = FlowController.generateTodayTasksPreview(info);
        return {
          content: t.planGenerated,
          type: 'task_list',
          payload: { tasks: todayTasks, examInfo: info },
          sideEffects: () => {
            useAppStore.getState().setExamInfo(info);
          },
          suggestions: ['📅 查看完整计划', '✏️ 调整任务分配', '💡 开始知识问答'],
          newFlow: { flow: 'idle', step: 0, context: {} },
        };
      }
      return { content: t.askExamName, type: 'text', newFlow: { flow: 'plan', step: 1, context: {} } };
    }
    return { content: t.askExamName, type: 'text', newFlow: { flow: 'plan', step: 1, context: {} } };
  }

  static generateTodayTasksPreview(info: ExamInfo): StudyTask[] {
    const today = formatDate(new Date());
    const priorities: Array<StudyTask['priority']> = ['high', 'medium', 'low', 'high', 'medium'];
    return info.subjects.slice(0, 4).map((subject, i) => ({
      id: uid('task-p-'),
      title: [
        `${subject}：第1-2章 基础概念通读`,
        `${subject}：重点公式/考点整理`,
        `${subject}：章节配套习题练习`,
        `${subject}：错题回顾与总结`,
      ][i % 4],
      subject,
      date: today,
      duration: Math.floor(info.dailyHours * 60 / info.subjects.length),
      completed: false,
      priority: priorities[i],
    }));
  }

  static handleQA(intent: IntentResult, ctx: Record<string, any>, userText: string): EngineResponse {
    const t = responseTemplates.qa;
    
    if (intent.intent === 'qa_followup' && ctx.step === 2) {
      return {
        content: '很好的思考！继续保持这种探索精神。还想了解什么知识点？',
        type: 'text',
        newFlow: { flow: 'idle', step: 0, context: {} },
        suggestions: ['💡 继续问其他概念', '🎯 做背诵抽查', '⏱️ 模拟小测一下'],
      };
    }

    const concept = userText.replace(/(什么是|请解释|解释一下|请问|讲讲|的概念|的意思|是什么|怎么理解|define|explain)/gi, '').trim();
    
    let found = mockKnowledgePoints.find(kp => 
      concept && (kp.title.includes(concept) || concept.includes(kp.title.slice(0, 4)))
    );
    
    if (!found && concept) {
      found = mockKnowledgePoints.find(kp => {
        const overlap = kp.title.split('').filter(c => concept.includes(c)).length;
        return overlap >= Math.min(concept.length, 4);
      });
    }
    
    if (!found) {
      const sample = mockKnowledgePoints[Math.floor(Math.random() * mockKnowledgePoints.length)];
      return {
        content: `关于「${concept || '这个问题'}」，我来为你做一个通用解释：\n\n这是备考中的常见重要考点，建议从定义、核心内容、适用条件、典型例题四个维度来掌握。\n\n💡 为了帮助你更精准学习，推荐你直接问具体知识点名称，比如「${sample.title}」，我就可以给出更详细的讲解！`,
        type: 'text',
        newFlow: { flow: 'qa', step: 1, context: { concept: sample.id } },
        suggestions: [`💡 解释一下${sample.title}`, '🎯 做背诵抽查', '⏱️ 来套小测'],
      };
    }

    const followups = mockKnowledgePoints
      .filter(kp => kp.chapter === found!.chapter && kp.id !== found!.id)
      .slice(0, 2);

    return {
      content: `${t.conceptIntro}**📖 ${found.title}**\n\n${found.content}\n\n**💡 学习建议**：先理解核心定义，再结合典型例题巩固，注意与易混淆概念的对比。${t.followUp}\n\n请用自己的话简述一下「${followups[0]?.title || found.title}」的核心要点？`,
      type: 'text',
      newFlow: { flow: 'qa', step: 2, context: { conceptId: found.id } },
      suggestions: ['👍 明白了，继续下一个', '🔍 再解释详细一点', '📝 来道例题试试'],
    };
  }

  static handleWrongbook(intent: IntentResult, ctx: Record<string, any>, userText: string): EngineResponse {
    const t = responseTemplates.wrongbook;
    const step = ctx.step ?? 0;

    if (step === 0 || intent.intent === 'start_wrongbook') {
      return { content: t.askForQuestion, type: 'text', newFlow: { flow: 'wrongbook', step: 1, context: {} } };
    }
    if (step === 1 || intent.intent === 'wrong_submit') {
      const parsed = ctx.parsed || parseWrongQuestion(userText);
      const subject = parsed ? (findSubjectName(parsed.question, mockSubjects.map(s => s.name)) || '政治') : '政治';
      const chapter = parsed?.question?.length ? mockKnowledgePoints[0].chapter : '综合';
      
      const wq: WrongQuestion = {
        id: uid('wq-'),
        subject,
        chapter,
        question: parsed?.question || userText.slice(0, 200),
        options: parsed?.options,
        userAnswer: parsed?.userAnswer || '未记录',
        correctAnswer: parsed?.correctAnswer || '待补充',
        analysis: parsed ? `这道题的正确答案是${parsed.correctAnswer}。关键在于掌握核心概念的本质区别，建议回炉复习${chapter}相关章节。` : '建议结合教材参考答案，深入理解考点。',
        addedAt: Date.now(),
        reviewCount: 0,
        nextReviewDate: getEbbinghausDates()[0],
        errorTags: [],
      };

      const tagOptions = ERROR_TAGS.map(tag => `${tag}`);
      return {
        content: `✅ 已收录这道错题！\n\n现在请选择这道题的**错因标签**（可多选），帮助我更精准地为你生成针对性练习：\n\n${tagOptions.map((tag, i) => `${i + 1}. ${tag}`).join('\n')}\n\n你可以直接输入标签名称，或输入序号，也可以输入"跳过"暂不选择。`,
        type: 'options',
        payload: { options: tagOptions, wqId: wq.id },
        suggestions: [...tagOptions.slice(0, 4), '⏭️ 跳过，不选标签'],
        sideEffects: () => useAppStore.getState().addWrongQuestion(wq),
        newFlow: { flow: 'wrongbook', step: 2, context: { wqId: wq.id } },
      };
    }
    if (step === 2) {
      const { wqId } = useAppStore.getState().flowState.context;
      let errorTags: ErrorTagType[] = [];
      
      if (intent.intent === 'wrong_error_tags') {
        errorTags = ctx.errorTags || [];
      } else if (intent.intent === 'wrong_error_tags_custom') {
        const customTag = ctx.customTag || userText.trim();
        if (ERROR_TAGS.includes(customTag as ErrorTagType)) {
          errorTags = [customTag as ErrorTagType];
        } else {
          const matched = ERROR_TAGS.filter(tag => userText.includes(tag));
          if (matched.length > 0) {
            errorTags = matched;
          } else {
            errorTags = [customTag as ErrorTagType];
          }
        }
      }

      if (errorTags.length > 0 || intent.intent !== 'wrong_error_tags_skip') {
        const store = useAppStore.getState();
        const updated = store.wrongQuestions.map(wq =>
          wq.id === wqId ? { ...wq, errorTags } : wq
        );
        useAppStore.setState({ wrongQuestions: updated });
      }

      const currentWq = useAppStore.getState().wrongQuestions.find(w => w.id === wqId);
      const similar = FlowController.generateSimilarWithTags(
        currentWq || { question: userText, options: [], errorTags: [] },
        errorTags
      );
      
      if (similar.length > 0 && currentWq) {
        const store = useAppStore.getState();
        const updated = store.wrongQuestions.map(wq =>
          wq.id === wqId ? { ...wq, similarQuestions: similar } : wq
        );
        useAppStore.setState({ wrongQuestions: updated });
      }

      const hasTags = errorTags.length > 0;
      return {
        content: hasTags 
          ? `✅ 已保存错因标签：${errorTags.join('、')}\n\n根据这些错因，我为你准备了${similar.length}道针对性相似练习。要不要现在开始做？`
          : '好的，已帮你收录错题并安排了复习计划。要不要做几道相似题巩固一下？',
        type: 'text',
        suggestions: ['✅ 开始做相似题巩固', '📚 查看错题本', '💡 换个功能试试'],
        newFlow: { flow: 'wrongbook', step: 3, context: { wqId, similarIdx: 0 } },
      };
    }
    if (step === 3) {
      if (intent.intent === 'wrong_do_similar' || keywordMatch(userText, ['好', '要', '来', '开始', '做'])) {
        const store = useAppStore.getState();
        const wq = store.wrongQuestions[store.wrongQuestions.length - 1];
        if (wq?.similarQuestions?.length) {
          const sq = wq.similarQuestions[0];
          const tagHint = sq.targetErrorTag ? `\n\n🎯 针对错因：**${sq.targetErrorTag}**` : '';
          return {
            content: `好的！来做这道相似题巩固一下：${tagHint}\n\n**${sq.question}**\n\n${sq.options?.join('\n') || '请在输入框作答'}`,
            type: 'options',
            payload: { options: sq.options, answer: sq.answer },
            suggestions: sq.options,
            newFlow: { flow: 'wrongbook', step: 4, context: { similarIdx: 0, wqId: wq.id } },
          };
        }
      }
      return { content: '好的！这道题已经安排好复习时间了，到时会提醒你。想继续整理其他错题吗？', type: 'text', newFlow: { flow: 'idle', step: 0, context: {} }, suggestions: ['📝 继续整理错题', '📚 查看错题本', '⏱️ 模拟小测'] };
    }
    if (step === 4 || intent.intent === 'wrong_similar_answer') {
      const userAnswer = ctx.answer;
      return {
        content: userAnswer >= 0 && userAnswer <= 3 ? `你选择了第${userAnswer + 1}个选项。很好！不管对错，做过一遍就加深了印象 💪\n\n解析：这道题考察的是同一个知识点的变体，注意抓住核心原理，举一反三。` : '收到你的回答！多做多练，错题本就是你进步的见证 ✨',
        type: 'text',
        newFlow: { flow: 'idle', step: 0, context: {} },
        suggestions: ['📝 继续整理错题', '📚 查看全部错题', '🎯 背诵抽查一下'],
      };
    }
    return { content: t.askForQuestion, type: 'text', newFlow: { flow: 'wrongbook', step: 1, context: {} } };
  }

  static generateSimilarWithTags(base: { question: string; options?: string[]; errorTags?: string[] }, tags: ErrorTagType[]): WrongQuestion['similarQuestions'] {
    const activeTags = tags.length > 0 ? tags : ['其他'];
    const totalQuestions = Math.min(Math.max(activeTags.length + 2, 3), 5);
    const questionsPerTag = Math.ceil(totalQuestions / activeTags.length);
    
    return activeTags.flatMap((tag, tagIdx) => {
      return Array.from({ length: questionsPerTag }, (_, i) => {
        const baseText = base.question.slice(0, 20);
        const tagSpecific: Record<ErrorTagType, { q: string; opts: string[] }> = {
          '概念混淆': {
            q: `（概念辨析）关于「${baseText}...」相关概念，下列说法正确的是？`,
            opts: base.options?.length ? base.options : ['A. 概念甲的定义', 'B. 概念乙的定义', 'C. 易混淆概念对比', 'D. 综合应用判断'],
          },
          '审题失误': {
            q: `（审题训练）仔细阅读：${base.question.slice(0, 50)}...下列理解正确的是？`,
            opts: base.options?.length ? [...base.options].reverse() : ['A. 偷换概念选项', 'B. 以偏概全选项', 'C. 正确理解', 'D. 过度推断选项'],
          },
          '计算错误': {
            q: `（计算变式）同类计算：${baseText}...，计算结果是？`,
            opts: base.options?.length ? base.options : ['A. 计算结果1', 'B. 计算结果2', 'C. 计算结果3', 'D. 计算结果4'],
          },
          '记忆疏漏': {
            q: `（关键词回忆）填空：关于${baseText}...，核心关键词是？`,
            opts: base.options?.length ? base.options : ['A. 关键词1', 'B. 关键词2', 'C. 关键词3', 'D. 关键词4'],
          },
          '方法不当': {
            q: `（方法优化）对于「${baseText}...」，最优解题方法是？`,
            opts: base.options?.length ? base.options : ['A. 方法甲', 'B. 方法乙', 'C. 最优方法', 'D. 方法丁'],
          },
          '时间不足': {
            q: `（快速解题）限时训练：${base.question.slice(0, 40)}...快速选出正确答案？`,
            opts: base.options?.length ? base.options : ['A. 速解选项1', 'B. 速解选项2', 'C. 速解选项3', 'D. 速解选项4'],
          },
          '其他': {
            q: `（变式练习）${base.question.slice(0, 30)}...的变式题，正确选项是？`,
            opts: base.options?.length ? base.options : ['A. 变式选项1', 'B. 变式选项2', 'C. 变式选项3', 'D. 变式选项4'],
          },
        };
        const variant = tagSpecific[tag] || tagSpecific['其他'];
        return {
          id: uid('sq-'),
          question: variant.q,
          options: variant.opts,
          answer: String.fromCharCode(65 + ((i + tagIdx) % 4)),
          targetErrorTag: tag,
        };
      });
    }).slice(0, totalQuestions);
  }

  static generateSimilar(base: { question: string; options: string[] }) {
    const variants = [
      { q: `（变式1）${base.question.slice(0, 30)}...在新情境下的应用，正确的是？`, opts: base.options?.length ? base.options : ['A. 选项甲', 'B. 选项乙', 'C. 选项丙', 'D. 选项丁'] },
      { q: `（变式2）下列关于该考点的说法，错误的是？`, opts: base.options?.length ? [...base.options].reverse() : ['A. 说法1', 'B. 说法2', 'C. 说法3', 'D. 说法4'] },
      { q: `（变式3）结合实际案例分析，下列判断正确的是？`, opts: base.options?.length ? base.options : ['A. 判断A', 'B. 判断B', 'C. 判断C', 'D. 判断D'] },
    ];
    return variants.map((v, i) => ({
      id: uid('sq-'),
      question: v.q,
      options: v.opts,
      answer: String.fromCharCode(65 + (i % 4)),
    }));
  }

  static handleRecite(intent: IntentResult, ctx: Record<string, any>, userText: string): EngineResponse {
    const t = responseTemplates.recite;
    const step = ctx.step ?? 0;

    if (step === 0 || intent.intent === 'start_recite') {
      const chaptersFlat = mockSubjects.flatMap(s => s.chapters.flatMap(c => (c.children || []).map(ch => ({ id: ch.id, name: `${s.name} - ${c.name} / ${ch.name}` })))).slice(0, 8);
      return {
        content: t.chooseChapter,
        type: 'options',
        payload: { chapters: chaptersFlat },
        suggestions: chaptersFlat.map(c => c.name).slice(0, 4),
        newFlow: { flow: 'recite', step: 1, context: {} },
      };
    }
    if (step === 1 || intent.intent === 'recite_choose') {
      const store = useAppStore.getState();
      const subjectName = ctx.subjectName || findSubjectName(userText, mockSubjects.map(s => s.name));
      const pool = subjectName ? mockKnowledgePoints.filter(kp => kp.subject === subjectName) : mockKnowledgePoints;
      const kp = pool[Math.floor(Math.random() * pool.length)];
      store.setSelectedChapters([kp.chapter]);
      return {
        content: t.asking(kp.title),
        type: 'text',
        newFlow: { flow: 'recite', step: 2, context: { kpId: kp.id } },
      };
    }
    if (step === 2 || intent.intent === 'recite_answer') {
      const { kpId } = useAppStore.getState().flowState.context;
      const kp = mockKnowledgePoints.find(k => k.id === kpId);
      const score = kp ? answerScore(userText, kp.content) : 50;
      const masteryDelta = score >= 70 ? 10 : score >= 50 ? 3 : -5;
      const good = score >= 60;
      const reviewDate = formatDate(addDays(new Date(), good ? 3 : 1));
      
      return {
        content: `${good ? t.evaluateGood : t.evaluateImprove}${kp ? `**📖 ${kp.title}**\n${kp.content}\n\n` : ''}**🎯 本次背诵评分：${score}/100**${score >= 80 ? ' ⭐ 优秀！' : score >= 60 ? ' 👍 不错' : ' 📚 还需努力'}\n\n${t.nextReview(reviewDate)}\n\n还要继续抽背其他知识点吗？`,
        type: 'text',
        sideEffects: () => kp && useAppStore.getState().updateKnowledgeMastery(kp.id, masteryDelta),
        suggestions: ['🎯 继续下一题', '📚 看看薄弱知识点', '⏱️ 来套小测检验'],
        newFlow: { flow: 'recite', step: 3, context: { lastKpId: kpId } },
      };
    }
    if (step === 3) {
      if (intent.intent === 'recite_next' || keywordMatch(userText, ['继续', '下一个', '再来', '好的'])) {
        const pool = mockKnowledgePoints.filter(kp => kp.mastery < 75);
        const kp = pool[Math.floor(Math.random() * pool.length)] || mockKnowledgePoints[0];
        return {
          content: t.asking(kp.title),
          type: 'text',
          newFlow: { flow: 'recite', step: 2, context: { kpId: kp.id } },
        };
      }
      return { content: '好的，背诵抽查结束！你的知识点掌握度又提升啦 ✨ 接下来想做什么？', type: 'text', newFlow: { flow: 'idle', step: 0, context: {} },
        suggestions: ['🎯 继续抽查', '📊 复盘本周进度', '📚 整理错题本'] };
    }
    return { content: t.chooseChapter, type: 'text', newFlow: { flow: 'recite', step: 1, context: {} } };
  }

  static handleQuiz(intent: IntentResult, ctx: Record<string, any>, userText: string): EngineResponse {
    const t = responseTemplates.quiz;
    const step = ctx.step ?? 0;

    if (step === 0 || intent.intent === 'start_quiz') {
      return {
        content: t.chooseRange,
        type: 'options',
        suggestions: ['🎲 随机10题综合测验', '📖 政治 5题', '🔢 数学 5题', '💻 专业课 5题'],
        newFlow: { flow: 'quiz', step: 1, context: {} },
      };
    }
    if (step === 1 || intent.intent === 'quiz_config') {
      const subjectName = ctx.subjectName || findSubjectName(userText, mockSubjects.map(s => s.name));
      let count = ctx.count || extractNumber(userText) || 5;
      if (keywordMatch(userText, ['综合', '10题'])) count = 10;
      count = Math.min(10, Math.max(3, count));
      
      const questions: QuizQuestion[] = getRandomQuestions(count, subjectName || undefined);
      const startMsg = t.startQuiz(questions.length);
      const q0 = questions[0];
      
      return {
        content: `${startMsg}\n\n**第 1 / ${questions.length} 题**\n\n📝 ${q0.question}\n\n${q0.options.join('\n')}`,
        type: 'options',
        payload: { questions, index: 0 },
        suggestions: q0.options,
        sideEffects: () => {
          useAppStore.getState().setCurrentQuiz(questions);
        },
        newFlow: { flow: 'quiz', step: 2, context: { qIndex: 0, startTime: Date.now() } },
      };
    }
    if (step === 2) {
      const store = useAppStore.getState();
      const questions = store.currentQuiz;
      if (!questions) return { content: '测验已结束，想再来一套吗？', type: 'text', newFlow: { flow: 'idle', step: 0, context: {} } };
      
      const qIndex = ctx.qIndex ?? 0;
      let currentAnswer = ctx.answer;
      if (currentAnswer === undefined || currentAnswer === -1) {
        currentAnswer = parseMCAnswer(userText);
      }
      if (currentAnswer === null || currentAnswer === undefined || currentAnswer < 0) {
        return { content: `请选择 A、B、C、D 中的一个选项作答哦～第 ${qIndex + 1}/${questions.length} 题：\n\n${questions[qIndex].question}\n\n${questions[qIndex].options.join('\n')}`, type: 'options',
          suggestions: questions[qIndex].options,
          newFlow: { flow: 'quiz', step: 2, context: { qIndex } } };
      }
      
      store.answerQuizQuestion(qIndex, currentAnswer);
      const isCorrect = currentAnswer === questions[qIndex].correctIndex;
      const nextIdx = qIndex + 1;

      if (nextIdx < questions.length) {
        const nq = questions[nextIdx];
        return {
          content: `${isCorrect ? '✅ 回答正确！' : `❌ 回答错误，正确答案是 ${String.fromCharCode(65 + questions[qIndex].correctIndex)}`}\n\n**第 ${nextIdx + 1} / ${questions.length} 题**\n\n📝 ${nq.question}\n\n${nq.options.join('\n')}`,
          type: 'options',
          suggestions: nq.options,
          newFlow: { flow: 'quiz', step: 2, context: { qIndex: nextIdx, startTime: ctx.startTime } },
        };
      }

      const { startTime } = useAppStore.getState().flowState.context;
      const answers = store.currentQuiz!;
      const correctCount = answers.filter(q => q.userAnswer === q.correctIndex).length;
      const timeSpent = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
      const good = correctCount / answers.length >= 0.7;
      const msg = good ? t.resultGood(correctCount, answers.length) : t.resultImprove(correctCount, answers.length);

      return {
        content: `${msg}\n\n${t.analysisHint}\n\n⏱️ 用时：${Math.floor(timeSpent / 60)}分${timeSpent % 60}秒`,
        type: 'quiz',
        payload: { questions: answers, timeSpent },
        sideEffects: () => {
          const info = useAppStore.getState().examInfo;
          useAppStore.getState().addQuizRecord({
            id: uid('qr-'),
            subject: info?.subjects?.[0] || '综合',
            totalQuestions: answers.length,
            correctCount,
            timeSpent,
            completedAt: Date.now(),
            questions: answers,
          });
          answers.forEach((q, i) => {
            if (q.userAnswer !== q.correctIndex) {
              useAppStore.getState().addWrongQuestion({
                id: uid('wq-auto-'),
                subject: q.subject,
                chapter: q.chapter,
                question: q.question,
                options: q.options,
                userAnswer: String.fromCharCode(65 + (q.userAnswer ?? 0)),
                correctAnswer: String.fromCharCode(65 + q.correctIndex),
                analysis: q.analysis,
                addedAt: Date.now(),
                reviewCount: 0,
                nextReviewDate: getEbbinghausDates()[0],
                errorTags: [],
              });
            }
          });
          useAppStore.getState().setCurrentQuiz(null);
        },
        suggestions: ['🔄 再来一套测验', '📚 查看产生的错题', '📊 复盘本周学习'],
        newFlow: { flow: 'idle', step: 0, context: {} },
      };
    }
    return { content: t.chooseRange, type: 'text', newFlow: { flow: 'quiz', step: 1, context: {} } };
  }

  static handleReview(_intent: IntentResult, _ctx: Record<string, any>): EngineResponse {
    const store = useAppStore.getState();
    const progress = store.weeklyProgress;
    const recent = progress.slice(-7);
    const plannedTotal = recent.reduce((s, p) => s + p.plannedHours, 0);
    const actualTotal = recent.reduce((s, p) => s + p.actualHours, 0);
    const tasksDone = recent.reduce((s, p) => s + p.tasksCompleted, 0);
    const tasksTotal = recent.reduce((s, p) => s + p.tasksTotal, 0);
    const completionRate = tasksTotal ? Math.round(tasksDone / tasksTotal * 100) : 0;
    const hourRate = plannedTotal ? Math.round(actualTotal / plannedTotal * 100) : 0;
    const wrongReviewed = store.wrongQuestions.filter(w => w.reviewCount > 0).length;
    const wrongTotal = store.wrongQuestions.length;
    const masteryAvg = Math.round(store.knowledgePoints.reduce((s, kp) => s + kp.mastery, 0) / (store.knowledgePoints.length || 1));

    const weekDates = getWeekDates();
    const thisWeekWrong = store.wrongQuestions.filter(wq => weekDates.includes(formatDate(new Date(wq.addedAt))));
    const chapterStats: Record<string, number> = {};
    thisWeekWrong.forEach(wq => {
      chapterStats[wq.chapter] = (chapterStats[wq.chapter] || 0) + 1;
    });
    const topErrorChapters = Object.entries(chapterStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([chapter, count]) => {
        const chapterKps = store.knowledgePoints.filter(kp => kp.chapter === chapter);
        const weakest = [...chapterKps].sort((a, b) => a.mastery - b.mastery).slice(0, 2);
        return {
          chapter,
          count,
          ratio: thisWeekWrong.length ? Math.round((count / thisWeekWrong.length) * 100) : 0,
          suggestions: weakest.length > 0 
            ? `建议重点复习：${weakest.map(kp => kp.title).join('、')}` 
            : '建议回归教材精读本章核心概念，配合课后习题巩固。',
        };
      });

    const errorTagStats: Record<string, number> = {};
    store.wrongQuestions.forEach(wq => {
      if (wq.errorTags && wq.errorTags.length > 0) {
        wq.errorTags.forEach(tag => {
          errorTagStats[tag] = (errorTagStats[tag] || 0) + 1;
        });
      }
    });
    const errorTagDistribution = Object.entries(errorTagStats).map(([tag, count]) => ({
      tag,
      count,
    }));

    const goodParts: string[] = [];
    const badParts: string[] = [];
    const suggestions: string[] = [];

    if (hourRate >= 70) goodParts.push(`✅ 学习时长完成率 ${hourRate}%，持续投入很棒！`);
    else badParts.push(`⏰ 学习时长只完成了 ${hourRate}%，目标 ${plannedTotal}h，实际 ${actualTotal}h，需增加投入。`);
    if (completionRate >= 60) goodParts.push(`✅ 任务完成率 ${completionRate}%，执行力不错！`);
    else badParts.push(`📋 任务完成率仅 ${completionRate}%，建议拆分更细的小任务。`);
    if (masteryAvg >= 65) goodParts.push(`✅ 知识点平均掌握度 ${masteryAvg}%，基础扎实！`);
    else badParts.push(`📖 知识点掌握度 ${masteryAvg}%，需要加强背诵抽查。`);
    if (wrongTotal > 0 && wrongReviewed / wrongTotal >= 0.5) goodParts.push(`✅ 错题回顾率 ${Math.round(wrongReviewed / wrongTotal * 100)}%，坚持复习的习惯很好！`);
    if (wrongTotal > 0 && wrongReviewed / wrongTotal < 0.5) badParts.push(`📝 错题只复习了 ${wrongReviewed}/${wrongTotal}，艾宾浩斯计划要跟上哦。`);

    if (hourRate < 70) suggestions.push('🔸 建议：使用番茄工作法固定每日学习时段，早间黄金时间优先安排薄弱科目。');
    if (completionRate < 60) suggestions.push('🔸 建议：将大任务拆分成 25-40 分钟的小任务，完成后勾选会更有成就感。');
    if (masteryAvg < 65) suggestions.push('🔸 建议：每天安排 20 分钟进行知识点抽查，重点关注掌握度<50%的条目。');
    if (wrongTotal > 0 && wrongReviewed < wrongTotal) suggestions.push('🔸 建议：今天先复习完待复习的错题，再开始新内容的学习。');
    if (topErrorChapters.length > 0) {
      suggestions.push(`🔸 本周最易错章节：**${topErrorChapters[0].chapter}**（${topErrorChapters[0].count}题）。${topErrorChapters[0].suggestions}`);
    }
    if (suggestions.length === 0) suggestions.push('🔸 继续保持这个节奏！可以适当增加模拟测验频率，提前适应考试节奏。');

    const topChaptersMd = topErrorChapters.length > 0
      ? `\n\n### 🎯 本周易错章节 TOP3\n${topErrorChapters.map((c, i) => `| 排名 | 章节 | 错题数 | 占比 | 建议 |\n| --- | --- | --- | --- | --- |\n| ${i + 1} | ${c.chapter} | ${c.count}题 | ${c.ratio}% | ${c.suggestions} |`).join('\n')}\n`
      : '';

    const errorTagsMd = errorTagDistribution.length > 0
      ? `\n\n### 🏷️ 本周错因分布\n${errorTagDistribution.map(({ tag, count }) => `- **${tag}**：${count}题`).join('\n')}\n`
      : '';

    return {
      content: `📊 **本周复习复盘报告**\n\n📈 **核心指标**\n• 计划学习时长：${plannedTotal}h，实际：${actualTotal}h（${hourRate}%）\n• 任务完成：${tasksDone}/${tasksTotal}（${completionRate}%）\n• 知识点平均掌握度：${masteryAvg}%\n• 错题本：共 ${wrongTotal} 题，已复习 ${wrongReviewed} 题\n\n${goodParts.length ? '🌟 **做得好的地方**\n' + goodParts.join('\n') + '\n\n' : ''}${badParts.length ? '💪 **需要加强**\n' + badParts.join('\n') + '\n\n' : ''}${topChaptersMd}${errorTagsMd}\n📈 **下一阶段建议**\n${suggestions.join('\n')}\n\n继续加油，每天进步一点点！💪🎓`,
      type: 'chart',
      payload: {
        progress: recent,
        masteryAvg,
        completionRate,
        hourRate,
        topErrorChapters,
        errorTagDistribution,
      },
      suggestions: ['📋 调整下周计划', '🎯 立刻开始薄弱知识点抽查', '📚 复习今天的错题'],
      newFlow: { flow: 'idle', step: 0, context: {} },
    };
  }
}

export async function processUserMessage(text: string) {
  const store = useAppStore.getState();
  
  store.addMessage({ role: 'user', content: text, type: 'text' });
  store.setTyping(true);

  await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

  const intent = IntentParser.parse(text, store.flowState.currentFlow, store.flowState.context);
  const response = FlowController.handle(intent, text);

  if (response.sideEffects) response.sideEffects();

  store.addMessage({
    role: 'assistant',
    content: response.content,
    type: response.type,
    suggestions: response.suggestions,
    payload: response.payload,
  });

  if (response.newFlow) {
    store.setFlow(response.newFlow.flow, response.newFlow.step, response.newFlow.context);
  }

  store.setTyping(false);
}
