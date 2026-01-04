import { useState, useCallback } from 'react';

const STORAGE_KEY = 'recentlyCompleted';

export interface CompletedNode {
  path: string;
  timestamp: number;
}

/**
 * 跟踪最近完成的节点，用于刷新后高亮显示
 */
export function useRecentlyCompleted(maxCount: number = 10) {
  const [recentlyCompleted, setRecentlyCompleted] = useState<CompletedNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addCompleted = useCallback((path: string) => {
    setRecentlyCompleted(prev => {
      const newCompleted = [
        { path, timestamp: Date.now() },
        ...prev.filter(c => c.path !== path)
      ].slice(0, maxCount);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
      return newCompleted;
    });
  }, [maxCount]);

  const getLatestCompleted = useCallback((count: number = 2): string[] => {
    return [...recentlyCompleted]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
      .map(n => n.path);
  }, [recentlyCompleted]);

  const clear = useCallback(() => {
    setRecentlyCompleted([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentlyCompleted,
    addCompleted,
    getLatestCompleted,
    clear
  };
}
