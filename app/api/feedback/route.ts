import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { type, rating, message, email, token } = await request.json();

    // 1. Verify CAPTCHA
    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    if (!type || !rating || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mailOptions = {
      from: `"Feedback System" <${process.env.EMAIL_FROM}>`,
      replyTo: email || process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL, 
      cc: process.env.EMAIL_FROM,
      subject: `[Feedback] ${type} - ${rating} Stars`,
      html: `
        <h3>New User Feedback</h3>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Rating:</strong> ${rating} / 5 Stars</p>
        <p><strong>User Email:</strong> ${email || 'Anonymous'}</p>
        <hr />
        <p><strong>Feedback:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Feedback sent' });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
  }
}