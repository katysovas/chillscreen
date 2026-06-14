import { Resend } from 'resend';
import { SITE_NAME } from '@/lib/site';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM?.trim() || `${SITE_NAME} <whichstage@team.smartmetrics.com>`;
const TO = process.env.CONTACT_TO?.trim() || 'support@smartmetrics.com';

export type ContactPayload = {
  name: string;
  email: string;
  notes: string;
};

export function validateContactPayload(body: Partial<ContactPayload>): string | null {
  if (!body.name?.trim() || !body.email?.trim() || !body.notes?.trim()) {
    return 'All fields are required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email.trim())) {
    return 'Invalid email address.';
  }
  return null;
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const name = payload.name.trim();
  const email = payload.email.trim();
  const notes = payload.notes.trim();

  const { error } = await resend.emails.send({
    from: FROM,
    to: [TO],
    replyTo: email,
    subject: `New ${SITE_NAME} message from ${name}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 20px;font-size:20px;color:#111;">New ${escapeHtml(SITE_NAME)} contact message</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;width:80px;vertical-align:top;">Name</td>
            <td style="padding:8px 0;color:#111;font-size:14px;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;">Email</td>
            <td style="padding:8px 0;color:#111;font-size:14px;">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;">Message</td>
            <td style="padding:8px 0;color:#111;font-size:14px;white-space:pre-wrap;">${escapeHtml(notes)}</td>
          </tr>
        </table>
      </div>
    `,
  });

  if (error) throw error;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
