/**
 * 环境变量配置
 *
 * 所有敏感配置都从 .env 文件读取，不提供默认值以防信息泄露
 */

// ================================
// Gemini AI 配置 (必需)
// ================================
export const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
export const GEMINI_BASE_URL = process.env.VITE_GEMINI_BASE_URL || '';

if (!GEMINI_API_KEY) {
  throw new Error('环境变量 VITE_GEMINI_API_KEY 未设置，请检查 .env 文件');
}

// ================================
// Supabase 配置
// ================================
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
export const SUPABASE_API_KEY = process.env.VITE_SUPABASE_API_KEY || '';
export const SUPABASE_TABLE_NAME = process.env.VITE_SUPABASE_TABLE_NAME || 'blocks_sync';

// ================================
// Redis 配置
// ================================
export const REDIS_REST_URL = process.env.VITE_REDIS_REST_URL || '';
export const REDIS_PASSWORD = process.env.VITE_REDIS_PASSWORD || '';

// ================================
// 功能开关
// ================================
export const ENABLE_REDIS = process.env.VITE_ENABLE_REDIS === 'true';

// ================================
// 飞书插件配置
// ================================
export const ATTACHMENT_FIELD_NAME = process.env.VITE_ATTACHMENT_FIELD_NAME || '附件';
