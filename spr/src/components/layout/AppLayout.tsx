import React, { ReactNode } from 'react';

interface AppLayoutProps {
  theme: 'light' | 'dark';
  children: ReactNode;
  onContextMenu: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  theme,
  children,
  onContextMenu,
  onClick
}) => {
  const bgClass = theme === 'dark' ? 'app-bg-dark' : 'app-bg-light';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const vignetteClass = theme === 'dark' ? 'vignette-dark' : 'vignette-light';

  return (
    <div
      className={`fixed inset-0 ${textColor} ${bgClass}`}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full w-full fade-in">
        {children}
      </div>

      {/* 全局暗角效果 */}
      <div
        className={`absolute inset-0 pointer-events-none z-20 ${vignetteClass}`}
      />
    </div>
  );
};

export default AppLayout;
