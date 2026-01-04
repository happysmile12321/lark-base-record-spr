import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Brain, Layout, CheckCircle2, Circle,
  Timer, StickyNote, Send, X, Tag, Clock, Link as LinkIcon,
  Lightbulb, Cpu, Zap, Check, Palette, GraduationCap
} from 'lucide-react';
import { NodeType, SkeletonNode, Note, NodeDrawing, NodeRetrievalStats } from '../../types';
import { getBorderClass, getMutedTextClass, getTextClass, getGlassClass } from '../../config/themeConfig';
import ProgressRing from '../ui/ProgressRing';
import PomodoroTimer from '../ui/PomodoroTimer';
import CanvasEditor from '../drawing/CanvasEditor';
import { RetrievalPanel } from '../retrieval';

// 根据 type 获取对应的图标和颜色
const getLeafNodeIcon = (type: NodeType, theme: 'light' | 'dark') => {
  const accent = theme === 'dark' ? 'text-white' : 'text-slate-900';
  switch (type) {
    case 'slot_concept':
      return { icon: Lightbulb, color: theme === 'dark' ? 'text-amber-400' : 'text-amber-500', accent };
    case 'slot_logic':
      return { icon: Brain, color: theme === 'dark' ? 'text-blue-400' : 'text-blue-500', accent };
    case 'slot_action':
      return { icon: Zap, color: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500', accent };
    default:
      return { icon: Circle, color: 'text-slate-400', accent };
  }
};

interface TreeItemProps {
  node: SkeletonNode;
  level: number;
  completedSlots: string[];
  onToggleComplete: (path: string) => void;
  path: string;
  forceExpand?: boolean;
  notes: Record<string, Note[]>;
  onAddNote: (path: string, content: string) => void;
  theme: 'light' | 'dark';
  selectedNodePath?: string | null;
  onExitLinkMode?: () => void;
  onEnterLinkMode?: (path: string) => void;
  nodeParagraphs?: Record<string, number[]>;
  nodeDrawings?: Record<string, NodeDrawing>;
  highlightedPaths?: Set<string>;
  expandedPaths?: Set<string>;
  onScrollToParagraph?: (index: number) => void;
  onDrawingChange?: (path: string, data: NodeDrawing) => void;
  // 提取训练统计
  nodeRetrievalStats?: Record<string, NodeRetrievalStats>;
  onSaveRetrievalStats?: (path: string, stats: NodeRetrievalStats) => void;
}

const TreeItem: React.FC<TreeItemProps> = memo(({
  node,
  level,
  completedSlots,
  onToggleComplete,
  path,
  forceExpand,
  notes,
  onAddNote,
  theme,
  selectedNodePath,
  onExitLinkMode,
  onEnterLinkMode,
  nodeParagraphs = {},
  nodeDrawings = {},
  highlightedPaths = new Set(),
  expandedPaths = new Set(),
  onScrollToParagraph,
  onDrawingChange,
  nodeRetrievalStats = {},
  onSaveRetrievalStats
}) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isRetrievalMode, setIsRetrievalMode] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeNotes = notes[path] || [];
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = ['slot_concept', 'slot_logic', 'slot_action'].includes(node.type);
  const isCompleted = completedSlots.includes(path);
  const linkedParagraphs = nodeParagraphs[path] || [];
  const isSelected = selectedNodePath === path;
  const isHighlighted = highlightedPaths.has(path);
  const shouldExpand = expandedPaths.has(path);
  const nodeDrawing = nodeDrawings[path];
  const hasDrawing = nodeDrawing?.elements && nodeDrawing.elements.length > 0;

  // 判断是否是小章节级别（所有子节点都是叶子节点）
  const isSubChapter = useMemo(() => {
    if (!hasChildren || isLeaf) return false;
    return node.children!.every(child =>
      ['slot_concept', 'slot_logic', 'slot_action'].includes(child.type)
    );
  }, [hasChildren, isLeaf, node.children]);

  // 获取当前节点的提取训练统计
  const currentRetrievalStats = nodeRetrievalStats[path];

  // 样式配置
  const glassBg = theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.03]';
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);
  const hoverBg = theme === 'dark' ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.05]';

  // 展开逻辑
  useEffect(() => {
    if (level === 0) {
      setIsOpen(true);
      return;
    }
    if (forceExpand || shouldExpand) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [forceExpand, shouldExpand, level]);

  // 高亮节点自动滚动
  useEffect(() => {
    if (isHighlighted && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [isHighlighted]);

  // 笔记模式聚焦
  useEffect(() => {
    if (isNoteMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNoteMode]);

  const stats = useMemo(() => {
    let total = 0, completed = 0;
    const traverse = (n: SkeletonNode, p: string) => {
      if (['slot_concept', 'slot_logic', 'slot_action'].includes(n.type)) {
        total++;
        if (completedSlots.includes(p)) completed++;
      }
      n.children?.forEach(c => traverse(c, `${p} > ${c.label}`));
    };
    traverse(node, path);
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [node, path, completedSlots]);

  const getIcon = () => {
    if (isLeaf) {
      const { icon: IconComponent, color, accent } = getLeafNodeIcon(node.type, theme);
      return isCompleted ? (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${accent}`}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Check className="w-4 h-4" />
        </div>
      ) : (
        <IconComponent className={`w-5 h-5 ${color}`} />
      );
    }
    switch (node.type) {
      case 'root':
        return <Brain className={`w-6 h-6 ${textColor} opacity-80`} />;
      case 'part':
        return <Layout className={`w-6 h-6 ${textColor} opacity-60`} />;
      case 'chapter':
        return <Brain className={`w-6 h-6 ${textColor} opacity-60`} />;
      default:
        return null;
    }
  };

  // 点击节点时：切换完成状态 + 如果有关联段落则滚动到对应位置（不进入关联模式）
  const handleNodeClick = () => {
    if (isLeaf && linkedParagraphs.length > 0 && onScrollToParagraph) {
      onScrollToParagraph(linkedParagraphs[0]);
    }
  };

  return (
    <div className={`mt-4 ${level > 0 ? 'ml-5' : ''}`} ref={containerRef} data-node-path={path}>
      {/* 主节点卡片 - 玻璃态效果 */}
      <motion.div
        className={`group flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer ${glassBg} ${borderClass} ${hoverBg}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        onClick={() => {
          if (isLeaf) {
            handleNodeClick();
            onToggleComplete(path);
          }
        }}
        style={{
          boxShadow: isHighlighted
            ? '0 0 30px rgba(251, 191, 36, 0.25), inset 0 0 0 1px rgba(251, 191, 36, 0.4)'
            : theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* 展开/收起箭头 */}
        <motion.div
          onClick={(e) => {
            e.stopPropagation();
            hasChildren && setIsOpen(!isOpen);
          }}
          className={`cursor-pointer ${!hasChildren ? 'opacity-0' : ''} ${mutedText} hover:${textColor} transition-colors`}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>

        {/* 进度环（仅非叶子节点） */}
        {!isLeaf && <ProgressRing percentage={stats.percentage} theme={theme} />}

        {/* 图标 */}
        <div className="flex-shrink-0">{getIcon()}</div>

        {/* 标签 */}
        <div className="flex-1">
          <motion.span
            className={`text-xs tracking-tight ${isLeaf ? 'font-medium italic' : 'font-black uppercase'}`}
            key={node.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {node.label}
          </motion.span>
          {linkedParagraphs.length > 0 && (
            <span className={`ml-3 text-[9px] px-3 py-1 rounded-full ${glassBg} ${borderClass} ${textColor}`}>
              {linkedParagraphs.length} 段
            </span>
          )}
          {/* 小章节的提取训练统计 */}
          {isSubChapter && currentRetrievalStats && (
            <div className="flex items-center gap-2 mt-1">
              {currentRetrievalStats.lastQuizScore !== undefined && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 ${currentRetrievalStats.lastQuizScore >= 70
                  ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
                  : currentRetrievalStats.lastQuizScore >= 50
                    ? theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'
                    : theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
                  }`}>
                  <Zap className="w-2.5 h-2.5" />
                  {currentRetrievalStats.lastQuizScore}%
                </span>
              )}
              {currentRetrievalStats.lastReconScore !== undefined && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 ${currentRetrievalStats.lastReconScore >= 70
                  ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
                  : currentRetrievalStats.lastReconScore >= 50
                    ? theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'
                    : theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
                  }`}>
                  <Brain className="w-2.5 h-2.5" />
                  {currentRetrievalStats.lastReconScore}%
                </span>
              )}
              {(currentRetrievalStats.quizCount > 0 || currentRetrievalStats.reconCount > 0) && (
                <span className={`text-[8px] ${mutedText}`}>
                  {currentRetrievalStats.quizCount + currentRetrievalStats.reconCount}次
                </span>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-1.5">
          {/* 番茄钟按钮（仅非叶子节点） */}
          {!isLeaf && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsTimerMode(!isTimerMode);
              }}
              className={`p-2.5 rounded-full transition-all relative min-w-[36px] min-h-[36px] flex items-center justify-center ${glassBg} ${borderClass} ${mutedText} ${hoverBg}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Timer className="w-4 h-4" />
            </motion.button>
          )}

          {/* 关联段落按钮（仅叶子节点） */}
          {isLeaf && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (isLinkMode) {
                  // 退出关联模式
                  setIsLinkMode(false);
                  if (onExitLinkMode) onExitLinkMode();
                } else {
                  // 进入关联模式
                  setIsLinkMode(true);
                  if (onEnterLinkMode) onEnterLinkMode(path);
                  // 如果有关联段落，滚动到第一个
                  if (linkedParagraphs.length > 0 && onScrollToParagraph) {
                    onScrollToParagraph(linkedParagraphs[0]);
                  }
                }
              }}
              className={`p-2.5 rounded-full transition-all relative min-w-[36px] min-h-[36px] flex items-center justify-center ${isLinkMode || linkedParagraphs.length > 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : `${glassBg} ${borderClass} ${mutedText} ${hoverBg}`
                }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LinkIcon className="w-4 h-4" />
              {linkedParagraphs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-emerald-600 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {linkedParagraphs.length}
                </span>
              )}
            </motion.button>
          )}

          {/* 绘图按钮（仅叶子节点） */}
          {isLeaf && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawingMode(!isDrawingMode);
              }}
              className={`p-2.5 rounded-full transition-all relative min-w-[36px] min-h-[36px] flex items-center justify-center ${isDrawingMode || hasDrawing
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : `${glassBg} ${borderClass} ${mutedText} ${hoverBg}`
                }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Palette className="w-4 h-4" />
              {hasDrawing && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  ✓
                </span>
              )}
            </motion.button>
          )}

          {/* 笔记按钮 */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsNoteMode(!isNoteMode);
            }}
            className={`p-2.5 rounded-full transition-all relative min-w-[36px] min-h-[36px] flex items-center justify-center ${isNoteMode
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              : `${glassBg} ${borderClass} ${mutedText} ${hoverBg}`
              }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <StickyNote className="w-4 h-4" />
            {nodeNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                {nodeNotes.length}
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* 番茄钟面板 */}
      <AnimatePresence>
        {isTimerMode && !isLeaf && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PomodoroTimer
              onComplete={() => { }}
              onClose={() => setIsTimerMode(false)}
              theme={theme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 关联段落面板 */}
      <AnimatePresence>
        {isLinkMode && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, y: -20, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`rounded-[1.5rem] overflow-hidden ${glassBg} ${borderClass}`}
            style={{ boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)' }}
          >
            <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <LinkIcon className={`w-4 h-4 text-emerald-400`} />
                <span className={`text-xs font-bold ${textColor}`}>关联段落</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${glassBg} ${borderClass} text-emerald-400`}>
                  已选 {linkedParagraphs.length} 个
                </span>
              </div>
              <button
                onClick={() => {
                  setIsLinkMode(false);
                  if (onExitLinkMode) onExitLinkMode();
                }}
                className={`${mutedText} hover:text-rose-500 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className={`text-xs mb-3 ${mutedText}`}>
                点击右侧 Markdown 中的段落来关联。已关联的段落再次点击可取消。
              </p>
              <motion.button
                onClick={() => {
                  setIsLinkMode(false);
                  if (onExitLinkMode) onExitLinkMode();
                }}
                className={`w-full py-2 rounded-full font-bold transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-400 text-sm`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-3.5 h-3.5" />
                完成选择 ({linkedParagraphs.length})
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 笔记面板 */}
      <AnimatePresence>
        {isNoteMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-[1.5rem] overflow-hidden ${glassBg} ${borderClass}`}
            style={{ boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)' }}
          >
            {/* 头部 */}
            <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-indigo-400" />
                <span className={`text-xs font-bold ${textColor}`}>分心停车场</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${glassBg} ${borderClass} ${mutedText}`}>
                  {nodeNotes.length} 条
                </span>
              </div>
              <button
                onClick={() => setIsNoteMode(false)}
                className={`${mutedText} hover:text-rose-500 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 输入区域 */}
            <div className={`p-4 border-b ${borderClass}`}>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && noteInput.trim()) {
                      onAddNote(path, noteInput);
                      setNoteInput('');
                    }
                  }}
                  placeholder="记录你的分心想法..."
                  className={`flex-1 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${theme === 'dark'
                    ? 'bg-white/[0.05] border border-white/[0.1] text-white'
                    : 'bg-black/[0.05] border border-black/[0.1] text-slate-900'
                    }`}
                />
                <motion.button
                  onClick={() => {
                    if (noteInput.trim()) {
                      onAddNote(path, noteInput);
                      setNoteInput('');
                    }
                  }}
                  className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-400 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* 笔记列表 */}
            {nodeNotes.length > 0 && (
              <div className="max-h-36 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {nodeNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl p-3 border transition-all ${glassBg} ${borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-[10px] leading-relaxed flex-1 ${textColor}`}>
                        {note.content}
                      </p>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className={`flex items-center gap-1 text-[8px] px-2 py-0.5 rounded-lg ${theme === 'dark'
                          ? 'bg-indigo-500/10 text-indigo-300'
                          : 'bg-indigo-100 text-indigo-600'
                          }`}>
                          <Tag className="w-2.5 h-2.5" />
                          <span className="font-semibold">{note.category}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-[7px] ${mutedText}`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 绘图面板 */}
      <AnimatePresence>
        {isDrawingMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-[1.5rem] overflow-hidden ${glassBg} ${borderClass}`}
            style={{ boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)' }}
          >
            {/* 头部 */}
            <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <span className={`text-xs font-bold ${textColor}`}>绘图板</span>
                {hasDrawing && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${glassBg} ${borderClass} text-purple-400`}>
                    已绘制
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsDrawingMode(false)}
                className={`${mutedText} hover:text-rose-500 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 绘图区域 */}
            <div className="p-4">
              <CanvasEditor
                initialData={nodeDrawing || null}
                theme={theme}
                onChange={(data) => onDrawingChange?.(path, data)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 子节点 */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-3 border-l ml-6 pl-3 ${borderClass}`}
          >
            {node.children!.map((child, idx) => (
              <TreeItem
                key={idx}
                node={child}
                level={level + 1}
                path={`${path} > ${child.label}`}
                completedSlots={completedSlots}
                onToggleComplete={onToggleComplete}
                forceExpand={forceExpand}
                notes={notes}
                onAddNote={onAddNote}
                theme={theme}
                selectedNodePath={selectedNodePath}
                onExitLinkMode={onExitLinkMode}
                onEnterLinkMode={onEnterLinkMode}
                nodeParagraphs={nodeParagraphs}
                nodeDrawings={nodeDrawings}
                highlightedPaths={highlightedPaths}
                expandedPaths={expandedPaths}
                onScrollToParagraph={onScrollToParagraph}
                onDrawingChange={onDrawingChange}
                nodeRetrievalStats={nodeRetrievalStats}
                onSaveRetrievalStats={onSaveRetrievalStats}
              />
            ))}

            {/* 小章节级别的提取训练入口 */}
            {isSubChapter && (
              <>
                {!isRetrievalMode ? (
                  <motion.button
                    onClick={() => setIsRetrievalMode(true)}
                    className={`mt-4 w-full py-3 px-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${theme === 'dark'
                      ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/20 hover:border-indigo-400/40 text-indigo-300'
                      : 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 hover:border-indigo-300 text-indigo-600'
                      }`}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-xs font-bold">提取训练</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'
                      }`}>
                      {stats.percentage}% 完成
                    </span>
                  </motion.button>
                ) : onSaveRetrievalStats ? (
                  <RetrievalPanel
                    theme={theme}
                    node={node}
                    nodePath={path}
                    currentStats={currentRetrievalStats}
                    onClose={() => setIsRetrievalMode(false)}
                    onSaveStats={onSaveRetrievalStats}
                  />
                ) : null}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TreeItem;
