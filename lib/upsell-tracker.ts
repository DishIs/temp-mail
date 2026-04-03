import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export type UpsellSource = 
  | "email_box" 
  | "dashboard" 
  | "custom_domain"
  | "api_pricing"
  | "web_pricing"
  | "direct";

const SOURCE_KEY_PREFIX = "upsell:source";
const SOURCE_EXPIRY = 3600 * 24; // 24 hours

export async function setUpsellSource(userId: string, source: UpsellSource): Promise<void> {
  await redis.setex(`${SOURCE_KEY_PREFIX}:${userId}`, SOURCE_EXPIRY, source);
}

export async function getUpsellSource(userId: string): Promise<UpsellSource | null> {
  const source = await redis.get<string>(`${SOURCE_KEY_PREFIX}:${userId}`);
  if (!source) return null;
  
  // Validate it's a known source
  const validSources: UpsellSource[] = [
    "email_box", "dashboard", "custom_domain", 
    "api_pricing", "web_pricing", "direct"
  ];
  return validSources.includes(source as UpsellSource) ? source as UpsellSource : null;
}

export async function clearUpsellSource(userId: string): Promise<void> {
  await redis.del(`${SOURCE_KEY_PREFIX}:${userId}`);
}

export function getUpsellSourceFromUrl(): UpsellSource | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || params.get("source");
  if (!source) return null;
  
  const validSources: UpsellSource[] = [
    "email_box", "dashboard", "custom_domain", 
    "api_pricing", "web_pricing", "direct"
  ];
  return validSources.includes(source as UpsellSource) ? source as UpsellSource : null;
}
