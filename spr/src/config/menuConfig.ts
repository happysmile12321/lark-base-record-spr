import { MenuConfig, MenuItemAction } from "../types";

// 图标名称映射 (Lucide React)
export const ICON_MAP: Record<string, MenuItemAction> = {
  Settings: "openSettings",
  Maximize2: "toggleExpand",
  Sun: "toggleTheme",
  Moon: "toggleTheme",
  RotateCcw: "refresh",
  BookOpen: "toggleMarkdownPanel",
  RefreshCw: "reparse",
  Key: "apiSettings",
};

// 默认菜单配置 - 环绕式单一布局
export const defaultMenuConfig: MenuConfig = {
  groups: [
    {
      id: "radial",
      label: "快捷操作",
      position: "top", // 位置属性保留但不再影响布局
      items: [
        {
          id: "settings",
          label: "分类管理",
          icon: "Settings",
          action: "openSettings",
          visible: true,
        },
        {
          id: "expand",
          label: "展开逻辑",
          icon: "Maximize2",
          action: "toggleExpand",
          visible: true,
        },
        {
          id: "theme",
          label: "主题切换",
          icon: "Sun",
          action: "toggleTheme",
          visible: true,
        },
        {
          id: "markdown",
          label: "预览面板",
          icon: "BookOpen",
          action: "toggleMarkdownPanel",
          visible: true,
        },
        {
          id: "reparse",
          label: "重新解析",
          icon: "RefreshCw",
          action: "reparse",
          visible: true,
        },
        {
          id: "refresh",
          label: "刷新数据",
          icon: "RotateCcw",
          action: "refresh",
          visible: true,
        },
        {
          id: "apiSettings",
          label: "API设置",
          icon: "Key",
          action: "apiSettings",
          visible: true,
        },
      ],
    },
  ],
};
