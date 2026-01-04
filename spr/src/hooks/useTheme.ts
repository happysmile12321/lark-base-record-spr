import { useEffect } from 'react';

export function useTheme(
  theme: 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => void
) {
  // 应用主题到 document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
}
