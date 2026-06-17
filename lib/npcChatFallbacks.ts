import type { CharacterDef } from '@/components/game/characters';
import { npcDisplayNameForCharacter } from '@/lib/npcRoster';
import { formatBitcoinUsd, type BitcoinSnapshot } from '@/lib/bitcoinPrice';

/** Client-safe fallbacks — character is always passed from the live cast. */
export function pickFallbackReply(
  character: CharacterDef,
  bitcoinSnapshot?: BitcoinSnapshot | null,
): string {
  if (character.id === 'satosh' && bitcoinSnapshot) {
    return `${formatBitcoinUsd(bitcoinSnapshot.usd)} right now — say that again?`;
  }
  return 'Hmm, lost my train of thought — say that again?';
}

export function pickFallbackGreeting(
  character: CharacterDef,
  bitcoinSnapshot?: BitcoinSnapshot | null,
): string {
  if (character.id === 'satosh' && bitcoinSnapshot) {
    const change =
      bitcoinSnapshot.change24hPct != null
        ? `, ${bitcoinSnapshot.change24hPct >= 0 ? 'up' : 'down'} ${Math.abs(bitcoinSnapshot.change24hPct).toFixed(1)}% today`
        : '';
    return `₿ ${formatBitcoinUsd(bitcoinSnapshot.usd)}${change} — what's good?`;
  }
  return `Hey! I'm ${npcDisplayNameForCharacter({ id: character.id, name: character.name, modelId: character.modelId })}`;
}
