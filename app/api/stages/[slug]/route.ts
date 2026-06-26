import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  getUserStageBySlug,
  getUserStagePublicBySlug,
  takedownUserStage,
  toUserStagePublic,
  updateUserStage,
} from '@/lib/stages/db';
import { stagePresetById } from '@/lib/stages/presets';
import { parsePresetBackdropUrl } from '@/lib/stages/wallpapers';
import { parseStreamsJson } from '@/lib/stages/parseStream';
import {
  normalizeStageDescription,
  validateStageDescription,
} from '@/lib/stages/stageDescription';
import {
  normalizeStageSocialLinks,
  parseSocialLinksJson,
  validateStageSocialLinks,
} from '@/lib/stages/socialLinks';
import type { StagePresetId } from '@/lib/stages/types';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';
import { isSuperAdminUserId } from '@/lib/superAdmin.server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

function parseSky(raw: unknown): SkyPeriod | null | undefined {
  if (raw === undefined) return undefined;
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'night' || s === 'morning' || s === 'day' || s === 'evening') return s;
  return undefined;
}

/** GET — public stage metadata for runtime. */
export async function GET(_req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const { slug } = await ctx.params;
  try {
    const stage = await getUserStagePublicBySlug(slug.toLowerCase());
    if (!stage || stage.takenDown) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }
    if (stage.tier === 'reclaimable') {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }
    return NextResponse.json({ stage });
  } catch (err) {
    console.error('[api/stages/[slug] GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PATCH — owner updates lineup / now-playing / preset. */
export async function PATCH(req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    const body = await req.json() as Record<string, unknown>;
    const patch: Parameters<typeof updateUserStage>[2] = {};

    const existing = await getUserStageBySlug(slug);
    if (!existing || existing.taken_down_at) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }

    const isSuperAdmin = await isSuperAdminUserId(userId);
    const isOwner = existing.owner_id === userId;
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }

    if (body.streams !== undefined) {
      const streams = parseStreamsJson(body.streams);
      if (!streams.length) {
        return NextResponse.json({ error: 'Lineup cannot be empty.' }, { status: 400 });
      }
      if (streams.length > STAGE_CONFIG.MAX_STREAMS) {
        return NextResponse.json(
          { error: `Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.` },
          { status: 400 },
        );
      }
      patch.streams = streams;
    }

    if (body.nowPlayingIndex !== undefined) {
      const streamCount = patch.streams?.length ?? existing.streams.length;
      const maxIndex = Math.max(0, streamCount - 1);
      patch.nowPlayingIndex = Math.min(
        maxIndex,
        Math.max(0, Math.floor(Number(body.nowPlayingIndex) || 0)),
      );
    }

    if (body.preset !== undefined) {
      const presetDef = stagePresetById(String(body.preset));
      if (!presetDef) {
        return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
      }
      patch.preset = presetDef.id as StagePresetId;
    }

    const sky = parseSky(body.sky);
    if (sky !== undefined) patch.sky = sky;

    if (body.shuffleOnStart !== undefined) {
      patch.shuffleOnStart = Boolean(body.shuffleOnStart);
    }

    if (body.description !== undefined) {
      const descriptionRaw = String(body.description ?? '');
      const descriptionErr = validateStageDescription(descriptionRaw);
      if (descriptionErr) {
        return NextResponse.json({ error: descriptionErr }, { status: 400 });
      }
      patch.description = normalizeStageDescription(descriptionRaw);
    }

    if (body.socialLinks !== undefined || body.social_links !== undefined) {
      const socialLinks = normalizeStageSocialLinks(
        parseSocialLinksJson(body.socialLinks ?? body.social_links),
      );
      const socialLinksErr = validateStageSocialLinks(socialLinks);
      if (socialLinksErr) {
        return NextResponse.json({ error: socialLinksErr }, { status: 400 });
      }
      patch.socialLinks = socialLinks;
    }

    if (body.backdropUrl !== undefined) {
      const targetPreset = (patch.preset ?? existing.preset) as StagePresetId;
      if (targetPreset !== 'cinema') {
        return NextResponse.json(
          { error: 'Backdrop is only for City stages.' },
          { status: 400 },
        );
      }
      const parsed = parsePresetBackdropUrl(body.backdropUrl);
      if (parsed === 'invalid') {
        return NextResponse.json({ error: 'Invalid backdrop.' }, { status: 400 });
      }
      patch.backdropUrl = parsed ?? null;
    }

    const row = await updateUserStage(slug, existing.owner_id, patch, existing);
    if (!row) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }
    return NextResponse.json({ stage: toUserStagePublic(row) });
  } catch (err) {
    console.error('[api/stages/[slug] PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE — owner takedown. */
export async function DELETE(req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    const existing = await getUserStageBySlug(slug);
    if (!existing || existing.taken_down_at) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }
    const isSuperAdmin = await isSuperAdminUserId(userId);
    if (existing.owner_id !== userId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }
    await takedownUserStage(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/stages/[slug] DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
