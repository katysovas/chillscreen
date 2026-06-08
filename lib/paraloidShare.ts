import { SITE_TAGLINE, SITE_URL } from './site';

const FILENAME = 'whichstage-paraloid.png';

export function paraloidShareText() {
  return `${SITE_TAGLINE} ${SITE_URL}`;
}

export async function shareParaloidNative(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;

  const file = new File([blob], FILENAME, { type: 'image/png' });
  const payload = {
    title: 'WhichStage',
    text: paraloidShareText(),
    url: SITE_URL,
    files: [file],
  };

  if (navigator.canShare && !navigator.canShare(payload)) return false;

  try {
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}

export function shareParaloidTwitter() {
  const text = paraloidShareText();
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareParaloidFacebook() {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyParaloidImage(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function downloadParaloid(blob: Blob) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = FILENAME;
  anchor.click();
  URL.revokeObjectURL(href);
}
