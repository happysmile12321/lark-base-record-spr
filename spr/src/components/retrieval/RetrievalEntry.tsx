import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, Sparkles, ChevronRight } from 'lucide-react';

interface RetrievalEntryProps {
  theme: 'light' | 'dark';
  lastStudyTime?: number;
  sessionsCount: number;
  onOpen: () => void;
}

const RetrievalEntry: React.FC<RetrievalEntryProps> = memo(({
  theme,
  lastStudyTime,
  sessionsCount,
  onOpen
}) => {
  // 计算距离上次学习的时间
  const timeSinceStudy = useMemo(() => {
    if (!lastStudyTime) return null;
    const now = Date.now();
    const diff = now - lastStudyTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    return '刚刚';
  }, [lastStudyTime]);

  // 是否建议复习 (超过24小时)
  const shouldReview = useMemo(() => {
    if (!lastStudyTime) return false;
    const hours = (Date.now() - lastStudyTime) / (1000 * 60 * 60);
    return hours >= 24;
  }, [lastStudyTime]);

  return (
    <motion.button
      onClick={onOpen}
      className={`w-full p-4 rounded-2xl border transition-all group ${theme === 'dark'
        ? 'bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border-indigo-500/20 hover:border-indigo-400/40'
        : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200/50 hover:border-indigo-300'
        }`}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        {/* 左侧图标和标题 */}
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark'
              ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
              : 'bg-gradient-to-br from-indigo-500 to-violet-500'
              }`}
            animate={shouldReview ? {
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 0 0 rgba(99, 102, 241, 0)',
                '0 0 20px 5px rgba(99, 102, 241, 0.3)',
                '0 0 0 0 rgba(99, 102, 241, 0)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: shouldReview ? Infinity : 0 }}
          >
            <Brain className="w-6 h-6 text-white" />
          </motion.div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                提取训练
              </h3>
              {shouldReview && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400"
                >
                  建议复习
                </motion.span>
              )}
            </div>
            <div className={`flex items-center gap-3 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              {timeSinceStudy && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  上次: {timeSinceStudy}
                </span>
              )}
              {sessionsCount > 0 && (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  已完成 {sessionsCount} 次
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧箭头 */}
        <motion.div
          className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
            }`}
          whileHover={{ x: 3 }}
        >
          <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`} />
        </motion.div>
      </div>

      {/* 底部进度提示 */}
      {shouldReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-white/10' : 'border-black/10'
            }`}
        >
          <p className={`text-xs ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
            }`}>
            根据艾宾浩斯曲线，现在是最佳复习时机
          </p>
        </motion.div>
      )}
    </motion.button>
  );
});

RetrievalEntry.displayName = 'RetrievalEntry';

export default RetrievalEntry;
