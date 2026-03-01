import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { verifyTurnstileToken } from '@/lib/turnstile';

const STAR_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e',
};

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

function getStars(rating: number): string {
  const filled = '&#9733;';
  const empty  = '&#9733;';
  const color  = STAR_COLORS[rating] ?? '#eab308';
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? color : '#e5e5e5'};font-size:20px;">${filled}</span>`
  ).join('');
}

function getFeedbackEmailHtml(type: string, rating: number, message: string, email?: string): string {
  const ratingColor = STAR_COLORS[rating] ?? '#eab308';
  const ratingLabel = RATING_LABELS[rating] ?? `${rating}/5`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Feedback</title>
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
              <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111;">New feedback received</p>
              <p style="margin:0 0 32px;font-size:14px;color:#666;line-height:1.6;">
                A user submitted feedback on your platform.
              </p>

              <!-- Rating block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Rating</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">${getStars(rating)}</td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:14px;font-weight:600;color:${ratingColor};">${ratingLabel}</span>
                          <span style="font-size:13px;color:#999;"> · ${rating} / 5</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Meta -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Category</span><br>
                    <span style="font-size:14px;color:#111;font-weight:500;">${type}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Submitted by</span><br>
                    <span style="font-size:14px;color:#111;font-weight:500;">${email || 'Anonymous'}</span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #f0f0f0;"></td></tr>
              </table>

              <!-- Message -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Feedback</p>
              <p style="margin:0;font-size:14px;color:#333;line-height:1.75;white-space:pre-wrap;">${message}</p>

              ${email ? `
              <!-- Reply CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td>
                    <a href="mailto:${email}" style="display:inline-block;background:#111;color:#fff;padding:11px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Reply to user</a>
                  </td>
                </tr>
              </table>` : ''}
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
    const { type, rating, message, email, token } = await request.json();

    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    if (!type || !rating || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: `FreeCustom.Email <feedback@freecustom.email>`,
      replyTo: email,
      to: process.env.ADMIN_EMAIL!,
      subject: `[Feedback] ${type} · ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} ${RATING_LABELS[rating] ?? rating + '/5'}`,
      text: `Type: ${type}\nRating: ${rating}/5\nUser: ${email || 'Anonymous'}\n\n${message}`,
      html: getFeedbackEmailHtml(type, rating, message, email),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Feedback sent' });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
  }
}