import { SkeletonNode, NodeType } from "../types";

export interface NodeStats {
  total: number;
  completed: number;
  percentage: number;
}

/**
 * 节点工具函数集合
 */
export const nodeUtils = {
  /**
   * 计算节点的统计信息（包括子节点）
   */
  calculateStats(node: SkeletonNode, completedSlots: string[]): NodeStats {
    let total = 0;
    let completed = 0;

    const traverse = (n: SkeletonNode, path: string) => {
      if (this.isLeafNode(n.type)) {
        total++;
        if (completedSlots.includes(path)) {
          completed++;
        }
      }
      n.children?.forEach((child) => {
        traverse(child, `${path} > ${child.label}`);
      });
    };

    traverse(node, node.label);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  },

  /**
   * 判断是否为叶子节点
   */
  isLeafNode(type: NodeType): boolean {
    return ["slot_concept", "slot_logic", "slot_action"].includes(type);
  },

  /**
   * 生成节点路径
   */
  generatePath(parentPath: string, label: string): string {
    return `${parentPath} > ${label}`;
  },

  /**
   * 获取路径的深度（层级数）
   */
  getPathDepth(path: string): number {
    return path.split(" > ").length;
  },

  /**
   * 获取路径的所有父级路径
   */
  getParentPaths(path: string): string[] {
    const parts = path.split(" > ");
    const paths: string[] = [];

    for (let i = 1; i <= parts.length; i++) {
      paths.push(parts.slice(0, i).join(" > "));
    }

    return paths;
  },

  /**
   * 查找所有叶子节点
   */
  findLeafNodes(node: SkeletonNode): SkeletonNode[] {
    const leaves: SkeletonNode[] = [];

    const traverse = (n: SkeletonNode) => {
      if (this.isLeafNode(n.type)) {
        leaves.push(n);
      }
      n.children?.forEach(traverse);
    };

    traverse(node);
    return leaves;
  },

  /**
   * 根据路径查找节点
   */
  findNodeByPath(root: SkeletonNode, path: string): SkeletonNode | null {
    const parts = path.split(" > ").slice(1); // 移除根节点标签
    let current = root;

    for (const part of parts) {
      const child = current.children?.find((c) => c.label === part);
      if (!child) return null;
      current = child;
    }

    return current;
  },

  /**
   * 获取节点类型对应的图标名称
   */
  getIconForType(type: NodeType): string {
    switch (type) {
      case "root":
        return "Brain";
      case "part":
        return "Layout";
      case "chapter":
        return "Brain";
      case "slot_concept":
        return "Lightbulb";
      case "slot_logic":
        return "Brain";
      case "slot_action":
        return "Zap";
      default:
        return "Circle";
    }
  },

  /**
   * 获取节点类型对应的颜色
   */
  getColorForType(type: NodeType): { bg: string; text: string } {
    switch (type) {
      case "slot_concept":
        return { bg: "bg-amber-500", text: "text-amber-500" };
      case "slot_logic":
        return { bg: "bg-blue-500", text: "text-blue-500" };
      case "slot_action":
        return { bg: "bg-emerald-500", text: "text-emerald-500" };
      default:
        return { bg: "bg-slate-400", text: "text-slate-400" };
    }
  },
};
