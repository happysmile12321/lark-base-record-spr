import { useState, useCallback, useEffect } from "react";
import { MenuConfig } from "../types";
import { defaultMenuConfig } from "../config/menuConfig";

export function useContextMenu(initialMenuConfig?: MenuConfig) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(
    initialMenuConfig || defaultMenuConfig
  );

  // 当外部传入的 menuConfig 变化时同步
  useEffect(() => {
    if (initialMenuConfig) {
      setMenuConfig(initialMenuConfig);
    }
  }, [initialMenuConfig]);

  // 打开右键菜单
  const openContextMenu = useCallback((x: number, y: number) => {
    setContextMenu({ x, y });
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    menuConfig,
    openContextMenu,
    closeContextMenu,
  };
}
