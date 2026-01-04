import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { MenuPosition } from '../../types';
import { getBorderClass, getGlassClass, getTextClass, getHoverBgClass } from '../../config/themeConfig';

interface MenuGroupProps {
  label: string;
  items: Array<{
    id: string;
    label: string;
    icon: string;
    action: () => void;
    visible?: boolean;
  }>;
  position: MenuPosition;
  theme: 'light' | 'dark';
}

// 获取图标组件
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || null;
};

// 根据位置计算样式
const getPositionStyles = (position: MenuPosition) => {
  switch (position) {
    case 'top':
      return '-top-24 left-1/2 -translate-x-1/2';
    case 'bottom':
      return '-bottom-24 left-1/2 -translate-x-1/2';
    case 'left':
      return 'top-1/2 -left-24 -translate-y-1/2';
    case 'right':
      return 'top-1/2 -right-24 -translate-y-1/2';
    default:
      return '';
  }
};

const MenuGroup: React.FC<MenuGroupProps> = ({
  label,
  items,
  position,
  theme
}) => {
  // 过滤可见的菜单项
  const visibleItems = items.filter(item => item.visible !== false);

  if (visibleItems.length === 0) return null;

  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const hoverBg = getHoverBgClass(theme);

  // 根据位置确定布局方向
  const isVertical = position === 'top' || position === 'bottom';

  return (
    <div className={`absolute ${getPositionStyles(position)} flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-3`}>
      {visibleItems.map((item, index) => {
        const IconComponent = getIconComponent(item.icon);
        return (
          <motion.button
            key={item.id}
            onClick={item.action}
            className="flex flex-col items-center gap-2 group/btn relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
              delay: index * 0.03
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 液态按钮容器 */}
            <motion.div
              className={`p-4 rounded-full border relative overflow-hidden ${glassClass} ${borderClass}`}
              style={{
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                boxShadow: theme === 'dark' ? '0 2px 12px rgba(0, 0, 0, 0.3)' : '0 1px 8px rgba(0, 0, 0, 0.06)'
              }}
              whileHover={{
                boxShadow: theme === 'dark'
                  ? '0 0 30px rgba(99, 102, 241, 0.4)'
                  : '0 0 30px rgba(99, 102, 241, 0.3)'
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* 悬停背景 - 液态扩散效果 */}
              <motion.div
                className={`absolute inset-0 ${hoverBg} ui-gooey-layer`}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />

              {/* 图标 */}
              {IconComponent && (
                <span className={`relative z-10 ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'} group-hover/btn:text-indigo-500 transition-colors`}>
                  <IconComponent className="w-5 h-5" />
                </span>
              )}

              {/* 光泽层 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            </motion.div>

            {/* 标签文本 */}
            <motion.span
              className={`text-[8px] font-black uppercase tracking-widest ${textColor} opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap`}
              initial={{ y: 5 }}
              whileHover={{ y: 0 }}
            >
              {item.label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default MenuGroup;
