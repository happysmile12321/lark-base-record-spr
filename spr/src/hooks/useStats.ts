import { useMemo } from "react";
import { SkeletonNode } from "../types";

interface UseStatsResult {
  total: number;
  completed: number;
  percentage: number;
}

export function useStats(
  analysis: SkeletonNode | null,
  completedCount: number
): UseStatsResult {
  return useMemo(() => {
    if (!analysis) return { total: 0, completed: 0, percentage: 0 };

    let total = 0;
    const countSlots = (node: SkeletonNode) => {
      if (["slot_concept", "slot_logic", "slot_action"].includes(node.type)) {
        total++;
      }
      node.children?.forEach(countSlots);
    };

    countSlots(analysis);

    return {
      total,
      completed: completedCount,
      percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  }, [analysis, completedCount]);
}
