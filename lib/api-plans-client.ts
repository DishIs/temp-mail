// lib/api-plans-client.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Thin client-safe re-export of plan constants.
//  Import from here in Next.js components — avoids pulling in the Express
//  typings that live in v1/api-plans.ts.
// ─────────────────────────────────────────────────────────────────────────────

/** API plans that include custom domain support. */
export const CUSTOM_DOMAIN_PLANS: string[] = ["growth", "enterprise"];

/** API plans that include OTP extraction. */
export const OTP_PLANS: string[] = ["growth", "enterprise"];

/** API plans that include WebSocket access. */
export const WS_PLANS: string[] = ["startup", "growth", "enterprise"];