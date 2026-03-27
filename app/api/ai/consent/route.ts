import { NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing turnstile token' }, { status: 400 });
    }

    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    // Set a secure http-only cookie valid for 1 day
    const cookieStore = await cookies();
    cookieStore.set('fce_ai_verified', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consent API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
