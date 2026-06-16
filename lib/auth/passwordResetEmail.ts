import { Resend } from 'resend';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM?.trim() || `${SITE_NAME} <whichstage@team.smartmetrics.com>`;

export function passwordResetUrl(token: string): string {
  return `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  festieName: string;
  token: string;
}): Promise<void> {
  if (!resend) {
    console.warn('[password-reset] RESEND_API_KEY not configured — skipping email');
    return;
  }

  const link = passwordResetUrl(opts.token);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [opts.to.trim()],
    subject: `Reset your ${SITE_NAME} password`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#111;">Reset your password</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#333;">
          We received a request to reset the password for festie
          <strong>${escapeHtml(opts.festieName)}</strong>.
        </p>
        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(link)}"
             style="display:inline-block;padding:12px 20px;border-radius:10px;background:#e67e22;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
            Choose a new password
          </a>
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:#666;">
          This link expires in one hour. If you did not request a reset, you can ignore this email.
        </p>
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
