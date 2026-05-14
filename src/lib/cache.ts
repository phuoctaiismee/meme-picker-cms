import { Redis } from "@upstash/redis";

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

// 1. Upstash Redis Implementation
const upstashRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const redis = new Redis({
    url,
    token,
  });

  return {
    async get<T>(key: string) {
      return await redis.get<T>(key);
    },
    async set<T>(key: string, value: T, ttlSeconds = 86400) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
  } as CacheProvider;
};

// 2. In-memory Fallback
const memoryStore = new Map<string, { value: any; expiry: number }>();
const memoryCache: CacheProvider = {
  async get(key) {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  async set(key, value, ttlSeconds = 3600) {
    memoryStore.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  },
};

// Auto-select provider based on ENV
const redisProvider = upstashRedis();
if (redisProvider) {
  console.log("[Cache] Using Upstash Redis provider");
} else {
  console.warn("[Cache] UPSTASH_REDIS_REST_URL/TOKEN not found. Falling back to In-memory Cache.");
}

export const cache = redisProvider || memoryCache;
