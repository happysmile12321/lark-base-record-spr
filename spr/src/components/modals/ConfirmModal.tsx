import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { getBorderClass, getGlassClass, getTextClass, getMutedTextClass } from '../../config/themeConfig';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'light' | 'dark';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  theme,
  isLoading = false
}) => {
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* 背景遮罩 - 液态模糊 */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
          />

          {/* 弹框内容 - 玻璃态容器 */}
          <motion.div
            className={`relative w-full max-w-md overflow-hidden ${glassClass} ${borderClass}`}
            style={{
              borderRadius: '3rem',
              backdropFilter: 'blur(60px)',
              WebkitBackdropFilter: 'blur(60px)',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
              mass: 0.8
            }}
          >
            {/* 液态光泽层 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* 内容区域 */}
            <div className="relative z-10 p-10">
              {/* 关闭按钮 */}
              <motion.button
                onClick={onCancel}
                disabled={isLoading}
                className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center ${glassClass} ${borderClass} ${mutedText} hover:text-rose-500 transition-colors disabled:opacity-50`}
                style={{ backdropFilter: 'blur(30px)' }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* 图标 - 液态发光效果 */}
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <motion.div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    boxShadow: theme === 'dark'
                      ? ['0 0 20px rgba(245, 158, 11, 0.2)', '0 0 40px rgba(245, 158, 11, 0.4)', '0 0 20px rgba(245, 158, 11, 0.2)']
                      : ['0 0 20px rgba(245, 158, 11, 0.15)', '0 0 30px rgba(245, 158, 11, 0.3)', '0 0 20px rgba(245, 158, 11, 0.15)']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <AlertTriangle className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`} />
                </motion.div>
              </motion.div>

              {/* 标题 */}
              <motion.h3
                className={`text-2xl font-extralight tracking-tighter text-center mb-4 ${textColor}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {title}
              </motion.h3>

              {/* 消息 */}
              <motion.p
                className={`text-center text-sm mb-8 leading-relaxed ${mutedText}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {message}
              </motion.p>

              {/* 按钮 */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <motion.button
                  onClick={onCancel}
                  disabled={isLoading}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all disabled:opacity-50 ${glassClass} ${borderClass} ${textColor}`}
                  style={{ backdropFilter: 'blur(30px)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isLoading ? (
                    <>
                      <motion.span
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      处理中...
                    </>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
