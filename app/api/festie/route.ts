import { NextResponse } from 'next/server';
import { hashPassword, isFestieNameTaken } from '@/lib/auth/db';
import { setSessionCookie, userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import {
  createFestieForNewUser,
  getFestieByUserId,
  toFestieOwner,
  updateFestie,
} from '@/lib/festie/db';
import {
  parseAttributes,
  parsePreset,
  parseStageSlug,
  parseTopics,
  validateFestieName,
  validateFestiePassword,
  validateNotifyEmail,
  validatePersonalityNotes,
} from '@/lib/festie/validation';
import { parseFestieLlmProvider } from '@/lib/festie/llmProviders';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
}

function dbUnavailable() {
  return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
}

/** GET — fetch signed-in user's festie. */
export async function GET(request: Request) {
  if (!getDb()) return dbUnavailable();
  const userId = userIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const festie = await getFestieByUserId(userId);
    if (!festie) return NextResponse.json({ festie: null });
    return NextResponse.json({ festie: toFestieOwner(festie) });
  } catch (err) {
    console.error('[api/festie GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST — create festie + account (unique name + password). */
export async function POST(request: Request) {
  if (!getDb()) return dbUnavailable();

  try {
    const body = await request.json() as Record<string, unknown>;
    const nameErr = validateFestieName(String(body.name ?? ''));
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

    const pwErr = validateFestiePassword(String(body.password ?? ''));
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

    const name = String(body.name).trim();
    if (await isFestieNameTaken(name)) {
      return NextResponse.json({ error: 'That festie name is taken' }, { status: 409 });
    }

    const preset = parsePreset(body.preset);
    if (!preset) return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });

    const stage_slug = parseStageSlug(body.stage_slug);
    if (!stage_slug) return NextResponse.json({ error: 'Invalid stage_slug' }, { status: 400 });

    const notesRaw = body.personality_notes != null ? String(body.personality_notes) : null;
    const notesErr = validatePersonalityNotes(notesRaw);
    if (notesErr) return NextResponse.json({ error: notesErr }, { status: 400 });

    const passwordHash = hashPassword(String(body.password));
    const festie = await createFestieForNewUser(passwordHash, {
      name,
      preset,
      attributes: parseAttributes(body.attributes),
      topics: parseTopics(body.topics),
      personality_notes: notesRaw?.trim() || null,
      stage_slug,
    });

    const res = NextResponse.json({ festie: toFestieOwner(festie) }, { status: 201 });
    setSessionCookie(res, festie.user_id);
    return res;
  } catch (err) {
    console.error('[api/festie POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PATCH — update festie settings (signed in). */
export async function PATCH(request: Request) {
  if (!getDb()) return dbUnavailable();
  const userId = userIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json() as Record<string, unknown>;
    const patch: Parameters<typeof updateFestie>[1] = {};

    if (body.name !== undefined) {
      return NextResponse.json({ error: 'Festie name cannot be changed' }, { status: 400 });
    }
    if (body.preset !== undefined) {
      const preset = parsePreset(body.preset);
      if (!preset) return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
      patch.preset = preset;
    }
    if (body.stage_slug !== undefined) {
      const slug = parseStageSlug(body.stage_slug);
      if (!slug) return NextResponse.json({ error: 'Invalid stage_slug' }, { status: 400 });
      patch.stage_slug = slug;
    }
    if (body.attributes !== undefined) patch.attributes = parseAttributes(body.attributes);
    if (body.topics !== undefined) patch.topics = parseTopics(body.topics);
    if (body.personality_notes !== undefined) {
      const notes = body.personality_notes != null ? String(body.personality_notes) : null;
      const notesErr = validatePersonalityNotes(notes);
      if (notesErr) return NextResponse.json({ error: notesErr }, { status: 400 });
      patch.personality_notes = notes?.trim() || null;
    }
    if (body.notify_email !== undefined) {
      const email = body.notify_email != null ? String(body.notify_email).trim() : null;
      const emailErr = validateNotifyEmail(email);
      if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
      patch.notify_email = email || null;
    }
    if (body.email_opted_in !== undefined) {
      patch.email_opted_in = Boolean(body.email_opted_in);
    }
    if (body.llm_provider !== undefined) {
      const provider = parseFestieLlmProvider(body.llm_provider);
      if (!provider) {
        return NextResponse.json({ error: 'Invalid llm_provider' }, { status: 400 });
      }
      patch.llm_provider = provider;
    }

    const festie = await updateFestie(userId, patch);
    if (!festie) return NextResponse.json({ error: 'Festie not found' }, { status: 404 });
    return NextResponse.json({ festie: toFestieOwner(festie) });
  } catch (err) {
    console.error('[api/festie PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
