import { useState, useCallback } from 'react';

export interface NodeLinksState {
  [nodePath: string]: number[];
}

/**
 * 管理节点与段落的关联关系
 */
export function useNodeLinks() {
  const [selectedNodePath, setSelectedNodePath] = useState<string | null>(null);
  const [nodeParagraphs, setNodeParagraphs] = useState<NodeLinksState>({});
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);

  const toggleLink = useCallback((nodePath: string, paragraphIndex: number) => {
    setNodeParagraphs(prev => {
      const newLinks = { ...prev };
      const currentLinks = newLinks[nodePath] || [];

      if (currentLinks.includes(paragraphIndex)) {
        // 移除关联
        newLinks[nodePath] = currentLinks.filter(i => i !== paragraphIndex);
        if (newLinks[nodePath].length === 0) {
          delete newLinks[nodePath];
        }
      } else {
        // 添加关联
        newLinks[nodePath] = [...currentLinks, paragraphIndex];
      }

      return newLinks;
    });
  }, []);

  const getLinkedParagraphs = useCallback((nodePath: string): number[] => {
    return nodeParagraphs[nodePath] || [];
  }, [nodeParagraphs]);

  const enterLinkMode = useCallback((path: string) => {
    setSelectedNodePath(path);
  }, []);

  const exitLinkMode = useCallback(() => {
    setSelectedNodePath(null);
  }, []);

  const highlightParagraph = useCallback((index: number) => {
    setHighlightedParagraph(index);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedParagraph(null);
  }, []);

  return {
    // 状态
    selectedNodePath,
    nodeParagraphs,
    highlightedParagraph,

    // 操作
    toggleLink,
    getLinkedParagraphs,
    enterLinkMode,
    exitLinkMode,
    highlightParagraph,
    clearHighlight,

    // 设置器（用于外部状态同步）
    setNodeParagraphs,
  };
}
