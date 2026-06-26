import { SITE_NAME } from '@/lib/site';

export type StageSharePlatform =
  | 'x'
  | 'facebook'
  | 'whatsapp'
  | 'telegram'
  | 'reddit'
  | 'linkedin'
  | 'email';

export type StageShareTarget = {
  url: string;
  stageTitle: string;
  /** Short line for tweet / messenger previews. */
  message?: string;
};

export function buildStageShareMessage(
  stageTitle: string,
  inviteUrl: string,
): string {
  return `Join me at ${stageTitle} on ${SITE_NAME} — ${inviteUrl}`;
}

export function buildStageShareEmailSubject(stageTitle: string): string {
  return `${stageTitle} on ${SITE_NAME}`;
}

export function buildStageShareEmailBody(
  stageTitle: string,
  inviteUrl: string,
): string {
  return (
    `Hey!\n\n` +
    `I'm hanging out at ${stageTitle} on ${SITE_NAME}. Come join the stage:\n\n` +
    `${inviteUrl}\n`
  );
}

export function stageSharePlatformUrl(
  platform: StageSharePlatform,
  target: StageShareTarget,
): string {
  const message = target.message ?? buildStageShareMessage(target.stageTitle, target.url);
  const encodedUrl = encodeURIComponent(target.url);
  const encodedMessage = encodeURIComponent(message);
  const encodedTitle = encodeURIComponent(target.stageTitle);

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedMessage}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
        `Join me at ${target.stageTitle} on ${SITE_NAME}`,
      )}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'email':
      return (
        `mailto:?subject=${encodeURIComponent(buildStageShareEmailSubject(target.stageTitle))}` +
        `&body=${encodeURIComponent(buildStageShareEmailBody(target.stageTitle, target.url))}`
      );
  }
}

export function openStageSharePlatform(
  platform: StageSharePlatform,
  target: StageShareTarget,
): void {
  const url = stageSharePlatformUrl(platform, target);
  if (platform === 'email') {
    window.location.href = url;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function nativeStageShare(target: StageShareTarget): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  const text = target.message ?? buildStageShareMessage(target.stageTitle, target.url);
  try {
    await navigator.share({
      title: `${target.stageTitle} — ${SITE_NAME}`,
      text,
      url: target.url,
    });
    return true;
  } catch {
    return false;
  }
}

export async function copyStageShareLink(url: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
