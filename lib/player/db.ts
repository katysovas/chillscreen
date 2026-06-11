import { normalizeLoadout } from '@/components/game/characters/loadout/defaults';
import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { requireDb } from '@/lib/db';
import { STARTING_COINS } from '@/lib/player/constants';
import { sanitizePlayerLoadout } from '@/lib/player/loadoutValidation';

export { STARTING_COINS };

export type PlayerProfileRow = {
  user_id: string;
  coins: number;
  loadout: CharacterLoadout;
  name: string | null;
};

function parseLoadout(raw: unknown): CharacterLoadout {
  if (!raw || typeof raw !== 'object') return {};
  return raw as CharacterLoadout;
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfileRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT u.id AS user_id, u.coins, u.loadout, f.name
    FROM users u
    LEFT JOIN festies f ON f.user_id = u.id
    WHERE u.id = ${userId}::uuid
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    user_id: String(row.user_id),
    coins: Number(row.coins),
    loadout: parseLoadout(row.loadout),
    name: row.name != null ? String(row.name) : null,
  };
}

export async function savePlayerLoadout(
  userId: string,
  loadout: CharacterLoadout,
  balloonColor = '#ef4023',
): Promise<CharacterLoadout> {
  const sql = requireDb();
  const profile = await getPlayerProfile(userId);
  const sanitized = sanitizePlayerLoadout(
    profile?.loadout,
    loadout,
    balloonColor,
  );
  const rows = await sql`
    UPDATE users SET loadout = ${JSON.stringify(sanitized)}::jsonb
    WHERE id = ${userId}::uuid
    RETURNING loadout
  `;
  return parseLoadout((rows[0] as { loadout: unknown }).loadout);
}

/** Atomically deduct coins and save loadout after a vendor purchase. */
export async function purchaseVendorItemDb(
  userId: string,
  loadout: CharacterLoadout,
  price: number,
  balloonColor = '#ef4023',
): Promise<{ coins: number; loadout: CharacterLoadout } | null> {
  const cost = Math.max(0, Math.floor(price));
  const sql = requireDb();
  const profile = await getPlayerProfile(userId);
  const sanitized = sanitizePlayerLoadout(
    profile?.loadout,
    loadout,
    balloonColor,
  );
  const rows = await sql`
    UPDATE users SET
      coins = coins - ${cost},
      loadout = ${JSON.stringify(sanitized)}::jsonb
    WHERE id = ${userId}::uuid AND coins >= ${cost}
    RETURNING coins, loadout
  `;
  if (!rows.length) return null;
  const row = rows[0] as { coins: number; loadout: unknown };
  return {
    coins: Number(row.coins),
    loadout: parseLoadout(row.loadout),
  };
}

export async function addPlayerCoinsDb(userId: string, amount: number): Promise<number> {
  const delta = Math.max(0, Math.floor(amount));
  const sql = requireDb();
  const rows = await sql`
    UPDATE users SET coins = coins + ${delta}
    WHERE id = ${userId}::uuid
    RETURNING coins
  `;
  return Number((rows[0] as { coins: number }).coins);
}

export async function deductPlayerCoinsDb(
  userId: string,
  amount: number,
): Promise<number | null> {
  const cost = Math.max(0, Math.floor(amount));
  const sql = requireDb();
  const rows = await sql`
    UPDATE users SET coins = coins - ${cost}
    WHERE id = ${userId}::uuid AND coins >= ${cost}
    RETURNING coins
  `;
  if (!rows.length) return null;
  return Number((rows[0] as { coins: number }).coins);
}

export function mergeLoadoutForBalloon(
  saved: CharacterLoadout | undefined,
  balloonColor: string,
): CharacterLoadout {
  return sanitizePlayerLoadout(saved, saved ?? {}, balloonColor);
}
