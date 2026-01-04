import React from 'react';
import { motion } from 'framer-motion';
import { getBorderClass, getMutedTextClass } from '../../config/themeConfig';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  theme: 'light' | 'dark';
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 36,
  strokeWidth = 3,
  theme
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const borderClass = getBorderClass(theme);
  const mutedText = getMutedTextClass(theme);

  // 动态颜色根据完成度
  const getProgressColor = () => {
    if (percentage >= 100) return theme === 'dark' ? '#10b981' : '#059669';
    if (percentage >= 75) return theme === 'dark' ? '#6366f1' : '#4f46e5';
    if (percentage >= 50) return theme === 'dark' ? '#8b5cf6' : '#7c3aed';
    return theme === 'dark' ? '#3b82f6' : '#2563eb';
  };

  const progressColor = getProgressColor();

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        className="transform -rotate-90"
        initial={{ rotate: -90 }}
        animate={{ rotate: -90 }}
      >
        {/* 背景圆环 - 玻璃态 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 进度圆环 - 液态效果 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 ${percentage >= 100 ? 8 : 4}px ${progressColor}40)`
          }}
        />
      </motion.svg>
      <motion.span
        key={percentage}
        className={`absolute text-[8px] font-black tabular-nums ${mutedText}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {percentage}%
      </motion.span>

      {/* 完成时的发光效果 */}
      {percentage >= 100 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${progressColor}20 0%, transparent 70%)`
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
};

export default ProgressRing;
