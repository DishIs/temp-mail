import { NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { resend } from '@/lib/resend';

function getContactEmailHtml(name: string, email: string, subject: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
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
              <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111;">New contact message</p>
              <p style="margin:0 0 32px;font-size:14px;color:#666;line-height:1.6;">
                Someone reached out via the contact form.
              </p>

              <!-- Meta pills -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">From</span><br>
                    <span style="font-size:14px;color:#111;font-weight:500;">${name}</span>
                    <span style="font-size:14px;color:#888;"> &lt;${email}&gt;</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Subject</span><br>
                    <span style="font-size:14px;color:#111;font-weight:500;">${subject || '—'}</span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #f0f0f0;"></td></tr>
              </table>

              <!-- Message body -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
              <p style="margin:0;font-size:14px;color:#333;line-height:1.75;white-space:pre-wrap;">${message}</p>

              <!-- Reply CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td>
                    <a href="mailto:${email}" style="display:inline-block;background:#111;color:#fff;padding:11px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Reply to ${name}</a>
                  </td>
                </tr>
              </table>
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

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, token } = await request.json();

    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: `FreeCustom.Email <contact@freecustom.email>`,
      replyTo: email,
      to: process.env.ADMIN_EMAIL!,
      subject: `[Contact] ${subject || 'New Inquiry'} — from ${name}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html: getContactEmailHtml(name, email, subject, message),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}