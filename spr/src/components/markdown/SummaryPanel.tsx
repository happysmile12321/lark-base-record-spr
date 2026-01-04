import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Circle, Sparkles } from 'lucide-react';
import { ParagraphSummary, MindMapNode } from '../../types';

interface SummaryPanelProps {
  summary: ParagraphSummary | null;
  theme: 'light' | 'dark';
  onClose: () => void;
}

// 思维导图分支颜色方案
const BRANCH_COLORS = [
  { bg: 'from-violet-500 to-purple-500', light: 'violet' },
  { bg: 'from-blue-500 to-cyan-500', light: 'blue' },
  { bg: 'from-emerald-500 to-teal-500', light: 'emerald' },
  { bg: 'from-orange-500 to-amber-500', light: 'orange' },
  { bg: 'from-pink-500 to-rose-500', light: 'pink' },
];

const SummaryPanel: React.FC<SummaryPanelProps> = memo(({ summary, theme, onClose }) => {
  if (!summary) return null;

  const { title, mindMap, keyPoints } = summary;
  const mainNodes = mindMap.children || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`overflow-hidden border-t ${theme === 'dark' ? 'border-white/10 bg-slate-900/50' : 'border-black/5 bg-slate-50/80'
          }`}
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* 头部 */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'
          }`}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark'
                ? 'bg-gradient-to-br from-violet-500/30 to-indigo-500/30'
                : 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20'
                }`}
            >
              <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-500'}`} />
            </motion.div>
            <div>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                AI 摘要 · {new Date(summary.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'hover:bg-white/10 text-slate-400'
              : 'hover:bg-black/5 text-slate-500'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-4">
          {/* 中心主题 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center mb-4"
          >
            <div className={`px-5 py-2.5 rounded-2xl ${theme === 'dark'
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
              : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
              }`}
              style={{ boxShadow: '0 8px 30px -8px rgba(99, 102, 241, 0.4)' }}
            >
              <span className="text-sm font-bold">
                {mindMap.emoji && <span className="mr-1.5">{mindMap.emoji}</span>}
                {mindMap.label}
              </span>
            </div>
          </motion.div>

          {/* 分支节点 - 横向滚动 */}
          <div
            className={`flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 summary-scroll ${theme === 'dark' ? 'summary-scroll-dark' : 'summary-scroll-light'
              }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'dark'
                ? 'rgba(99, 102, 241, 0.4) rgba(255, 255, 255, 0.05)'
                : 'rgba(99, 102, 241, 0.3) rgba(0, 0, 0, 0.05)'
            }}
          >
            {mainNodes.map((node, index) => {
              const colorScheme = BRANCH_COLORS[index % BRANCH_COLORS.length];
              const hasChildren = node.children && node.children.length > 0;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`flex-shrink-0 w-48 rounded-xl overflow-hidden ${theme === 'dark'
                    ? 'bg-slate-800/60 border border-white/10'
                    : 'bg-white border border-slate-200'
                    }`}
                >
                  {/* 主节点标题 */}
                  <div className={`px-3 py-2 bg-gradient-to-r ${colorScheme.bg}`}>
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {node.emoji && <span>{node.emoji}</span>}
                      {node.label}
                    </span>
                  </div>

                  {/* 子节点 */}
                  {hasChildren && (
                    <div className="p-2 space-y-1">
                      {node.children!.slice(0, 3).map((child, childIndex) => (
                        <motion.div
                          key={child.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 + childIndex * 0.03 }}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${theme === 'dark'
                            ? 'bg-white/5'
                            : 'bg-slate-50'
                            }`}
                        >
                          <ChevronRight className={`w-2.5 h-2.5 flex-shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`} />
                          <span className={`text-[10px] leading-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                            {child.emoji && <span className="mr-1">{child.emoji}</span>}
                            {child.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 核心要点 */}
          <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'
            }`}>
            <h4 className={`text-[10px] font-semibold mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
              核心要点
            </h4>
            <div className="flex flex-wrap gap-2">
              {keyPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] ${theme === 'dark'
                    ? 'bg-white/5 text-slate-300'
                    : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  <Circle className={`w-1.5 h-1.5 mt-1 flex-shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'
                    }`} fill="currentColor" />
                  <span>{point}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

SummaryPanel.displayName = 'SummaryPanel';

export default SummaryPanel;
