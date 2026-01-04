import { SyncData } from "../types";
import {
  REDIS_REST_URL,
  REDIS_PASSWORD,
} from "../config/env";

class RedisService {
  private static instance: RedisService;
  private isConnected: boolean = false;
  private useRedis: boolean = true; // 可以禁用 Redis 回退到仅 LocalStorage

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * 测试连接（异步）
   */
  public async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${REDIS_REST_URL}/ping`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${REDIS_PASSWORD}`,
        },
      });
      this.isConnected = response.ok;
      return response.ok;
    } catch (error) {
      console.error("Redis ping failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 保存数据到 Redis
   */
  public async save(key: string, data: SyncData): Promise<boolean> {
    if (!this.useRedis) return false;

    try {
      const response = await fetch(
        `${REDIS_REST_URL}/set/${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${REDIS_PASSWORD}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Redis save error:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 从 Redis 获取数据
   */
  public async get(key: string): Promise<SyncData | null> {
    if (!this.useRedis) return null;

    try {
      const response = await fetch(
        `${REDIS_REST_URL}/get/${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${REDIS_PASSWORD}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.result) {
          this.isConnected = true;
          return JSON.parse(data.result);
        }
      }
      return null;
    } catch (error) {
      console.error("Redis get error:", error);
      this.isConnected = false;
      return null;
    }
  }

  /**
   * 删除 Redis 中的数据
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.useRedis) return false;

    try {
      const response = await fetch(
        `${REDIS_REST_URL}/del/${encodeURIComponent(key)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${REDIS_PASSWORD}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Redis delete error:", error);
      return false;
    }
  }

  /**
   * 检查连接状态
   */
  public isReady(): boolean {
    return this.isConnected;
  }

  /**
   * 禁用 Redis（回退模式）
   */
  public disable(): void {
    this.useRedis = false;
  }

  /**
   * 启用 Redis
   */
  public enable(): void {
    this.useRedis = true;
  }
}

// 导出单例
export const redisService = RedisService.getInstance();
