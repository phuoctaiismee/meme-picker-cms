import { Redis } from "@upstash/redis";

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidate(prefix: string): Promise<void>;
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
    async del(key: string) {
      await redis.del(key);
    },
    async invalidate(prefix: string) {
      // For Upstash Redis, we can use SCAN to find keys with prefix
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        cursor = nextCursor;
      } while (cursor !== "0");
    }
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
  async del(key) {
    memoryStore.delete(key);
  },
  async invalidate(prefix) {
    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key);
      }
    }
  }
};

// Auto-select provider based on ENV
const redisProvider = upstashRedis();
if (redisProvider) {
  console.log("[Cache] Using Upstash Redis provider");
} else {
  console.warn("[Cache] UPSTASH_REDIS_REST_URL/TOKEN not found. Falling back to In-memory Cache.");
}

export const cache = redisProvider || memoryCache;
