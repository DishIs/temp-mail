// app/api/auth/[...nextauth]/route.ts

import { handlers } from '@/auth';

// Wrap handlers to surface the actual error instead of the source-map noise
export async function GET(request: Request) {
  try {
    return await handlers.GET(request);
  } catch (e) {
    console.error('[AUTH GET ERROR]', String(e)); // will now show in wrangler logs
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    return await handlers.POST(request);
  } catch (e) {
    console.error('[AUTH POST ERROR]', String(e));
    throw e;
  }
}