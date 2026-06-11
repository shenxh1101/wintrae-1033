import type { Subject, KnowledgePoint } from '@/store/types';

export const mockSubjects: Subject[] = [
  {
    id: 'politics',
    name: '政治',
    chapters: [
      {
        id: 'politics-1',
        name: '马克思主义基本原理',
        children: [
          { id: 'politics-1-1', name: '马克思主义哲学', knowledgePoints: ['kp-1', 'kp-2'] },
          { id: 'politics-1-2', name: '马克思主义政治经济学', knowledgePoints: ['kp-3'] },
          { id: 'politics-1-3', name: '科学社会主义', knowledgePoints: ['kp-4'] },
        ],
      },
      {
        id: 'politics-2',
        name: '毛泽东思想和中国特色社会主义理论体系',
        children: [
          { id: 'politics-2-1', name: '毛泽东思想', knowledgePoints: ['kp-5'] },
          { id: 'politics-2-2', name: '邓小平理论', knowledgePoints: ['kp-6'] },
          { id: 'politics-2-3', name: '新时代中国特色社会主义思想', knowledgePoints: ['kp-7', 'kp-8'] },
        ],
      },
      {
        id: 'politics-3',
        name: '中国近现代史纲要',
        children: [
          { id: 'politics-3-1', name: '旧民主主义革命', knowledgePoints: ['kp-9'] },
          { id: 'politics-3-2', name: '新民主主义革命', knowledgePoints: ['kp-10'] },
        ],
      },
    ],
  },
  {
    id: 'english',
    name: '英语',
    chapters: [
      {
        id: 'english-1',
        name: '阅读理解',
        children: [
          { id: 'english-1-1', name: '主旨大意题', knowledgePoints: ['kp-11'] },
          { id: 'english-1-2', name: '细节理解题', knowledgePoints: ['kp-12'] },
          { id: 'english-1-3', name: '推理判断题', knowledgePoints: ['kp-13'] },
        ],
      },
      {
        id: 'english-2',
        name: '完形填空',
        children: [
          { id: 'english-2-1', name: '词汇辨析', knowledgePoints: ['kp-14'] },
          { id: 'english-2-2', name: '上下文逻辑', knowledgePoints: ['kp-15'] },
        ],
      },
      {
        id: 'english-3',
        name: '写作',
        children: [
          { id: 'english-3-1', name: '大作文', knowledgePoints: ['kp-16'] },
          { id: 'english-3-2', name: '小作文', knowledgePoints: ['kp-17'] },
        ],
      },
    ],
  },
  {
    id: 'math',
    name: '数学',
    chapters: [
      {
        id: 'math-1',
        name: '高等数学',
        children: [
          { id: 'math-1-1', name: '函数与极限', knowledgePoints: ['kp-18', 'kp-19'] },
          { id: 'math-1-2', name: '导数与微分', knowledgePoints: ['kp-20', 'kp-21'] },
          { id: 'math-1-3', name: '积分学', knowledgePoints: ['kp-22'] },
          { id: 'math-1-4', name: '级数', knowledgePoints: ['kp-23'] },
        ],
      },
      {
        id: 'math-2',
        name: '线性代数',
        children: [
          { id: 'math-2-1', name: '行列式', knowledgePoints: ['kp-24'] },
          { id: 'math-2-2', name: '矩阵', knowledgePoints: ['kp-25'] },
          { id: 'math-2-3', name: '向量与线性方程组', knowledgePoints: ['kp-26'] },
        ],
      },
      {
        id: 'math-3',
        name: '概率论与数理统计',
        children: [
          { id: 'math-3-1', name: '随机事件与概率', knowledgePoints: ['kp-27'] },
          { id: 'math-3-2', name: '随机变量', knowledgePoints: ['kp-28'] },
        ],
      },
    ],
  },
  {
    id: 'professional',
    name: '专业课',
    chapters: [
      {
        id: 'professional-1',
        name: '数据结构',
        children: [
          { id: 'professional-1-1', name: '线性表', knowledgePoints: ['kp-29'] },
          { id: 'professional-1-2', name: '树与二叉树', knowledgePoints: ['kp-30', 'kp-31'] },
          { id: 'professional-1-3', name: '图', knowledgePoints: ['kp-32'] },
          { id: 'professional-1-4', name: '排序与查找', knowledgePoints: ['kp-33'] },
        ],
      },
      {
        id: 'professional-2',
        name: '计算机组成原理',
        children: [
          { id: 'professional-2-1', name: '计算机系统概述', knowledgePoints: ['kp-34'] },
          { id: 'professional-2-2', name: '存储器层次结构', knowledgePoints: ['kp-35'] },
        ],
      },
    ],
  },
];

