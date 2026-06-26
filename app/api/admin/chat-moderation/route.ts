import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { getDb } from '@/lib/db';
import {
  addModerationBlock,
  deleteUserAccount,
  listChatAccounts,
  listModerationBlocks,
  removeModerationBlock,
} from '@/lib/moderation/db';
import { stageSenderForDisplayName } from '@/lib/moderation/normalize';
import { aggregateAnonymousChatters, purgeSenderAcrossRooms } from '@/lib/moderation/partyRooms';
import type { ModerationBlockKind } from '@/lib/moderation/types';

export const dynamic = 'force-dynamic';

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/chat-moderation]', err);
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}

export async function GET(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    await assertLocalAdminRequest(request);
    const [accounts, anonymous, blocks] = await Promise.all([
      listChatAccounts(),
      aggregateAnonymousChatters(),
      listModerationBlocks(),
    ]);
    const blockedNames = new Set(
      blocks.filter(b => b.kind === 'display_name').map(b => b.value),
    );
    const blockedUserIds = new Set(
      blocks.filter(b => b.kind === 'user_id').map(b => b.value.toLowerCase()),
    );
    const anonymousWithBlocks = anonymous.map(row => ({
      ...row,
      blocked: blockedNames.has(row.display_name.toLowerCase())
        || (row.user_id ? blockedUserIds.has(row.user_id.toLowerCase()) : false),
    }));

    return NextResponse.json({ accounts, anonymous: anonymousWithBlocks, blocks });
  } catch (err) {
    return adminError(err);
  }
}

type PostBody = {
  action?: 'block' | 'unblock' | 'delete-account' | 'purge-chatter';
  kind?: ModerationBlockKind;
  value?: string;
  note?: string;
  userId?: string;
  displayName?: string;
  sender?: string;
  id?: number;
  purgeChatter?: boolean;
};

export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  let body: PostBody;
  try {
    body = await req.json() as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await assertLocalAdminRequest(req);
    switch (body.action) {
      case 'block': {
        if (!body.kind || !body.value?.trim()) {
          return NextResponse.json({ error: 'kind and value required' }, { status: 400 });
        }
        const block = await addModerationBlock(body.kind, body.value, body.note);
        let purged = 0;
        if (body.purgeChatter !== false) {
          if (block.kind === 'display_name') {
            purged = await purgeSenderAcrossRooms(stageSenderForDisplayName(block.value));
          } else if (block.kind === 'user_id') {
            const accounts = await listChatAccounts();
            const account = accounts.find(a => a.user_id.toLowerCase() === block.value.toLowerCase());
            if (account?.festie_name) {
              purged = await purgeSenderAcrossRooms(stageSenderForDisplayName(account.festie_name));
            }
          }
        }
        return NextResponse.json({ ok: true, block, purged });
      }
      case 'unblock': {
        if (body.id == null) {
          return NextResponse.json({ error: 'id required' }, { status: 400 });
        }
        const ok = await removeModerationBlock(body.id);
        if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ok: true });
      }
      case 'delete-account': {
        const userId = body.userId?.trim();
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        const accounts = await listChatAccounts();
        const account = accounts.find(a => a.user_id === userId);
        let purged = 0;
        if (account?.festie_name) {
          purged = await purgeSenderAcrossRooms(stageSenderForDisplayName(account.festie_name));
        }
        const ok = await deleteUserAccount(userId);
        if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ ok: true, purged });
      }
      case 'purge-chatter': {
        const sender = body.sender?.trim()
          || (body.displayName ? stageSenderForDisplayName(body.displayName) : null);
        if (!sender) {
          return NextResponse.json({ error: 'sender or displayName required' }, { status: 400 });
        }
        const purged = await purgeSenderAcrossRooms(sender);
        return NextResponse.json({ ok: true, purged, sender });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return adminError(err);
  }
}
