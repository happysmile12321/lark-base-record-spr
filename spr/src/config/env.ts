/**
 * 环境变量配置
 *
 * 所有敏感配置都从 .env 文件读取，不提供默认值以防信息泄露
 */

// 获取环境变量的辅助函数
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置，请检查 .env 文件`);
  }
  return value;
}

function getEnvWithDefault(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function getEnvBoolean(key: string, fallback: boolean = false): boolean {
  const value = process.env[key];
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

// ================================
// Gemini AI 配置 (必需)
// ================================
export const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY');

// ================================
// Supabase 配置
// ================================
export const SUPABASE_URL = getEnvWithDefault('VITE_SUPABASE_URL', '');
export const SUPABASE_API_KEY = getEnvWithDefault('VITE_SUPABASE_API_KEY', '');
export const SUPABASE_TABLE_NAME = getEnvWithDefault('VITE_SUPABASE_TABLE_NAME', 'blocks_sync');

// ================================
// Redis 配置
// ================================
export const REDIS_REST_URL = getEnvWithDefault('VITE_REDIS_REST_URL', '');
export const REDIS_PASSWORD = getEnvWithDefault('VITE_REDIS_PASSWORD', '');

// ================================
// 功能开关
// ================================
export const ENABLE_REDIS = getEnvBoolean('VITE_ENABLE_REDIS', false);

// ================================
// 飞书插件配置
// ================================
export const ATTACHMENT_FIELD_NAME = getEnvWithDefault('VITE_ATTACHMENT_FIELD_NAME', '附件');
