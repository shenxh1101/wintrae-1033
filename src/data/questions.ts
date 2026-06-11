import type { QuizQuestion } from '@/store/types';

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    subject: '政治',
    chapter: '马克思主义哲学',
    question: '物质和意识的对立只有在非常有限的范围内才有绝对的意义，超出这个范围便是相对的了。这个范围是指（）',
    options: [
      'A. 物质和意识何者为第一性',
      'B. 物质和意识是否具有同一性',
      'C. 物质和意识何者更重要',
      'D. 物质和意识何者与社会生活的关系更密切'
    ],
    correctIndex: 0,
    analysis: '答案A。列宁指出："物质和意识的对立，也只是在非常有限的范围内才有绝对的意义，在这里，仅仅在承认什么是第一性和什么是第二性的这个认识论的基本问题的范围内才有绝对的意义。超出这个范围，这种对立无疑是相对的。"'
  },
  {
    id: 'q-2',
    subject: '政治',
    chapter: '马克思主义哲学',
    question: '"从辩证唯物主义的观点看来，哲学唯心主义是把认识的某一特征、某一方面、某一侧面，片面地、夸大地发展（膨胀、扩大）为脱离了物质、脱离了自然的、神化了的绝对。"这一论断表明，唯心主义产生的认识论根源是（）',
    options: [
      'A. 辩证法与形而上学的对立',
      'B. 主观与客观、认识与实践的分离',
      'C. 把真理的绝对性和相对性对立起来',
      'D. 把认识的感性阶段和理性阶段对立起来'
    ],
    correctIndex: 1,
    analysis: '答案B。题干引用的是列宁的话，说明哲学唯心主义的认识论根源是把认识的某一特征、方面片面夸大，导致主观与客观、认识与实践相分离。'
  },
  {
    id: 'q-3',
    subject: '数学',
    chapter: '函数与极限',
    question: '极限 lim(x→0) (sin3x)/2x 的值是（）',
    options: [
      'A. 0',
      'B. 3/2',
      'C. 2/3',
      'D. ∞'
    ],
    correctIndex: 1,
    analysis: '答案B。利用重要极限lim(x→0) sinx/x=1，原式=lim(x→0) (sin3x)/(3x)·(3x)/(2x) = 1·3/2 = 3/2。'
  },
  {
    id: 'q-4',
    subject: '数学',
    chapter: '导数与微分',
    question: '设 y=ln(1+x²)，则 dy 等于（）',
    options: [
      'A. 2x/(1+x²) dx',
      'B. 1/(1+x²) dx',
      'C. 2x·ln(1+x²) dx',
      'D. x/(1+x²) dx'
    ],
    correctIndex: 0,
    analysis: '答案A。y\' = [ln(1+x²)]\' = (1/(1+x²))·2x = 2x/(1+x²)，所以 dy = y\'·dx = 2x/(1+x²) dx。'
  },
  {
    id: 'q-5',
    subject: '数学',
    chapter: '矩阵',
    question: '设A是3阶方阵，且 det(A) = 2，则 det(2A⁻¹) 等于（）',
    options: [
      'A. 4',
      'B. 2',
      'C. 1',
      'D. 8'
    ],
    correctIndex: 0,
    analysis: '答案A。det(kA) = kⁿ·det(A)（n为阶数），det(A⁻¹) = 1/det(A)。所以det(2A⁻¹) = 2³ · det(A⁻¹) = 8 · 1/2 = 4。'
  },
  {
    id: 'q-6',
    subject: '英语',
    chapter: '词汇辨析',
    question: 'The company has decided to _____ production of the old model next year.',
    options: [
      'A. cease',
      'B. seize',
      'C. tease',
      'D. please'
    ],
    correctIndex: 0,
    analysis: '答案A。cease意为"停止"；seize意为"抓住"；tease意为"取笑"；please意为"使高兴"。根据句意，公司决定明年停止旧型号的生产，故选cease。'
  },
  {
    id: 'q-7',
    subject: '专业课',
    chapter: '排序与查找',
    question: '对一组数据（84, 47, 25, 15, 21）进行从小到大排序，数据元素的交换次数最少的排序方法是（）',
    options: [
      'A. 快速排序',
      'B. 冒泡排序',
      'C. 直接插入排序',
      'D. 选择排序'
    ],
    correctIndex: 2,
    analysis: '答案C。直接插入排序在数据基本有序时移动次数最少。虽然本题数据不是完全有序，但直接插入排序的平均比较和移动次数在小规模数据下优于其他选项。快速排序和冒泡排序在初始序列部分逆序时交换次数较多。'
  },
  {
    id: 'q-8',
    subject: '专业课',
    chapter: '树与二叉树',
    question: '一棵完全二叉树中有1001个结点，其中叶子结点的个数是（）',
    options: [
      'A. 250',
      'B. 254',
      'C. 500',
      'D. 501'
    ],
    correctIndex: 3,
    analysis: '答案D。完全二叉树性质：n = n0 + n1 + n2，又n2 = n0 - 1，且n1=0或1。代入：1001 = n0 + n1 + n0 - 1，即2n0 + n1 = 1002。n1=0时n0=501；n1=1时n0非整数。所以叶子数=501。'
  },
  {
    id: 'q-9',
    subject: '政治',
    chapter: '新时代中国特色社会主义思想',
    question: '党的十九大报告指出，中国特色社会主义进入新时代，我国社会主要矛盾已经转化为（）',
    options: [
      'A. 人民日益增长的物质文化需要同落后的社会生产之间的矛盾',
      'B. 人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾',
      'C. 无产阶级和资产阶级之间的矛盾',
      'D. 生产力和生产关系之间的矛盾'
    ],
    correctIndex: 1,
    analysis: '答案B。党的十九大明确指出，我国社会主要矛盾已经转化为人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾。这是关系全局的历史性变化。'
  },
  {
    id: 'q-10',
    subject: '数学',
    chapter: '随机事件与概率',
    question: '设A、B为两个随机事件，且P(B)>0，则下列各式中一定正确的是（）',
    options: [
      'A. P(A) ≤ P(A|B)',
      'B. P(A) ≤ P(B)',
      'C. P(A|B) = P(B|A)·P(A)/P(B)',
      'D. P(A∪B) = P(A) + P(B)'
    ],
    correctIndex: 2,
    analysis: '答案C。根据条件概率定义：P(A|B)=P(AB)/P(B)，又P(AB)=P(B|A)·P(A)，所以P(A|B)=P(B|A)·P(A)/P(B)，这就是贝叶斯公式的简单形式。A、B不一定正确，D需要A、B互斥。'
  },
  {
    id: 'q-11',
    subject: '英语',
    chapter: '推理判断题',
    question: 'The passage implies that the original purpose of building the bridge was to _____.',
    options: [
      'A. promote tourism in the region',
      'B. connect remote areas for commerce',
      'C. facilitate military transportation',
      'D. demonstrate engineering prowess'
    ],
    correctIndex: 1,
    analysis: '答案B。推理判断题需要根据上下文推断。桥梁建设的最根本原始目的通常是连接偏远地区以促进商业和贸易往来。选项A（促进旅游）是附加效应而非原始目的；C（军事运输）和D（展示工程实力）是特定历史情境下的目的，不够普遍。'
  },
  {
    id: 'q-12',
    subject: '专业课',
    chapter: '存储器层次结构',
    question: '假设主存容量为16MB，Cache容量为16KB，字长为32位。若采用直接映射方式，则Cache的标记字段、行号字段、字地址字段的位数分别是（）',
    options: [
      'A. 11, 12, 2',
      'B. 10, 12, 2',
      'C. 12, 10, 2',
      'D. 10, 10, 4'
    ],
    correctIndex: 1,
    analysis: '答案B。主存地址共24位（16MB=2²⁴B）。Cache行数：16KB/(4B×1字/行假设)=4K行=2¹²行，所以行号12位。字地址：32位=4字节=2²字节，字内地址2位。标记位=24-12-2=10位。'
  },
];

export function getRandomQuestions(count: number, subject?: string, chapter?: string): QuizQuestion[] {
  let pool = [...mockQuizQuestions];
  if (subject) pool = pool.filter(q => q.subject === subject);
  if (chapter) pool = pool.filter(q => q.chapter.includes(chapter));
  pool = pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.min(count, pool.length));
}
