import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    client.on("error", () => {
      /* swallow */
    });
    return client;
  } catch {
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 60): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, "EX", ttlSeconds);
  } catch {
    /* ignore */
  }
}
