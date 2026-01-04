import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText } from 'lucide-react';
import { getBorderClass, getGlassClass, getTextClass, getMutedTextClass } from '../../config/themeConfig';
import { generateSummary } from '../../services/geminiService';
import { ParagraphSummary } from '../../types';
import ParagraphItem from './ParagraphItem';
import SummaryPanel from './SummaryPanel';
import { getMarkdownStyles } from './markdownStyles';

interface MarkdownViewProps {
  markdown: string;
  theme: 'light' | 'dark';
  className?: string;
  scrollPosition?: number;
  onScrollChange?: (position: number) => void;
  onParagraphClick?: (index: number) => void;
  highlightedParagraph?: number | null;
  selectedNodePath?: string | null;
  onToggleParagraphLink?: (paragraphIndex: number) => void;
  linkedParagraphs?: number[];
  paragraphNodeMap?: Record<number, string>;
  onScrollToNode?: (nodePath: string) => void;
  // 摘要相关
  paragraphSummaries?: ParagraphSummary[];
  onSaveSummary?: (summary: ParagraphSummary) => void;
}

export interface MarkdownViewRef {
  scrollToParagraph: (index: number) => void;
}

const MarkdownView = forwardRef<MarkdownViewRef, MarkdownViewProps>(({
  markdown,
  theme,
  className = '',
  scrollPosition = 0,
  onScrollChange,
  onParagraphClick,
  highlightedParagraph = null,
  selectedNodePath = null,
  onToggleParagraphLink,
  linkedParagraphs = [],
  paragraphNodeMap = {},
  onScrollToNode,
  paragraphSummaries = [],
  onSaveSummary
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const lastScrollPosition = useRef(0);

  // 状态
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [activeSummary, setActiveSummary] = useState<ParagraphSummary | null>(null);

  // 主题样式
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);
  const markdownStyles = useMemo(() => getMarkdownStyles(theme), [theme]);

  // 暴露 scrollToParagraph 方法
  useImperativeHandle(ref, () => ({
    scrollToParagraph: (index: number) => {
      const paraElement = document.getElementById(`para-${index}`);
      if (paraElement && scrollRef.current) {
        isProgrammaticScroll.current = true;
        const scrollTop = paraElement.offsetTop - 20;
        scrollRef.current.scrollTop = scrollTop;
        lastScrollPosition.current = scrollTop;
        setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
      }
    }
  }));

  // 分割段落
  useEffect(() => {
    if (!markdown) {
      setParagraphs([]);
      return;
    }
    const lines = markdown.split('\n');
    const paras: string[] = [];
    let currentPara = '';

    for (const line of lines) {
      if (line.trim() === '') {
        if (currentPara.trim()) {
          paras.push(currentPara.trim());
          currentPara = '';
        }
      } else {
        currentPara += (currentPara ? '\n' : '') + line;
      }
    }
    if (currentPara.trim()) {
      paras.push(currentPara.trim());
    }
    setParagraphs(paras);
  }, [markdown]);

  // 恢复滚动位置
  useEffect(() => {
    if (scrollRef.current && scrollPosition > 0 && Math.abs(scrollPosition - lastScrollPosition.current) > 100) {
      isProgrammaticScroll.current = true;
      scrollRef.current.scrollTop = scrollPosition;
      lastScrollPosition.current = scrollPosition;
      setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
    }
  }, [scrollPosition]);

  // 滚动处理
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticScroll.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    if (Math.abs(scrollTop - lastScrollPosition.current) > 10) {
      lastScrollPosition.current = scrollTop;
      onScrollChange?.(scrollTop);
    }
  }, [onScrollChange]);

  // 段落点击
  const handleParagraphClick = useCallback((index: number) => {
    onParagraphClick?.(index);
    if (selectedNodePath) {
      onToggleParagraphLink?.(index);
    }
  }, [onParagraphClick, selectedNodePath, onToggleParagraphLink]);

  // 查找段落的现有摘要
  const findSummaryForParagraph = useCallback((index: number): ParagraphSummary | undefined => {
    return paragraphSummaries.find(s => s.paragraphIndices.includes(index));
  }, [paragraphSummaries]);

  // 生成摘要
  const handleGenerateSummary = useCallback(async (indices: number[]) => {
    if (indices.length === 0) return;

    setGeneratingIndex(indices[0]);
    try {
      const selectedParagraphs = indices.map(idx => paragraphs[idx]);
      const result = await generateSummary(selectedParagraphs);

      const newSummary: ParagraphSummary = {
        id: `summary-${Date.now()}`,
        paragraphIndices: indices,
        title: result.title,
        mindMap: result.mindMap,
        keyPoints: result.keyPoints,
        createdAt: Date.now()
      };

      onSaveSummary?.(newSummary);
      setActiveSummary(newSummary);
    } catch (error) {
      console.error('摘要生成失败:', error);
    } finally {
      setGeneratingIndex(null);
    }
  }, [paragraphs, onSaveSummary]);

  // 显示摘要
  const handleShowSummary = useCallback((summary: ParagraphSummary) => {
    setActiveSummary(summary);
  }, []);

  // 关闭摘要
  const handleCloseSummary = useCallback(() => {
    setActiveSummary(null);
  }, []);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 头部 */}
      <div className={`px-8 py-5 border-b flex items-center gap-4 ${glassClass} ${borderClass}`}
        style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
        <motion.div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${glassClass} ${borderClass}`}
          style={{ backdropFilter: 'blur(20px)' }}
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
        </motion.div>
        <span className={`text-xs font-black uppercase tracking-[0.2em] ${mutedText}`}>
          Markdown 源文档
        </span>
        {paragraphs.length > 0 && (
          <motion.span
            key={paragraphs.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-xs ml-auto ${mutedText}`}
          >
            {paragraphs.length} 段落
          </motion.span>
        )}
        {selectedNodePath && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              }`}
          >
            选择段落中...
          </motion.span>
        )}
      </div>

      {/* 内容区域 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
      >
        {paragraphs.length > 0 ? (
          <div className={`markdown-content ${textColor} opacity-90`}>
            <style>{markdownStyles}</style>
            {paragraphs.map((para, index) => (
              <ParagraphItem
                key={index}
                index={index}
                content={para}
                theme={theme}
                isLinked={linkedParagraphs.includes(index)}
                isHighlighted={highlightedParagraph === index}
                canLink={!!selectedNodePath}
                linkedNodePath={paragraphNodeMap[index]}
                existingSummary={findSummaryForParagraph(index)}
                isGenerating={generatingIndex === index}
                onParagraphClick={() => handleParagraphClick(index)}
                onScrollToNode={onScrollToNode}
                onGenerateSummary={handleGenerateSummary}
                onShowSummary={handleShowSummary}
              />
            ))}
          </div>
        ) : markdown ? (
          <div className={`markdown-content ${textColor} opacity-90`}>
            <style>{markdownStyles}</style>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={`text-center py-16 ${mutedText}`}>
            <p className="text-sm font-light opacity-50">暂无 Markdown 内容</p>
          </div>
        )}
      </div>

      {/* 摘要面板 - 页内滑出展示 */}
      <SummaryPanel
        summary={activeSummary}
        theme={theme}
        onClose={handleCloseSummary}
      />
    </div>
  );
});

MarkdownView.displayName = 'MarkdownView';

export default MarkdownView;
