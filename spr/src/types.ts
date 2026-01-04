
export type NodeType = 'root' | 'part' | 'chapter' | 'slot_concept' | 'slot_logic' | 'slot_action';

export interface SkeletonNode {
  label: string;
  type: NodeType;
  children?: SkeletonNode[];
}

export interface Note {
  id: string;
  content: string;
  originalContent: string;
  timestamp: number;
  category: string;
  corrections?: string;
}

// 节点绘图数据
export interface NodeDrawing {
  elements: any[]; // Excalidraw elements
  appState: any;  // Excalidraw appState
  files: any;      // Excalidraw files (images, etc.)
}

// 思维导图节点
export interface MindMapNode {
  id: string;
  label: string;
  type: 'center' | 'main' | 'sub';
  emoji?: string;
  children?: MindMapNode[];
}

// 段落摘要数据
export interface ParagraphSummary {
  id: string;
  paragraphIndices: number[];  // 关联的段落索引
  title: string;
  mindMap: MindMapNode;
  keyPoints: string[];
  createdAt: number;
}

// ===== 第四阶段：生成式提取系统 =====

// 测试题类型
export type QuizQuestionType = 'fill-blank' | 'true-false' | 'short-answer' | 'concept-map';

// 单个测试题
export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  answer: string;
  hints?: string[];           // 提示
  relatedNodePath: string;    // 关联的骨架节点路径
  difficulty: 1 | 2 | 3;      // 难度等级
}

// 用户答案
export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;          // 答题用时(秒)
}

// 重构节点(用户构建的)
export interface ReconstructedNode {
  id: string;
  label: string;
  children?: ReconstructedNode[];
}

// 重构对比结果
export interface ReconstructionResult {
  matchedNodes: string[];     // 匹配的节点路径
  missedNodes: string[];      // 遗漏的节点路径
  extraNodes: string[];       // 多余的节点
  completionRate: number;     // 完成度 0-100
}

// 校准预测
export type CalibrationPrediction = '90+' | '70-90' | '50-70' | '50-';

// 单次提取训练会话
export interface RetrievalSession {
  id: string;
  type: 'quiz' | 'reconstruction';
  createdAt: number;
  completedAt?: number;

  // 校准数据
  predictedScore?: CalibrationPrediction;
  actualScore: number;
  calibrationError: number;   // 预测分数 - 实际分数

  // 测试数据
  questions?: QuizQuestion[];
  answers?: UserAnswer[];

  // 重构数据
  reconstructedTree?: ReconstructedNode;
  reconstructionResult?: ReconstructionResult;

  // 薄弱点分析
  weakNodes: string[];        // 薄弱节点路径
}

// 液态背景相关类型（已废弃）
export interface Droplet {
  id: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
}

// 菜单相关类型
export type MenuItemAction = 'openSettings' | 'toggleExpand' | 'toggleTheme' | 'refresh' | 'toggleMarkdownPanel' | 'reparse';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action: MenuItemAction;
  visible?: boolean;
}

export type MenuPosition = 'top' | 'bottom' | 'left' | 'right';

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
  position: MenuPosition;
}

export interface MenuConfig {
  groups: MenuGroup[];
}

// 节点提取训练统计
export interface NodeRetrievalStats {
  lastQuizScore?: number;      // 最近一次测试分数 (0-100)
  lastReconScore?: number;     // 最近一次重构分数 (0-100)
  quizCount: number;           // 测试次数
  reconCount: number;          // 重构次数
  lastTestTime?: number;       // 上次测试时间戳
}

export interface SyncData {
  markdown: string;
  analysis: SkeletonNode | null;
  completedSlots: string[];
  notes: Record<string, Note[]>;
  noteCategories: string[];
  theme: 'light' | 'dark';
  menuConfig?: MenuConfig;
  nodeParagraphs?: Record<string, number[]>; // 节点路径 -> 关联的段落索引数组
  nodeDrawings?: Record<string, NodeDrawing>; // 节点路径 -> 绘图数据
  paragraphSummaries?: ParagraphSummary[];     // 段落摘要列表
  // 第四阶段：提取训练
  retrievalSessions?: RetrievalSession[];      // 提取训练历史
  lastStudyTime?: number;                      // 上次学习时间戳
  nextReviewTime?: number;                     // 下次建议复习时间戳
  nodeRetrievalStats?: Record<string, NodeRetrievalStats>; // 节点路径 -> 测试统计
}

