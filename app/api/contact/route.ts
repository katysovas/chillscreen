import { NextResponse } from 'next/server';
import { sendContactEmail, validateContactPayload } from '@/lib/contactEmail';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: string; email?: string; notes?: string };
    const validationError = validateContactPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await sendContactEmail({
      name: body.name!,
      email: body.email!,
      notes: body.notes!,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 });
  }
}
