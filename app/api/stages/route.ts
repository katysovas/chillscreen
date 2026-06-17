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
  parseTopics,
  validateFestieName,
  validateFestiePassword,
  validatePersonalityNotes,
} from '@/lib/festie/validation';
import { deductPlayerCoinsDb } from '@/lib/player/db';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  insertUserStage,
  isStageSlugTaken,
  reclaimStaleStageSlugs,
  toUserStagePublic,
} from '@/lib/stages/db';
import { stagePresetById } from '@/lib/stages/presets';
import { parsePresetBackdropUrl } from '@/lib/stages/wallpapers';
import { validateStageDisplayName } from '@/lib/stages/stageDisplayName';
import { parseStreamsJson } from '@/lib/stages/parseStream';
import {
  normalizeStageSlug,
  slugRejectMessage,
  validateStageSlugFormat,
} from '@/lib/stages/slugValidation';
import type { StagePresetId } from '@/lib/stages/types';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';

export const dynamic = 'force-dynamic';

function parseSky(raw: unknown): SkyPeriod | undefined {
  if (raw == null || raw === '') return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === 'night' || s === 'morning' || s === 'day' || s === 'evening') return s;
  return undefined;
}

/** POST — atomic create: festie + account + stage + coin deduction. */
export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const slug = normalizeStageSlug(String(body.slug ?? ''));
    const formatErr = validateStageSlugFormat(slug);
    if (formatErr) {
      return NextResponse.json({ error: slugRejectMessage(formatErr) }, { status: 400 });
    }

    await reclaimStaleStageSlugs();
    if (await isStageSlugTaken(slug)) {
      return NextResponse.json({ error: slugRejectMessage('taken') }, { status: 409 });
    }

    const presetRaw = String(body.preset ?? '');
    const presetDef = stagePresetById(presetRaw);
    if (!presetDef) {
      return NextResponse.json({ error: 'Invalid scene preset' }, { status: 400 });
    }
    const preset = presetDef.id as StagePresetId;
    const sky = parseSky(body.sky);

    const displayName = String(body.displayName ?? body.display_name ?? '').trim();
    const displayNameErr = validateStageDisplayName(displayName);
    if (displayNameErr) {
      return NextResponse.json({ error: displayNameErr }, { status: 400 });
    }

    const streams = parseStreamsJson(body.streams);
    if (!streams.length) {
      return NextResponse.json({ error: 'Add at least one stream.' }, { status: 400 });
    }
    if (streams.length > STAGE_CONFIG.MAX_STREAMS) {
      return NextResponse.json(
        { error: `Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.` },
        { status: 400 },
      );
    }
    if (streams.some(s => s.durationSec == null || s.durationSec <= 0)) {
      return NextResponse.json(
        { error: 'All streams must have a verified video length.' },
        { status: 400 },
      );
    }

    const shuffleOnStart = Boolean(body.shuffleOnStart);

    let backdropUrl: string | null = null;
    if (body.backdropUrl !== undefined) {
      if (preset !== 'cinema') {
        return NextResponse.json(
          { error: 'Backdrop is only for City stages.' },
          { status: 400 },
        );
      }
      const parsed = parsePresetBackdropUrl(body.backdropUrl);
      if (parsed === 'invalid') {
        return NextResponse.json({ error: 'Invalid backdrop.' }, { status: 400 });
      }
      backdropUrl = parsed ?? null;
    }

    const sessionUserId = userIdFromRequest(req);

    if (sessionUserId) {
      const festie = await getFestieByUserId(sessionUserId);
      if (!festie) {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
      }

      const coins = await deductPlayerCoinsDb(sessionUserId, STAGE_CONFIG.CREATION_COIN_COST);
      if (coins == null) {
        return NextResponse.json(
          {
            error: `Not enough coins — creating a stage costs ${STAGE_CONFIG.CREATION_COIN_COST} coins.`,
          },
          { status: 402 },
        );
      }

      const updatedFestie = await updateFestie(sessionUserId, { stage_slug: slug });
      if (!updatedFestie) {
        return NextResponse.json({ error: 'Festie not found' }, { status: 404 });
      }

      const row = await insertUserStage({
        slug,
        displayName,
        ownerId: sessionUserId,
        festieId: updatedFestie.id,
        preset,
        sky: sky ?? null,
        streams,
        nowPlayingIndex: 0,
        backdropUrl,
        shuffleOnStart,
      });

      return NextResponse.json({
        stage: toUserStagePublic(row),
        festie: toFestieOwner(updatedFestie),
        coins,
      }, { status: 201 });
    }

    const festieBody = body.festie as Record<string, unknown> | undefined;
    if (!festieBody) {
      return NextResponse.json({ error: 'Festie details required.' }, { status: 400 });
    }

    const nameErr = validateFestieName(String(festieBody.name ?? ''));
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

    const pwErr = validateFestiePassword(String(festieBody.password ?? ''));
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

    const festieName = String(festieBody.name).trim();
    if (await isFestieNameTaken(festieName)) {
      return NextResponse.json({ error: 'That festie name is taken' }, { status: 409 });
    }

    const festiePreset = parsePreset(festieBody.preset);
    if (!festiePreset) {
      return NextResponse.json({ error: 'Invalid festie preset' }, { status: 400 });
    }

    const notesRaw = festieBody.personality_notes != null
      ? String(festieBody.personality_notes)
      : null;
    const notesErr = validatePersonalityNotes(notesRaw);
    if (notesErr) return NextResponse.json({ error: notesErr }, { status: 400 });

    const passwordHash = hashPassword(String(festieBody.password));
    const festie = await createFestieForNewUser(passwordHash, {
      name: festieName,
      preset: festiePreset,
      attributes: parseAttributes(festieBody.attributes),
      topics: parseTopics(festieBody.topics),
      personality_notes: notesRaw?.trim() || null,
      stage_slug: slug,
    });

    const coins = await deductPlayerCoinsDb(festie.user_id, STAGE_CONFIG.CREATION_COIN_COST);
    if (coins == null) {
      return NextResponse.json(
        {
          error: `Not enough coins — creating a stage costs ${STAGE_CONFIG.CREATION_COIN_COST} coins.`,
        },
        { status: 402 },
      );
    }

    const row = await insertUserStage({
      slug,
      displayName,
      ownerId: festie.user_id,
      festieId: festie.id,
      preset,
      sky: sky ?? null,
      streams,
      nowPlayingIndex: 0,
      backdropUrl,
      shuffleOnStart,
    });

    const res = NextResponse.json({
      stage: toUserStagePublic(row),
      festie: toFestieOwner(festie),
      coins,
    }, { status: 201 });
    setSessionCookie(res, festie.user_id);
    return res;
  } catch (err) {
    console.error('[api/stages POST]', err);
    const code = (err as { code?: string }).code;
    if (code === '23505') {
      return NextResponse.json({ error: slugRejectMessage('taken') }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
