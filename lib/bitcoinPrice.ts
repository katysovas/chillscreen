export type BitcoinSnapshot = {
  usd: number;
  change24hPct: number | null;
};

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';

/** Live BTC/USD from CoinGecko (no API key). Returns null if the fetch fails. */
export async function fetchBitcoinUsdSnapshot(): Promise<BitcoinSnapshot | null> {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      bitcoin?: { usd?: number; usd_24h_change?: number };
    };

    const usd = data.bitcoin?.usd;
    if (typeof usd !== 'number' || !Number.isFinite(usd)) return null;

    const change = data.bitcoin?.usd_24h_change;
    return {
      usd,
      change24hPct: typeof change === 'number' && Number.isFinite(change) ? change : null,
    };
  } catch {
    return null;
  }
}

export function formatBitcoinUsd(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: usd >= 1000 ? 0 : 2,
  }).format(usd);
}

/** System-prompt block so Satoshi can quote real ticker data. */
export function bitcoinWorldNote(snapshot: BitcoinSnapshot | null): string {
  if (!snapshot) {
    return (
      'Live BTC/USD ticker is offline right now. If asked for price, say the feed is down ' +
      'and stay in character — do not invent a dollar amount.'
    );
  }

  const price = formatBitcoinUsd(snapshot.usd);
  const change =
    snapshot.change24hPct != null
      ? `, 24h ${snapshot.change24hPct >= 0 ? '+' : ''}${snapshot.change24hPct.toFixed(2)}%`
      : '';

  return (
    `LIVE TICKER (authoritative — use when asked about BTC price, "how much is bitcoin", or the market): ` +
    `Bitcoin = ${price} USD${change}. Quote these numbers when relevant; never invent a different price. ` +
    `Not financial advice — vibes and data only.`
  );
}
