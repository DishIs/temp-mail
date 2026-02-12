// app/api/revalidate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// small helper – HMAC SHA256 using Web Crypto (CF friendly)
async function verifySignature(
  body: string,
  signature: string,
  secret: string
) {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(body)
  );

  // convert ArrayBuffer → hex
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // timing-safe compare (manual, CF style)
  if (expected.length !== signature.length) return false;

  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return result === 0;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-DITBlogs-Signature');
    if (!signature) {
      return NextResponse.json(
        { message: 'Signature header is missing.' },
        { status: 401 }
      );
    }

    const body = await request.text();

    const isValid = await verifySignature(
      body,
      signature,
      process.env.DITBLOGS_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid signature.' },
        { status: 401 }
      );
    }

    // safe to parse after verification
    const data = JSON.parse(body);
    const eventType = data.event;
    const postSlug = data.payload?.post?.slug;

    // ---- your existing logic (unchanged) ----
    if (eventType === 'post.published' || eventType === 'post.unpublished') {
      if (!postSlug) {
        return NextResponse.json(
          { message: 'Post slug is required for this event.' },
          { status: 400 }
        );
      }

      const pathsToRevalidate = [
        '/blog',
        `/blog/${postSlug}`,
      ];

      pathsToRevalidate.forEach(path => revalidatePath(path));

      return NextResponse.json({
        revalidated: true,
        revalidatedPaths: pathsToRevalidate,
        now: Date.now(),
      });
    }

    return NextResponse.json(
      { message: 'Event type not handled.' },
      { status: 200 }
    );

  } catch (err) {
    console.error("Revalidate error:", err);
    return NextResponse.json(
      { message: 'Error processing request.' },
      { status: 500 }
    );
  }
}
