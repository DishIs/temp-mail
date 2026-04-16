import { NextRequest, NextResponse } from "next/server";
import { trackAffiliateVisit } from "@/lib/affiliate-tracker";

export async function POST(request: NextRequest) {
  try {
    const { ref } = await request.json();
    
    if (!ref || typeof ref !== 'string') {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Process asynchronously (fire & forget) to not block the response
    // Using waitUntil if running on Vercel/Edge or just promise void in Node
    const trackingPromise = trackAffiliateVisit(ref).catch(console.error);
    
    // Some platforms (like Cloudflare/Vercel Edge) support executionContext.waitUntil
    // For standard Next.js Node runtime, just not awaiting the promise is usually enough
    // for a fire-and-forget, though the process could terminate. Next.js App Router 
    // does not expose `waitUntil` directly in standard route handlers unless in Edge.
    // To ensure fast response, we return immediately.
    
    const response = NextResponse.json({ success: true });
    
    // Set an HTTP-only cookie to remember the affiliate for 30 days
    // This allows us to track signups later even if they drop the query param
    response.cookies.set({
      name: 'affiliate_ref',
      value: ref,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error("Error in affiliate track-visit:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
