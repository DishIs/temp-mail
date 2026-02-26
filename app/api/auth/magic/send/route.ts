// app/api/auth/magic/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { transporter } from '@/lib/mailer';
import { randomBytes } from 'crypto';

const TOKEN_TTL = 600;

function getMagicLinkHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to FreeCustom.Email</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e5e5e5;border-radius:8px;">

          <!-- Logo -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
              <img src="https://www.freecustom.email/favicon.ico" width="24" height="24" alt="" style="vertical-align:middle;margin-right:8px;">
              <span style="font-size:14px;font-weight:600;color:#111;vertical-align:middle;">FreeCustom.Email</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111;">Sign in link</p>
              <p style="margin:0 0 32px;font-size:14px;color:#666;line-height:1.6;">
                Click the button below to sign in to your account. This link expires in 10 minutes and can only be used once.
              </p>
              <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:11px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Sign in</a>
              <p style="margin:32px 0 0;font-size:12px;color:#999;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.<br>
                Or copy this link: <span style="color:#555;word-break:break-all;">${url}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#bbb;">© 2026 FreeCustom.Email</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const { email, token } = await req.json();

  // 1. Basic Input Validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // 2. Validate Turnstile Token
  if (!token) {
    return NextResponse.json({ error: 'CAPTCHA missing' }, { status: 400 });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not defined");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const turnstileOutcome = await turnstileRes.json() as any;

    if (!turnstileOutcome.success) {
      console.error("Turnstile verification failed:", turnstileOutcome);
      return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 403 });
    }
  } catch (err) {
    console.error("Turnstile error:", err);
    return NextResponse.json({ error: 'Failed to verify security check' }, { status: 500 });
  }

  // 3. Logic to Send Email
  const ctx = await getCloudflareContext<{ AUTH_KV: KVNamespace }>();
  const kv = ctx.env.AUTH_KV;

  const magicToken = randomBytes(32).toString('hex');
  await kv.put(`magic:${magicToken}`, email, { expirationTtl: TOKEN_TTL });

  const url = new URL(`/api/auth/magic/verify?token=${magicToken}`, req.url).toString();

  await transporter.sendMail({
    to: email,
    from: 'FreeCustom.Email <' + process.env.EMAIL_FROM! + '>',
    subject: 'Sign in to FreeCustom.Email',
    text: `Sign in to FreeCustom.Email:\n\n${url}\n\nExpires in 10 minutes.`,
    html: getMagicLinkHtml(url),
  });

  return NextResponse.json({ ok: true });
}
