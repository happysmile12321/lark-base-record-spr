import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react';
import { getBorderClass, getGlassClass, getTextClass, getMutedTextClass } from '../../config/themeConfig';

interface PomodoroTimerProps {
  onComplete: () => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onComplete,
  onClose,
  theme
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-3 rounded-2xl p-5 border transition-all ${glassClass} ${borderClass}`}
      style={{ boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${mutedText}`}>
          认知专注引擎
        </span>
        <motion.button
          onClick={onClose}
          className={`p-1.5 rounded-full transition-colors ${mutedText} hover:text-rose-500`}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div className="text-center space-y-3">
        <div className={`text-4xl font-black tabular-nums tracking-tighter ${textColor}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="flex justify-center gap-3">
          <motion.button
            onClick={() => setIsActive(!isActive)}
            className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center transition-transform"
            style={{ boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>
          <motion.button
            onClick={() => setTimeLeft(25 * 60)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${glassClass} ${borderClass} ${mutedText}`}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;
