import React, { useState, useEffect } from 'react';
import { X, Key, Check, Eye, EyeOff } from 'lucide-react';
import { ApiConfig, ApiProvider } from '../../types';
import {
  getBorderClass,
  getGlassClass,
  getTextClass,
  getMutedTextClass,
} from '../../config/themeConfig';

interface ApiSettingsModalProps {
  isOpen: boolean;
  apiConfig: ApiConfig | undefined;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const PROVIDER_OPTIONS: { value: ApiProvider; label: string; description: string }[] = [
  {
    value: 'gemini',
    label: 'Google Gemini',
    description: 'Google 的 AI 模型，支持结构化输出',
  },
  {
    value: 'siliconflow',
    label: '硅基流动',
    description: '国内 API，支持 DeepSeek 等模型',
  },
];

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  apiConfig,
  onSave,
  onClose,
  theme,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiBaseUrl, setGeminiBaseUrl] = useState('');
  const [siliconflowKey, setSiliconflowKey] = useState('');
  const [siliconflowBaseUrl, setSiliconflowBaseUrl] = useState('https://api.siliconflow.cn');
  const [siliconflowModel, setSiliconflowModel] = useState('deepseek-ai/DeepSeek-V3');
  const [showKeys, setShowKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 当配置变化时更新表单
  useEffect(() => {
    if (apiConfig) {
      setSelectedProvider(apiConfig.provider);
      setGeminiKey(apiConfig.geminiApiKey || '');
      setGeminiBaseUrl(apiConfig.geminiBaseUrl || '');
      setSiliconflowKey(apiConfig.siliconflowApiKey || '');
      setSiliconflowBaseUrl(apiConfig.siliconflowBaseUrl || 'https://api.siliconflow.cn');
      setSiliconflowModel(apiConfig.siliconflowModel || 'deepseek-ai/DeepSeek-V3');
    }
  }, [apiConfig]);

  if (!isOpen) return null;

  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);

  const handleSave = () => {
    const config: ApiConfig = {
      provider: selectedProvider,
      geminiApiKey: geminiKey || undefined,
      geminiBaseUrl: geminiBaseUrl || undefined,
      siliconflowApiKey: siliconflowKey || undefined,
      siliconflowBaseUrl: siliconflowBaseUrl || undefined,
      siliconflowModel: siliconflowModel || undefined,
    };

    setIsSaving(true);
    setTimeout(() => {
      onSave(config);
      setIsSaving(false);
      onClose();
    }, 300);
  };

  const isValid = () => {
    if (selectedProvider === 'gemini') {
      return geminiKey.trim().length > 0;
    }
    return siliconflowKey.trim().length > 0;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 modal-overlay">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 modal-backdrop"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
        }}
        onClick={onClose}
      />

      {/* 弹框内容 */}
      <div
        className={`relative w-full max-w-lg overflow-hidden ${glassClass} ${borderClass} modal-content`}
        style={{
          borderRadius: '2rem',
          boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 内容区域 */}
        <div className="relative z-10 p-8">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${glassClass} ${borderClass}`}
              >
                <Key className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${textColor}`}>API 设置</h3>
                <p className={`text-xs ${mutedText}`}>配置 AI 服务提供商</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${glassClass} ${borderClass} ${mutedText} hover:text-rose-500 transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* API 提供商选择 */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${textColor} mb-3`}>
              选择 API 提供商
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedProvider(option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedProvider === option.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : `${borderClass} ${glassClass}`
                  }`}
                >
                  <div className={`font-medium ${textColor}`}>{option.label}</div>
                  <div className={`text-xs mt-1 ${mutedText}`}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini 配置 */}
          {selectedProvider === 'gemini' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  API Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="输入 Gemini API Key"
                    className={`w-full rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      className={`p-2 rounded-lg ${glassClass} ${mutedText} hover:text-white transition-colors`}
                    >
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className={`text-xs mt-1.5 ${mutedText}`}>
                  获取地址：
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline ml-1"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  代理地址（可选）
                </label>
                <input
                  type="text"
                  value={geminiBaseUrl}
                  onChange={(e) => setGeminiBaseUrl(e.target.value)}
                  placeholder="例如：https://proxy-gemini.example.com"
                  className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                />
              </div>
            </div>
          )}

          {/* 硅基流动配置 */}
          {selectedProvider === 'siliconflow' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  API Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={siliconflowKey}
                    onChange={(e) => setSiliconflowKey(e.target.value)}
                    placeholder="输入硅基流动 API Key"
                    className={`w-full rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      className={`p-2 rounded-lg ${glassClass} ${mutedText} hover:text-white transition-colors`}
                    >
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className={`text-xs mt-1.5 ${mutedText}`}>
                  获取地址：
                  <a
                    href="https://cloud.siliconflow.cn/account/ak"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline ml-1"
                  >
                    cloud.siliconflow.cn
                  </a>
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  API 地址
                </label>
                <input
                  type="text"
                  value={siliconflowBaseUrl}
                  onChange={(e) => setSiliconflowBaseUrl(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  模型
                </label>
                <input
                  type="text"
                  value={siliconflowModel}
                  onChange={(e) => setSiliconflowModel(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                />
                <p className={`text-xs mt-1.5 ${mutedText}`}>
                  常用模型：deepseek-ai/DeepSeek-V3、Qwen/Qwen2.5-72B-Instruct
                </p>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${glassClass} ${borderClass} ${textColor} hover:bg-white/5 disabled:opacity-50`}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid() || isSaving}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-500 text-white hover:bg-indigo-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  保存配置
                </>
              )}
            </button>
          </div>

          {/* 提示 */}
          <p className={`text-xs text-center mt-4 ${mutedText}`}>
            配置将安全保存在本地，仅用于文档解析
          </p>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          animation: fadeIn 0.15s ease-out;
        }
        .modal-content {
          animation: slideUp 0.2s ease-out;
        }
        .modal-backdrop {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ApiSettingsModal;
