import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, notes } = await req.json() as {
      name: string;
      email: string;
      notes: string;
    };

    if (!name?.trim() || !email?.trim() || !notes?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'ChillScreen <onboarding@resend.dev>',
      to: ['support@smartmetrics.com'],
      replyTo: email.trim(),
      subject: `New collaboration request from ${name.trim()}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 20px;font-size:20px;color:#111;">New collaboration request</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#666;font-size:13px;width:80px;vertical-align:top;">Name</td>
              <td style="padding:8px 0;color:#111;font-size:14px;">${escapeHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;">Email</td>
              <td style="padding:8px 0;color:#111;font-size:14px;">${escapeHtml(email.trim())}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;">Notes</td>
              <td style="padding:8px 0;color:#111;font-size:14px;white-space:pre-wrap;">${escapeHtml(notes.trim())}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
