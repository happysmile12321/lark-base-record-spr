import { useState, useEffect, useRef, useCallback } from "react";
import { analyzeMarkdownWithProvider, createDefaultApiConfig } from "../services/apiProviderService";
import { persistenceManager } from "../services/supabaseService";
import { redisService } from "../services/redisService";
import {
  getCurrentRecordId,
  getMarkdownFromAttachment,
  onSelectionChange,
} from "../services/feishuService";
import { SyncData, MenuConfig, ApiConfig } from "../types";
import {
  DEFAULT_NOTE_CATEGORIES,
  DEFAULT_THEME,
  ENABLE_REDIS,
} from "../config/constants";
import { defaultMenuConfig } from "../config/menuConfig";
import { GEMINI_API_KEY, GEMINI_BASE_URL, SILICONFLOW_API_KEY, SILICONFLOW_BASE_URL, SILICONFLOW_MODEL } from "../config/env";

// 根据配置初始化 Redis
if (!ENABLE_REDIS) {
  console.log("Redis 已禁用，仅使用 LocalStorage");
  redisService.disable();
} else {
  redisService.enable();
}

// 错误类型
interface AppError {
  type: "api_quota" | "api_key" | "network" | "parse" | "attachment" | "unknown";
  title: string;
  message: string;
  suggestion: string;
}

// 解析错误信息
export function parseError(err: any): AppError {
  const message = err?.message || String(err);
  const lowerMessage = message.toLowerCase();

  // 附件问题
  if (
    lowerMessage.includes("附���") ||
    lowerMessage.includes("attachment") ||
    lowerMessage.includes("字段")
  ) {
    return {
      type: "attachment",
      title: "附件读取失败",
      message: "无法从附件字段获取文件",
      suggestion: "请确保当前记录的'附件'字段中有 Markdown 文件",
    };
  }

  // API 配额超限
  if (
    lowerMessage.includes("quota") ||
    lowerMessage.includes("exceeded") ||
    lowerMessage.includes("limit")
  ) {
    return {
      type: "api_quota",
      title: "API 配额已用完",
      message: "免费 Gemini API 配额已达上限",
      suggestion:
        "请稍后重试，或配置自己的 API Key。查看项目文档了解如何配置。",
    };
  }

  // API Key 问题
  if (
    lowerMessage.includes("api key") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("auth")
  ) {
    return {
      type: "api_key",
      title: "API Key 无效",
      message: "无法验证 API 密钥",
      suggestion: "请检查环境变量中的 GEMINI_API_KEY 配置。",
    };
  }

  // 网络问题
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("connection")
  ) {
    return {
      type: "network",
      title: "网络连接失败",
      message: "无法连接到服务器",
      suggestion: "请检查网络连接，稍后重试。",
    };
  }

  // 解析错误
  if (
    lowerMessage.includes("parse") ||
    lowerMessage.includes("json") ||
    lowerMessage.includes("format")
  ) {
    return {
      type: "parse",
      title: "内容解析失败",
      message: "AI 返回的内容格式不正确",
      suggestion: "可能是 Markdown 格式问题，请检查源文档。",
    };
  }

  // 未知错误
  return {
    type: "unknown",
    title: "未知错误",
    message: message.slice(0, 100),
    suggestion: "请重试或联系技术支持。",
  };
}

// 滚动位置的 localStorage key
const SCROLL_POSITION_KEY = "spr_scroll_pos";

