/**
 * AquaLiquid 风格主题配置
 * 基于 Apple 设计语言的液态 UI 主题系统
 */

export interface ThemeColors {
  background: string;
  text: string;
  glass: string;
  border: string;
  colors: string[]; // [primary, secondary, accent, highlight]
}

export interface ThemeConfig {
  dark: ThemeColors;
  light: ThemeColors;
}

export const THEMES: ThemeConfig = {
  dark: {
    background: '#010101',
    text: '#ffffff',
    glass: 'bg-white/[0.03]',
    border: 'border-white/[0.08]',
    colors: ['#3b82f6', '#60a5fa', '#ffffff', '#0ea5e9'] // zen theme colors
  },
  light: {
    background: '#fafafa',
    text: '#1a1a1a',
    glass: 'bg-black/[0.03]',
    border: 'border-black/[0.08]',
    colors: ['#3b82f6', '#60a5fa', '#1a1a1a', '#0ea5e9']
  }
};

// 主题预设（用于切换不同的视觉风格）
export const THEME_PRESETS = {
  zen: ['#3b82f6', '#60a5fa', '#ffffff', '#0ea5e9'],      // 蓝色禅意
  flow: ['#8b5cf6', '#a78bfa', '#ffffff', '#c084fc'],     // 紫色流动
  deep: ['#1e293b', '#334155', '#475569', '#64748b'],     // 深邃灰蓝
  vital: ['#ef4444', '#f87171', '#ffffff', '#fb7185'],    // 活力红
  forest: ['#10b981', '#34d399', '#ffffff', '#059669'],   // 森林绿
  ocean: ['#06b6d4', '#22d3ee', '#ffffff', '#0891b2'],    // 海洋青
} as const;

export type ThemePreset = keyof typeof THEME_PRESETS;

/**
 * 获取主题颜色配置
 */
export function getThemeColors(theme: 'light' | 'dark', preset: ThemePreset = 'zen'): ThemeColors {
  const base = THEMES[theme];
  return {
    ...base,
    colors: [...THEME_PRESETS[preset]] as string[]
  };
}

/**
 * 根据主题获取合适的文字颜色类
 */
export function getTextClass(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'text-white' : 'text-slate-900';
}

/**
 * 根据主题获取玻璃态背景类
 */
export function getGlassClass(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.03]';
}

/**
 * 根据主题获取边框类
 */
export function getBorderClass(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]';
}

/**
 * 获取背景颜色
 */
export function getBackgroundColor(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? '#010101' : '#fafafa';
}

/**
 * 获取辅助文字颜色类（用于说明文字）
 */
export function getMutedTextClass(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'text-white/40' : 'text-black/40';
}

/**
 * 获取悬停背景类（用于交互元素悬停状态）
 */
export function getHoverBgClass(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'bg-white/[0.08]' : 'bg-black/[0.08]';
}