export const mockKnowledgePoints: KnowledgePoint[] = [
  { id: 'kp-1', subject: '政治', chapter: '马克思主义哲学', title: '物质与意识的辩证关系', content: '物质决定意识，意识对物质具有能动的反作用。物质是第一性的，意识是第二性的。意识具有目的性、计划性、主动创造性和自觉选择性。', mastery: 60 },
  { id: 'kp-2', subject: '政治', chapter: '马克思主义哲学', title: '矛盾的普遍性和特殊性', content: '矛盾存在于一切事物中，贯穿每一事物发展过程的始终。不同事物的矛盾各有其特点，同一事物的矛盾在不同发展阶段各有不同特点。普遍性寓于特殊性之中，特殊性离不开普遍性。', mastery: 45 },
  { id: 'kp-3', subject: '政治', chapter: '马克思主义政治经济学', title: '商品的二因素', content: '商品具有使用价值和价值两个因素。使用价值是商品能够满足人们某种需要的属性，是商品的自然属性。价值是凝结在商品中的无差别的人类劳动，是商品的社会属性。', mastery: 70 },
  { id: 'kp-4', subject: '政治', chapter: '科学社会主义', title: '科学社会主义的基本原则', content: '在生产资料公有制基础上组织生产，满足全体社会成员的需要是根本目的；对社会生产进行有计划的指导和调节，实行等量劳动领取等量产品的按劳分配原则。', mastery: 50 },
  { id: 'kp-5', subject: '政治', chapter: '毛泽东思想', title: '新民主主义革命的总路线', content: '无产阶级领导的，人民大众的，反对帝国主义、封建主义和官僚资本主义的革命。', mastery: 55 },
  { id: 'kp-6', subject: '政治', chapter: '邓小平理论', title: '社会主义的本质', content: '解放生产力，发展生产力，消灭剥削，消除两极分化，最终达到共同富裕。', mastery: 80 },
  { id: 'kp-7', subject: '政治', chapter: '新时代中国特色社会主义思想', title: '社会主要矛盾的变化', content: '中国特色社会主义进入新时代，我国社会主要矛盾已经转化为人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾。', mastery: 65 },
  { id: 'kp-8', subject: '政治', chapter: '新时代中国特色社会主义思想', title: '"五位一体"总体布局', content: '经济建设、政治建设、文化建设、社会建设、生态文明建设五位一体。', mastery: 58 },
  { id: 'kp-9', subject: '政治', chapter: '旧民主主义革命', title: '辛亥革命的历史意义', content: '辛亥革命是资产阶级领导的以反对君主专制制度、建立资产阶级共和国为目的的革命，是一次比较完全意义上的资产阶级民主革命。', mastery: 42 },
  { id: 'kp-10', subject: '政治', chapter: '新民主主义革命', title: '五四运动的历史意义', content: '五四运动是中国新民主主义革命的开端，促进了马克思主义在中国的传播及其与中国工人运动的结合。', mastery: 75 },
  { id: 'kp-11', subject: '英语', chapter: '主旨大意题', title: '主旨题解题技巧', content: '重点关注首尾段和每段首句；寻找高频复现词；注意转折词(but, however, yet)后的内容；避免选择过于宽泛或过于具体的选项。', mastery: 68 },
  { id: 'kp-12', subject: '英语', chapter: '细节理解题', title: '细节题定位方法', content: '根据题干关键词（专有名词、数字、特殊符号）定位原文；同义替换是正确答案的特征；注意因果关系词(because, due to)和比较级。', mastery: 52 },
  { id: 'kp-13', subject: '英语', chapter: '推理判断题', title: '推理题常见陷阱', content: '照抄原文的一般不是答案；推理不能过度；注意作者的态度词(positive, negative, neutral)；infer/imply/learn from题答案通常在转折后。', mastery: 38 },
  { id: 'kp-14', subject: '英语', chapter: '词汇辨析', title: '完形词汇辨析策略', content: '注意上下文语境复现；分析词汇搭配（动词+介词、形容词+名词）；利用感情色彩排除；近义词注意细微差异（range/scope/scale）。', mastery: 55 },
  { id: 'kp-15', subject: '英语', chapter: '上下文逻辑', title: '逻辑关系识别', content: '转折关系：but, however, nevertheless；因果：thus, therefore, consequently；递进：moreover, furthermore；让步：although, despite。', mastery: 62 },
  { id: 'kp-16', subject: '英语', chapter: '大作文', title: '图画作文三段式结构', content: '第一段：描述图画+点明寓意；第二段：分析原因/影响（2-3点）；第三段：总结+建议+展望。', mastery: 72 },
  { id: 'kp-17', subject: '英语', chapter: '小作文', title: '常见应用文类型', content: '建议信：suggest, recommend；道歉信：apologize, regret；邀请信：invite, participate；辞职信：resign, quit；感谢信：appreciate, grateful。', mastery: 48 },
  { id: 'kp-18', subject: '数学', chapter: '函数与极限', title: '两个重要极限', content: '(1) lim(x→0) sinx/x = 1；(2) lim(x→∞) (1+1/x)^x = e。记住它们的一般形式和等价无穷小替换条件。', mastery: 75 },
  { id: 'kp-19', subject: '数学', chapter: '函数与极限', title: '等价无穷小替换', content: '当x→0时：sinx~x，tanx~x，ln(1+x)~x，e^x-1~x，1-cosx~x²/2，(1+x)^α-1~αx。注意只能在乘除中替换。', mastery: 58 },
  { id: 'kp-20', subject: '数学', chapter: '导数与微分', title: '复合函数求导法则', content: '链式法则：若y=f(g(x))，则y\'=f\'(g(x))·g\'(x)。多层复合逐层求导，不要漏层。', mastery: 82 },
  { id: 'kp-21', subject: '数学', chapter: '导数与微分', title: '微分中值定理', content: '罗尔定理：f(a)=f(b)，则∃ξ使f\'(ξ)=0；拉格朗日：∃ξ使f(b)-f(a)=f\'(ξ)(b-a)；柯西：包含两个函数的推广形式。', mastery: 40 },
  { id: 'kp-22', subject: '数学', chapter: '积分学', title: '换元积分法与分部积分', content: '第一类换元（凑微分）：∫f(g(x))g\'(x)dx=∫f(u)du；分部积分：∫udv=uv-∫vdu，选择"反对幂三指"的顺序。', mastery: 65 },
  { id: 'kp-23', subject: '数学', chapter: '级数', title: '级数收敛判别法', content: '正项级数：比较判别法、比值判别法（达朗贝尔）、根值判别法；交错级数：莱布尼茨判别法；任意项级数：绝对收敛与条件收敛。', mastery: 35 },
  { id: 'kp-24', subject: '数学', chapter: '行列式', title: '行列式的性质与计算', content: '行列式转置值不变；互换两行变号；某行公因子可提出；两行成比例值为0；按行/列展开：det(A)=Σa_ijA_ij。', mastery: 70 },
  { id: 'kp-25', subject: '数学', chapter: '矩阵', title: '矩阵的逆运算', content: '可逆条件：det(A)≠0；求逆方法：伴随矩阵法A⁻¹=A*/det(A)；初等变换法(A|E)→(E|A⁻¹)；(AB)⁻¹=B⁻¹A⁻¹。', mastery: 60 },
  { id: 'kp-26', subject: '数学', chapter: '向量与线性方程组', title: '线性方程组解的结构', content: 'Ax=b有解⇔r(A)=r(A|b)；齐次方程组Ax=0的基础解系含n-r(A)个向量；非齐次通解=齐次通解+非齐次特解。', mastery: 45 },
  { id: 'kp-27', subject: '数学', chapter: '随机事件与概率', title: '全概率公式与贝叶斯公式', content: '全概率：P(A)=ΣP(B_i)P(A|B_i)；贝叶斯：P(B_j|A)=P(B_j)P(A|B_j)/ΣP(B_i)P(A|B_i)。关键在于划分样本空间。', mastery: 52 },
  { id: 'kp-28', subject: '数学', chapter: '随机变量', title: '常见离散分布', content: '0-1分布B(1,p)；二项分布B(n,p)；泊松分布P(λ)；几何分布；超几何分布。记住期望和方差公式。', mastery: 68 },
  { id: 'kp-29', subject: '专业课', chapter: '线性表', title: '顺序表与链表比较', content: '顺序表：随机访问O(1)，插入删除O(n)；链表：访问O(n)，插入删除O(1)（已知位置）；静态链表用数组+游标实现。', mastery: 78 },
  { id: 'kp-30', subject: '专业课', chapter: '树与二叉树', title: '二叉树遍历', content: '前序：根-左-右；中序：左-根-右；后序：左-右-根；层序：BFS。中序+前/后序可唯一确定一棵二叉树。', mastery: 65 },
  { id: 'kp-31', subject: '专业课', chapter: '树与二叉树', title: '平衡二叉树(AVL)的旋转', content: 'LL型：右旋；RR型：左旋；LR型：先左旋后右旋；RL型：先右旋后左旋。调整最小不平衡子树。', mastery: 38 },
  { id: 'kp-32', subject: '专业课', chapter: '图', title: '图的遍历算法', content: 'DFS：深度优先，栈/递归，类似树的先序；BFS：广度优先，队列，类似树的层序。DFS适合拓扑排序，BFS适合最短路径（无权图）。', mastery: 55 },
  { id: 'kp-33', subject: '专业课', chapter: '排序与查找', title: '排序算法复杂度对比', content: '快排/堆排/归并平均O(nlogn)；冒泡/插入/选择O(n²)；归并稳定需要O(n)空间；堆排原地不稳定；快排最坏O(n²)。', mastery: 72 },
  { id: 'kp-34', subject: '专业课', chapter: '计算机系统概述', title: '冯·诺依曼体系结构', content: '五大部件：运算器、控制器、存储器、输入设备、输出设备；存储程序思想：指令和数据存于存储器；以运算器为中心。', mastery: 85 },
  { id: 'kp-35', subject: '专业课', chapter: '存储器层次结构', title: 'Cache映射方式', content: '直接映射：主存块→Cache固定位置，冲突高；全相联：主存块→Cache任意位置，冲突低成本高；组相联：组间直接映射，组内全相联。', mastery: 50 },
];