export function useAppSync() {
  // 初始化默认 API 配置（默认使用硅基流动）
  const defaultApiConfig: ApiConfig = {
    provider: 'siliconflow',
    geminiApiKey: GEMINI_API_KEY,
    geminiBaseUrl: GEMINI_BASE_URL || undefined, // Gemini 代理地址
    siliconflowApiKey: SILICONFLOW_API_KEY || undefined,
    siliconflowBaseUrl: SILICONFLOW_BASE_URL,
    siliconflowModel: SILICONFLOW_MODEL,
  };

  const [state, setState] = useState<SyncData>({
    markdown: "",
    analysis: null,
    completedSlots: [],
    notes: {},
    noteCategories: [...DEFAULT_NOTE_CATEGORIES],
    theme: DEFAULT_THEME,
    nodeParagraphs: {},
    nodeDrawings: {},
    menuConfig: defaultMenuConfig,
    apiConfig: defaultApiConfig,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [markdownScrollPosition, setMarkdownScrollPosition] = useState(() => {
    const saved = localStorage.getItem(SCROLL_POSITION_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  const isInitializing = useRef(true);
  const scrollSaveTimer = useRef<number | null>(null);

  // 初始化应用（从飞书附件获取 Markdown）
  const init = async () => {
    console.log("=== 开始初始化 ===");
    setIsLoading(true);
    setError(null);

    try {
      // 1. 获取当前记录 ID
      console.log("步骤 1: 获取记录 ID...");
      const recordId = await getCurrentRecordId();
      console.log("当前记录 ID:", recordId);
      setCurrentRecordId(recordId);
      persistenceManager.setRecordId(recordId);

      // 2. 尝试从缓存加载已有数据
      console.log("步骤 2: 尝试从缓存加载...");
      const cachedData = await persistenceManager.fetch(recordId);
      if (cachedData && cachedData.analysis) {
        console.log("使用缓存数据");
        setState({
          ...cachedData,
          theme: cachedData.theme || DEFAULT_THEME,
          noteCategories: cachedData.noteCategories || [...DEFAULT_NOTE_CATEGORIES],
          menuConfig: cachedData.menuConfig || defaultMenuConfig,
        });
        setLastSyncSuccess(true);
        setIsLoading(false);
        isInitializing.current = false;
        return;
      }

      // 3. 从附件���取 Markdown 并解析
      console.log("步骤 3: 从附件获取 Markdown...");
      const markdown = await getMarkdownFromAttachment();
      console.log("Markdown 获取成功，长度:", markdown.length);

      console.log("步骤 4: AI 解析中...");
      const apiConfig = state.apiConfig || defaultApiConfig;
      const analysis = await analyzeMarkdownWithProvider(markdown, apiConfig);
      console.log("AI 解析完成");

      const newState: SyncData = {
        markdown,
        analysis,
        completedSlots: [],
        notes: {},
        noteCategories: [...DEFAULT_NOTE_CATEGORIES],
        theme: DEFAULT_THEME,
        apiConfig,
      };
      setState(newState);

      // 快速保存到缓存
      persistenceManager.saveFast(recordId, newState);
      setLastSyncSuccess(true);
      console.log("=== 初始化完成 ===");
    } catch (err: any) {
      console.error("初始化错误:", err);
      setError(parseError(err));
    } finally {
      setIsLoading(false);
      isInitializing.current = false;
    }
  };

  // 重新解析 - 清空缓存，重新从附件获取
  const reparse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 重新获取 recordId，确保是最新的
      const recordId = await getCurrentRecordId();
      console.log("重新解析 - 记录 ID:", recordId);
      setCurrentRecordId(recordId);
      persistenceManager.setRecordId(recordId);

      // 清空缓存
      persistenceManager.clearAll(recordId);

      // 从附件重新获取 markdown 并解析
      const markdown = await getMarkdownFromAttachment();
      const apiConfig = state.apiConfig || defaultApiConfig;
      const analysis = await analyzeMarkdownWithProvider(markdown, apiConfig);

      // 创建新状态，保留笔记和分类
      const newState: SyncData = {
        ...state,
        markdown,
        analysis,
        completedSlots: [],
      };

      setState(newState);
      setMarkdownScrollPosition(0);
      localStorage.setItem(SCROLL_POSITION_KEY, "0");

      // 快速保存
      persistenceManager.saveFast(recordId, newState);
      setLastSyncSuccess(true);
    } catch (err: any) {
      setError(parseError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新状态
  const updateState = (updates: Partial<SyncData>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // 切换完成状态
  const toggleComplete = (path: string) => {
    setState((prev) => ({
      ...prev,
      completedSlots: prev.completedSlots.includes(path)
        ? prev.completedSlots.filter((p) => p !== path)
        : [...prev.completedSlots, path],
    }));
  };

  // 添加笔记分类
  const addCategory = (category: string) => {
    if (!category.trim() || state.noteCategories.includes(category.trim()))
      return;
    setState((prev) => ({
      ...prev,
      noteCategories: [...prev.noteCategories, category.trim()],
    }));
  };

  // 删除笔记分类
  const removeCategory = (category: string) => {
    setState((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.filter((c) => c !== category),
    }));
  };

  // 更新 Markdown 滚动位置（防抖，只存 localStorage）
  const updateMarkdownScrollPosition = useCallback((position: number) => {
    setMarkdownScrollPosition(position);
    if (scrollSaveTimer.current) {
      clearTimeout(scrollSaveTimer.current);
    }
    scrollSaveTimer.current = window.setTimeout(() => {
      localStorage.setItem(SCROLL_POSITION_KEY, String(position));
    }, 500);
  }, []);

  // 初始化
  useEffect(() => {
    console.log("初始化");
    init();

    // 监听记录切换
    const unsubscribe = onSelectionChange(() => {
      console.log("记录切换，重新初始化");
      init();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 实时数据同步
  useEffect(() => {
    if (isInitializing.current || isLoading || !currentRecordId) return;

    // 立即保存到 LocalStorage 和 Redis
    persistenceManager.saveFast(currentRecordId, state);

    // 延迟同步到 Supabase
    const timer = setTimeout(() => {
      setIsSyncing(true);
      persistenceManager.syncSupabase(currentRecordId, state).then((res) => {
        setLastSyncSuccess(res.success);
        setIsSyncing(false);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    state.analysis,
    state.completedSlots,
    state.notes,
    state.noteCategories,
    state.theme,
    state.nodeParagraphs,
    state.menuConfig,
    state.nodeDrawings,
    state.apiConfig,
    currentRecordId,
  ]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollSaveTimer.current) {
        clearTimeout(scrollSaveTimer.current);
      }
    };
  }, []);

  return {
    state,
    isLoading,
    isSyncing,
    lastSyncSuccess,
    error,
    markdownScrollPosition,
    init,
    reparse,
    updateState,
    toggleComplete,
    addCategory,
    removeCategory,
    updateMarkdownScrollPosition,
    setState,
  };
}
