import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { MenuConfig } from '../../types';
import { getBorderClass, getGlassClass, getTextClass, getHoverBgClass } from '../../config/themeConfig';

interface ContextMenuProps {
  x: number;
  y: number;
  menuConfig: MenuConfig;
  theme: 'light' | 'dark';
}

// 获取图标组件
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || null;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  menuConfig,
  theme
}) => {
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const hoverBg = getHoverBgClass(theme);

  // 获取所有可见菜单项
  const allItems = menuConfig.groups.flatMap(group =>
    group.items.filter(item => item.visible !== false)
  );

  // 计算每个项目在圆环上的位置
  const getItemPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI / total) - Math.PI / 2; // 从顶部开始
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const radius = 90; // 圆环半径

  return (
    <motion.div
      className="fixed z-[100]"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 28,
        mass: 0.8
      }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        {/* 液态发光背景 */}
        <motion.div
          className={`absolute inset-0 blur-3xl rounded-full ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
            }`}
          style={{ width: 250, height: 250, left: -125, top: -125 }}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* 中心图标 - 玻璃态容器 */}
        <motion.div
          className={`w-14 h-14 rounded-full flex items-center justify-center pointer-events-none ${glassClass} ${borderClass}`}
          style={{
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
            boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 2px 15px rgba(0, 0, 0, 0.08)'
          }}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 0.9, opacity: 0.6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <BrainCircuit className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        </motion.div>

        {/* 环绕式菜单项 */}
        <AnimatePresence>
          {allItems.map((item, index) => {
            const pos = getItemPosition(index, allItems.length, radius);
            const IconComponent = getIconComponent(item.icon);

            return (
              <motion.button
                key={item.id}
                onClick={item.action}
                className="absolute flex flex-col items-center gap-2 group/btn"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 28,
                  delay: index * 0.04
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
                  {/* 悬停背景 */}
                  <motion.div
                    className={`absolute inset-0 ${hoverBg}`}
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
        </AnimatePresence>

        {/* 连接线装饰 */}
        <svg className="absolute inset-0 pointer-events-none opacity-20" style={{ width: '250px', height: '250px', left: '-125px', top: '-125px' }}>
          <defs>
            <radialGradient id="glow-gradient">
              <stop offset="0%" stopColor={theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="125" cy="125" r="90" fill="none" stroke={theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'} strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="125" cy="125" r="100" fill="url(#glow-gradient)" />
        </svg>
      </div>
    </motion.div>
  );
};

export default ContextMenu;
