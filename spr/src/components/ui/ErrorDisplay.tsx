import React from 'react';
import { AlertTriangle, RefreshCw, X, Key, Wifi, FileCode, Paperclip } from 'lucide-react';

interface AppError {
  type: 'api_quota' | 'api_key' | 'network' | 'parse' | 'attachment' | 'unknown';
  title: string;
  message: string;
  suggestion: string;
}

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  theme: 'light' | 'dark';
}

const errorIcons = {
  api_quota: Key,
  api_key: Key,
  network: Wifi,
  parse: FileCode,
  attachment: Paperclip,
  unknown: AlertTriangle,
};

const errorColors = {
  api_quota: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
  api_key: 'bg-rose-500/10 border-rose-500/30 text-rose-600',
  network: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  parse: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
  attachment: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  unknown: 'bg-slate-500/10 border-slate-500/30 text-slate-600',
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  theme
}) => {
  const IconComponent = errorIcons[error.type];
  const colorClass = errorColors[error.type];

  return (
    <div className="relative max-w-lg mx-auto rounded-3xl border-2 p-8 pt-12 pb-8">
      {/* 关闭按钮 */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* 图标 */}
      <div className="flex justify-center mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
          <IconComponent className={`w-8 h-8 ${error.type === 'api_quota' ? 'text-amber-500' :
            error.type === 'api_key' ? 'text-rose-500' :
              error.type === 'network' ? 'text-blue-500' :
                error.type === 'parse' ? 'text-purple-500' :
                  error.type === 'attachment' ? 'text-orange-500' :
                    'text-slate-500'
            }`} />
        </div>
      </div>

      {/* 标题 */}
      <h3 className={`text-xl font-black text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
        {error.title}
      </h3>

      {/* 消息 */}
      <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
        {error.message}
      </p>

      {/* 建议 */}
      <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
        }`}>
        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
          <span className="font-bold">💡 建议：</span>{error.suggestion}
        </p>
      </div>

      {/* 操作按钮 */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
