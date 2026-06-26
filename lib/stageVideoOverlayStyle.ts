import { isSafariBrowser } from '@/lib/browserPlatform';

export function safariStaticViewBox(fallback: string): string {
  const parts = fallback.split(/\s+/);
  if (parts.length !== 4) return '0 0 1400 900';
  return `0 ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/** Whether this layer needs the Safari translate workaround. */
export function safariStaticContentTranslateX(layerVx: number): number | undefined {
  if (!isSafariBrowser() || layerVx === 0) return undefined;
  return layerVx;
}
