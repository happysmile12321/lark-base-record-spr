import { useMemo } from 'react';

/**
 * 使用 CSS 变量代替内联样式
 * 返回一个包含 style 属性的对象，但使用 CSS 变量
 */
export function useCSSVar(
  vars: Record<string, string | number | undefined>
): React.CSSProperties {
  const style = useMemo(() => {
    const result: Record<string, string> = {};
    let hasVars = false;

    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined) {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        result[cssVar as keyof typeof result] = String(value);
        hasVars = true;
      }
    });

    return hasVars ? result : {};
  }, [vars]);

  return style;
}

/**
 * 设置单个 CSS 变量
 */
export function setCSSVar(name: string, value: string): void {
  const cssVar = name.startsWith('--') ? name : `--${name}`;
  document.documentElement.style.setProperty(cssVar, value);
}

/**
 * 移除 CSS 变量
 */
export function removeCSSVar(name: string): void {
  const cssVar = name.startsWith('--') ? name : `--${name}`;
  document.documentElement.style.removeProperty(cssVar);
}
