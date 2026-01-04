import { ENABLE_REDIS, ATTACHMENT_FIELD_NAME } from "./env";

// 应用常量配置

/** LocalStorage key 前缀 */
export const STORAGE_KEY_PREFIX = "spr_feishu_";

/** 是否启用 Redis（从环境变量读取） */
export { ENABLE_REDIS };

/** 附件字段名称（从环境变量读取） */
export { ATTACHMENT_FIELD_NAME };

export const DEFAULT_NOTE_CATEGORIES = [
  "概念锚点",
  "逻辑原理",
  "行动指令",
  "认知盲区",
] as const;

export const DEFAULT_THEME: "light" | "dark" = "dark";

export const SYNC_DELAY = 500;
