import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, token } = await request.json();

    // 1. Verify CAPTCHA
    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // const transporter = nodemailer.createTransport({
    //   host: process.env.EMAIL_SERVER_HOST,
    //   port: Number(process.env.EMAIL_SERVER_PORT),
    //   secure: false, 
    //   auth: {
    //     user: process.env.EMAIL_SERVER_USER,
    //     pass: process.env.EMAIL_SERVER_PASSWORD,
    //   },
    // });

    // const mailOptions = {
    //   from: `"${name}" <${process.env.EMAIL_FROM}>`,
    //   replyTo: email,
    //   to: process.env.ADMIN_EMAIL,
    //   cc: process.env.EMAIL_FROM,
    //   subject: `[Contact Form] ${subject || 'New Inquiry'}`,
    //   text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    //   html: `
    //     <h3>New Contact Form Submission</h3>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <hr />
    //     <p><strong>Message:</strong></p>
    //     <p style="white-space: pre-wrap;">${message}</p>
    //   `,
    // };

    // await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}