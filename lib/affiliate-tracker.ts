import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const STATS_KEY_PREFIX = "affiliate:stats";
const USER_AFFILIATE_KEY_PREFIX = "user:affiliate";

// Track a visit asynchronously
export async function trackAffiliateVisit(ref: string): Promise<void> {
  if (!ref) return;
  // Fire and forget increment for visits
  await redis.hincrby(`${STATS_KEY_PREFIX}:${ref}`, "visits", 1);
}

// Associate a user with an affiliate (called during signup/auth)
export async function tagUserWithAffiliate(userId: string, ref: string): Promise<void> {
  if (!userId || !ref) return;
  
  // Set user's affiliate tag (only if they don't have one already to prevent overwriting initial referrer)
  const isSet = await redis.setnx(`${USER_AFFILIATE_KEY_PREFIX}:${userId}`, ref);
  
  // If it was newly set, increment the signups counter
  if (isSet === 1) {
    await redis.hincrby(`${STATS_KEY_PREFIX}:${ref}`, "signups", 1);
  }
}

// Get user's affiliate tag
export async function getUserAffiliate(userId: string): Promise<string | null> {
  if (!userId) return null;
  return redis.get<string>(`${USER_AFFILIATE_KEY_PREFIX}:${userId}`);
}

// Track a purchase
export async function trackAffiliatePurchase(userId: string, amount: number): Promise<void> {
  if (!userId) return;
  
  const ref = await getUserAffiliate(userId);
  if (!ref) return; // Not an affiliate-referred user

  const pipeline = redis.pipeline();
  pipeline.hincrby(`${STATS_KEY_PREFIX}:${ref}`, "purchases", 1);
  pipeline.hincrbyfloat(`${STATS_KEY_PREFIX}:${ref}`, "revenue", amount);
  await pipeline.exec();
}
