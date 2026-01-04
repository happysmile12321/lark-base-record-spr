/**
 * CSP 安全的样式工具
 * 动态将样式添加到 head 中，避免使用内联 style 属性
 */

const styleCache = new Map<string, HTMLStyleElement>();

/**
 * 获取或创建一个动态样式类
 * @param id 唯一标识
 * @param styles CSS 规则对象
 * @returns className
 */
export function getDynamicClass(id: string, styles: Record<string, string>): string {
  const className = `csp-dynamic-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  if (styleCache.has(className)) {
    return className;
  }

  // 生成 CSS 规则
  const cssRules = Object.entries(styles)
    .map(([selector, properties]) => {
      const props = Object.entries(properties)
        .map(([key, value]) => `${kebabCase(key)}: ${value}`)
        .join('; ');
      return `.${className} ${selector} { ${props} }`;
    })
    .join('\n');

  // 创建 style 元素
  const styleEl = document.createElement('style');
  styleEl.textContent = cssRules;
  styleEl.dataset.id = className;
  document.head.appendChild(styleEl);

  styleCache.set(className, styleEl);

  return className;
}

/**
 * 清除所有动态样式
 */
export function clearDynamicStyles(): void {
  styleCache.forEach((el) => {
    el.remove();
  });
  styleCache.clear();
}

/**
 * 驼峰转 kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 设置 CSS 变量
 */
export function setCSSVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value);
}

/**
 * 获取 CSS 变量
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
