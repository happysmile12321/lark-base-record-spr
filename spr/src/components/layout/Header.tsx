import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface HeaderProps {
  title: string;
  percentage: number;
  theme: 'light' | 'dark';
}

/**
 * 液态风格头部组件
 * 使用玻璃态效果和极简设计
 */
const Header: React.FC<HeaderProps> = ({ title, percentage, theme }) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const mutedText = theme === 'dark' ? 'text-white/30' : 'text-black/30';
  const glassBg = theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.03]';
  const borderClass = theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]';
  const accentColor = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <header className={`px-10 py-6 border-b flex justify-between items-center ${glassBg} ${borderClass}`}>
      {/* 左侧：标题区域 */}
      <div className="flex items-center gap-4">
        {/* Logo 图标 - 玻璃态容器 */}
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <BrainCircuit className={`w-5 h-5 ${accentColor}`} />
          {/* 光泽层 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </motion.div>

        <div>
          <h2 className={`text-[8px] font-black uppercase tracking-[0.4em] mb-1.5 ${mutedText}`}>
            SPR COGNITIVE ENGINE
          </h2>
          <motion.p
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl font-extralight tracking-tighter ${textColor} blur-[0.3px]`}
          >
            {title || 'COGNITIVE CORE OFFLINE'}
          </motion.p>
        </div>
      </div>

      {/* 右侧：进度显示 */}
      <div className="text-right">
        <motion.div
          key={percentage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`text-5xl font-extralight tracking-tighter tabular-nums leading-none ${textColor}`}
        >
          {percentage}
          <span className="text-2xl">%</span>
        </motion.div>
        <p className={`text-[8px] font-black uppercase tracking-[0.4em] mt-1 ${mutedText}`}>
          Completion Progress
        </p>
      </div>
    </header>
  );
};

export default Header;
