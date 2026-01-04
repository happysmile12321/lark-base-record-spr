import { SyncData } from "../types";
import { redisService } from "./redisService";
import { STORAGE_KEY_PREFIX } from "../config/constants";
import {
  SUPABASE_URL,
  SUPABASE_API_KEY,
  SUPABASE_TABLE_NAME,
} from "../config/env";

const TABLE_NAME = SUPABASE_TABLE_NAME;

/**
 * 持久化管理器
 *
 * - Redis: 快速实时备份（不阻塞）
 * - Supabase: 异步云端备份（后台进行）
 * - LocalStorage: 本地缓存
 *
 * 飞书插件：使用 recordId 作为 key
 */
class PersistenceManager {
  private static instance: PersistenceManager;
  private isSyncing: Set<string> = new Set();
  private currentRecordId: string | null = null;

  private constructor() {}

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  /**
   * 设置当前记录 ID
   */
  public setRecordId(recordId: string): void {
    this.currentRecordId = recordId;
  }

  // ========== LocalStorage ==========

  public saveLocal(key: string, data: SyncData): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }
  }

  public loadLocal(key: string): SyncData | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("LocalStorage load error:", e);
      return null;
    }
  }

  public clearLocal(key: string): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  }

  // ========== Redis (快速实时备份) ==========

  public saveRedis(key: string, data: SyncData): void {
    redisService.save(key, data).catch(() => {
      // Redis 失败不影响使用
    });
  }

  public async fetchRedis(key: string): Promise<SyncData | null> {
    return redisService.get(key);
  }

  public deleteRedis(key: string): void {
    redisService.delete(key).catch(() => {});
  }

  // ========== Supabase (异步云端备份) ==========

  public async fetchSupabase(key: string): Promise<SyncData | null> {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?key=eq.${key}&select=data`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) return null;
      const results = await response.json();
      return results.length > 0 ? results[0].data : null;
    } catch (error) {
      console.error("Supabase fetch error:", error);
      return null;
    }
  }

  public syncSupabase(
    key: string,
    data: SyncData
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing.has(key)) {
      return Promise.resolve({ success: true });
    }

    this.isSyncing.add(key);

    return this._doSupabaseSync(key, data).finally(() => {
      this.isSyncing.delete(key);
    });
  }

  private async _doSupabaseSync(
    key: string,
    data: SyncData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=key`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          id: key,
          key: key,
          data: data,
          updated_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }
    } catch (error) {
      return { success: false, error: "Network synchronization interrupted." };
    }
  }

  // ========== 统一接口 ==========

  public saveFast(key: string, data: SyncData): void {
    this.saveLocal(key, data);
    this.saveRedis(key, data);
  }

  public async fetch(key: string): Promise<SyncData | null> {
    // 1. 先尝试 LocalStorage（最快）
    const localData = this.loadLocal(key);
    if (localData) {
      console.log("从 LocalStorage 加载数据");
      return localData;
    }

    // 2. 尝试 Redis
    const redisData = await this.fetchRedis(key);
    if (redisData) {
      console.log("从 Redis 加载数据");
      this.saveLocal(key, redisData);
      return redisData;
    }

    // 3. 最后尝试 Supabase
    const supabaseData = await this.fetchSupabase(key);
    if (supabaseData) {
      console.log("从 Supabase 加载数据");
      this.saveLocal(key, supabaseData);
      this.saveRedis(key, supabaseData);
    }

    return supabaseData;
  }

  public clearAll(key: string): void {
    this.clearLocal(key);
    this.deleteRedis(key);
  }
}

export const persistenceManager = PersistenceManager.getInstance();
