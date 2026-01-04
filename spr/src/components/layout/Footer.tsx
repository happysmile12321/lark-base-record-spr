import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CloudCheck } from 'lucide-react';
import { getBorderClass, getGlassClass, getMutedTextClass } from '../../config/themeConfig';

interface FooterProps {
  isSyncing: boolean;
  lastSyncSuccess: boolean | null;
  theme: 'light' | 'dark';
}

const Footer: React.FC<FooterProps> = ({ isSyncing, lastSyncSuccess, theme }) => {
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const mutedText = getMutedTextClass(theme);

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 px-12 py-6 flex items-center justify-between border-t z-[60] transition-colors duration-500 ${glassClass} ${borderClass}`}
      style={{
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)'
      }}
    >
      <div className="flex items-center gap-10">
        <motion.span
          className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: ['0 0 0 rgba(16, 185, 129, 0)', '0 0 10px rgba(16, 185, 129, 0.5)', '0 0 0 rgba(16, 185, 129, 0)']
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          SYSTEM NOMINAL
        </motion.span>
        <span className={`text-[10px] font-black tracking-[0.15em] uppercase ${mutedText}`}>
          SPR V3.0 COGNITIVE ENGINE
        </span>
      </div>
      <div className="flex items-center gap-6">
        <motion.span
          key={isSyncing ? 'syncing' : 'synced'}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 ${lastSyncSuccess === false ? 'text-rose-500' : 'text-emerald-500'
            }`}
        >
          {isSyncing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-3 h-3" />
              </motion.div>
              同步中
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <CloudCheck className="w-3.5 h-3.5" />
              </motion.div>
              全量同步
            </>
          )}
        </motion.span>
        <span className={`text-[10px] font-black ${mutedText}`}>
          右键点击呼出逻辑环
        </span>
      </div>
    </footer>
  );
};

export default Footer;
