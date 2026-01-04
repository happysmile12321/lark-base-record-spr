import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Diamond,
  Eraser,
} from "lucide-react";

// 工具类型
export type Tool =
  | "select"
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "diamond"
  | "eraser";

// 编辑器模式
export type EditorMode = "flowchart" | "draw" | "text";

// 图形元素接口
export interface DrawingElement {
  id: string;
  type:
    | "stroke"
    | "rectangle"
    | "circle"
    | "line"
    | "arrow"
    | "diamond"
    | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  points?: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  text?: string;
  fontSize?: number;
}

// 工具配置
export const DRAWING_TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "选择" },
  { id: "pen", icon: Pencil, label: "画笔" },
  { id: "rectangle", icon: Square, label: "矩形" },
  { id: "diamond", icon: Diamond, label: "菱形" },
  { id: "circle", icon: Circle, label: "圆形" },
  { id: "line", icon: Minus, label: "直线" },
  { id: "arrow", icon: ArrowRight, label: "箭头" },
  { id: "eraser", icon: Eraser, label: "橡皮擦" },
];

// 流程图工具
export const FLOWCHART_TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "选择" },
  { id: "rectangle", icon: Square, label: "过程" },
  { id: "diamond", icon: Diamond, label: "判断" },
  { id: "circle", icon: Circle, label: "起止" },
  { id: "arrow", icon: ArrowRight, label: "连接" },
];

// 颜色列表
export const COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

// 便签颜色
export const NOTE_COLORS = [
  { color: "#fef3c7", border: "#fcd34d", name: "黄色" },
  { color: "#fce7f3", border: "#f9a8d4", name: "粉色" },
  { color: "#dbeafe", border: "#93c5fd", name: "蓝色" },
  { color: "#dcfce7", border: "#86efac", name: "绿色" },
  { color: "#f3e8ff", border: "#c4b5fd", name: "紫色" },
  { color: "#ffedd5", border: "#fdba74", name: "橙色" },
];

// 线宽列表
export const LINE_WIDTHS = [1, 2, 4, 6, 8];

// 获取鼠标位置
export const getMousePos = (
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null
) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

// 点到线段距离
export const pointToLineDistance = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(px - xx, py - yy);
};
