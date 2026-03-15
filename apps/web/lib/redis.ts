import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

const DEDUP_TTL = 300; // 5 minutes

export async function isDuplicate(repo: string, prNumber: number): Promise<boolean> {
  const key = `noctua:processing:${repo}:${prNumber}`;
  const r = getRedis();
  const existing = await r.get(key);
  if (existing) return true;
  await r.set(key, "1", { ex: DEDUP_TTL });
  return false;
}

export async function clearDedup(repo: string, prNumber: number): Promise<void> {
  const key = `noctua:processing:${repo}:${prNumber}`;
  await getRedis().del(key);
}
