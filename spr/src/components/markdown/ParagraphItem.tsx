import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Wand2, Loader2, Sparkles, HelpCircle, History } from 'lucide-react';
import { ParagraphSummary } from '../../types';

interface ParagraphItemProps {
  index: number;
  content: string;
  theme: 'light' | 'dark';
  isLinked: boolean;
  isHighlighted: boolean;
  canLink: boolean;
  linkedNodePath?: string;
  existingSummary?: ParagraphSummary;
  isGenerating: boolean;
  onParagraphClick: () => void;
  onScrollToNode?: (nodePath: string) => void;
  onGenerateSummary: (indices: number[]) => void;
  onShowSummary: (summary: ParagraphSummary) => void;
}

const ParagraphItem: React.FC<ParagraphItemProps> = memo(({
  index,
  content,
  theme,
  isLinked,
  isHighlighted,
  canLink,
  linkedNodePath,
  existingSummary,
  isGenerating,
  onParagraphClick,
  onScrollToNode,
  onGenerateSummary,
  onShowSummary
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = `
    markdown-paragraph relative group
    ${isHighlighted ? 'highlighted' : ''}
    ${isLinked ? 'linked' : ''}
    ${canLink ? 'can-link' : ''}
  `;

  return (
    <motion.div
      id={`para-${index}`}
      className={baseClasses}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.3), type: 'spring', stiffness: 200 }}
      onClick={canLink ? onParagraphClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={canLink ? { scale: 1.005 } : {}}
    >
      {/* Markdown 内容 */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>

      {/* 底部操作栏 */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* 已关联标签 */}
        {isLinked && (
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-[9px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              }`}
          >
            已关联
          </motion.span>
        )}

        {/* 跳转节点按钮 */}
        {isHovered && linkedNodePath && onScrollToNode && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onScrollToNode(linkedNodePath);
            }}
            className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${theme === 'dark'
              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
              : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-3 h-3" />
            跳转节点
          </motion.button>
        )}

        {/* 已有摘要标记 - 小圆点指示 */}
        {existingSummary && (
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'
              }`}
          >
            <Sparkles className="w-3 h-3" />
            已生成摘要
          </motion.span>
        )}
      </div>

      {/* 右侧操作槽位 - 悬浮显示 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`absolute right-2 top-2 flex flex-col gap-1.5 p-1.5 rounded-2xl ${theme === 'dark'
              ? 'bg-slate-800/90 border border-white/10'
              : 'bg-white/90 border border-slate-200'
              } shadow-lg backdrop-blur-sm`}
          >
            {/* 生成摘要按钮 */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateSummary([index]);
              }}
              disabled={isGenerating}
              className={`p-2 rounded-xl transition-all ${isGenerating ? 'cursor-not-allowed opacity-50' : ''
                } ${theme === 'dark'
                  ? 'bg-gradient-to-br from-violet-600/90 to-indigo-600/90 text-white hover:from-violet-500 hover:to-indigo-500'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white hover:from-violet-400 hover:to-indigo-400'
                }`}
              whileHover={!isGenerating ? { scale: 1.1, rotate: 10 } : {}}
              whileTap={!isGenerating ? { scale: 0.95 } : {}}
              title="生成AI摘要"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
            </motion.button>

            {/* 查看历史摘要按钮 - 有摘要时显示 */}
            {existingSummary && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowSummary(existingSummary);
                }}
                className={`p-2 rounded-xl transition-all ${theme === 'dark'
                  ? 'bg-gradient-to-br from-amber-500/90 to-orange-500/90 text-white hover:from-amber-400 hover:to-orange-400'
                  : 'bg-gradient-to-br from-amber-400 to-orange-400 text-white hover:from-amber-300 hover:to-orange-300'
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="查看历史摘要"
              >
                <History className="w-4 h-4" />
              </motion.button>
            )}

            {/* 未来功能占位 - ? 图标 */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: 未来功能
              }}
              className={`p-2 rounded-xl transition-all ${theme === 'dark'
                ? 'bg-slate-700/80 text-slate-400 hover:text-slate-300 hover:bg-slate-600/80'
                : 'bg-slate-100 text-slate-400 hover:text-slate-500 hover:bg-slate-200'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="更多功能即将推出"
            >
              <HelpCircle className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数优化渲染
  return (
    prevProps.index === nextProps.index &&
    prevProps.content === nextProps.content &&
    prevProps.theme === nextProps.theme &&
    prevProps.isLinked === nextProps.isLinked &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.canLink === nextProps.canLink &&
    prevProps.linkedNodePath === nextProps.linkedNodePath &&
    prevProps.existingSummary === nextProps.existingSummary &&
    prevProps.isGenerating === nextProps.isGenerating
  );
});

ParagraphItem.displayName = 'ParagraphItem';

export default ParagraphItem;
