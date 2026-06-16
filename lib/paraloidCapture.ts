import { LOGO_PATH, SITE_TAGLINE, SITE_URL } from './site';
import { playParaloidShutter } from './playParaloidShutter';

export type ParaloidResult = {
  dataUrl: string;
  blob: Blob;
};

export type ParaloidCaptureTarget = {
  root: HTMLElement;
};

const FESTIVAL_COLORS = ['#ff2d95', '#00e5ff', '#ffe566', '#7cff6b', '#b388ff', '#ff6b35'];

function extractYouTubeId(src: string): string | null {
  const match = src.match(/(?:embed\/|\/vi\/|v=)([\w-]{11})/);
  return match?.[1] ?? null;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

async function loadBitmap(url: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

/** Inline images + swap YouTube iframes so html2canvas sees exactly what's on screen. */
async function prepareDomForCapture(root: HTMLElement): Promise<() => void> {
  const restores: (() => void)[] = [];

  await Promise.all([...root.querySelectorAll('img')].map(async img => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    const dataUrl = await fetchAsDataUrl(new URL(src, window.location.href).href);
    if (!dataUrl) return;
    const prev = img.src;
    img.src = dataUrl;
    restores.push(() => { img.src = prev; });
  }));

  await Promise.all([...root.querySelectorAll('iframe[src*="youtube"]')].map(async iframe => {
    const videoId = extractYouTubeId(iframe.getAttribute('src') ?? '');
    const parent = iframe.parentElement;
    if (!videoId || !parent) return;

    const img = document.createElement('img');
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.background = '#000';
    img.style.pointerEvents = 'none';

    const dataUrl = await fetchAsDataUrl(
      `/api/youtube-thumb?videoId=${encodeURIComponent(videoId)}`,
    );
    if (dataUrl) img.src = dataUrl;

    parent.replaceChild(img, iframe);
    restores.push(() => { parent.replaceChild(iframe, img); });
  }));

  return () => { restores.reverse().forEach(r => r()); };
}

function sanitizeCaptureClone(doc: Document) {
  doc.querySelectorAll('[data-paraloid-ui]').forEach(node => {
    (node as HTMLElement).style.display = 'none';
  });
  doc.querySelectorAll('iframe, video, embed, object').forEach(el => el.remove());
  doc.querySelectorAll('svg').forEach(svg => {
    const el = svg as SVGSVGElement;
    el.style.contain = 'none';
    el.style.willChange = 'auto';
  });
}

async function captureViewport(
  root: HTMLElement,
  pixelRatio: number,
): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(root, {
    backgroundColor: null,
    scale: pixelRatio,
    logging: false,
    useCORS: true,
    allowTaint: false,
    ignoreElements: el =>
      el.hasAttribute('data-paraloid-ui') || Boolean(el.closest('[data-paraloid-ui]')),
    onclone: sanitizeCaptureClone,
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(b => resolve(b), 'image/png');
  });
  if (!blob) throw new Error('Failed to export canvas');
  return blob;
}

function scatterConfetti(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (let i = 0; i < 48; i++) {
    const x = ((i * 97) % 1000) / 1000 * w;
    const y = ((i * 53) % 1000) / 1000 * h;
    const size = 3 + (i % 4);
    ctx.fillStyle = FESTIVAL_COLORS[i % FESTIVAL_COLORS.length];
    ctx.globalAlpha = 0.35 + (i % 5) * 0.08;
    if (i % 3 === 0) {
      ctx.fillRect(x, y, size, size * 0.45);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFestivalFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const border = 16;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  FESTIVAL_COLORS.forEach((color, i) => {
    grad.addColorStop(i / (FESTIVAL_COLORS.length - 1), color);
  });

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = border;
  ctx.strokeRect(x + border / 2, y + border / 2, w - border, h - border);

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + border + 5, y + border + 5, w - border * 2 - 10, h - border * 2 - 10);

  const corners: [number, number][] = [
    [x + 10, y + 10],
    [x + w - 10, y + 14],
    [x + 14, y + h - 10],
    [x + w - 12, y + h - 12],
  ];
  corners.forEach(([cx, cy], i) => {
    ctx.fillStyle = FESTIVAL_COLORS[i % FESTIVAL_COLORS.length];
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

async function composeParaloidCard(screenshot: HTMLCanvasElement): Promise<ParaloidResult> {
  const cardW = 1080;
  const pad = 44;
  const headerH = 108;
  const framePad = 28;

  const photoMaxW = cardW - pad * 2 - framePad * 2;
  const photoScale = photoMaxW / screenshot.width;
  const photoW = photoMaxW;
  const photoH = screenshot.height * photoScale;
  const frameW = photoW + framePad * 2;
  const frameH = photoH + framePad * 2;
  const cardH = pad + headerH + frameH + pad + 28;

  const canvas = document.createElement('canvas');
  canvas.width = cardW;
  canvas.height = Math.ceil(cardH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = ctx.createLinearGradient(0, 0, cardW, cardH);
  bg.addColorStop(0, '#220838');
  bg.addColorStop(0.45, '#0d0122');
  bg.addColorStop(1, '#1a1040');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cardW, cardH);
  scatterConfetti(ctx, cardW, cardH);

  const logo = await loadBitmap(LOGO_PATH);
  let textX = pad;
  if (logo) {
    const logoH = 44;
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, pad, pad + 8, logoW, logoH);
    textX = pad + logoW + 18;
    logo.close();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 30px Georgia, "Times New Roman", serif';
  ctx.fillText('whichstage.com', textX, pad + 36);

  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = '500 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(SITE_TAGLINE, textX, pad + 68);

  const frameX = pad;
  const frameY = pad + headerH;
  drawFestivalFrame(ctx, frameX, frameY, frameW, frameH);

  ctx.fillStyle = '#f6f0e4';
  ctx.fillRect(frameX + framePad, frameY + framePad, photoW, photoH);
  ctx.drawImage(screenshot, frameX + framePad, frameY + framePad, photoW, photoH);

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '500 14px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(SITE_URL.replace(/^https?:\/\//, ''), cardW / 2, cardH - 18);

  const blob = await canvasToBlob(canvas);
  return { dataUrl: await blobToDataUrl(blob), blob };
}

export async function captureParaloid(
  target: ParaloidCaptureTarget,
): Promise<ParaloidResult | null> {
  playParaloidShutter();

  const { root } = target;
  const rect = root.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const restoreDom = await prepareDomForCapture(root);

  let screenshot: HTMLCanvasElement;
  try {
    screenshot = await captureViewport(root, pixelRatio);
  } catch (err) {
    console.error('Paraloid screenshot failed', err);
    return null;
  } finally {
    restoreDom();
  }

  try {
    return await composeParaloidCard(screenshot);
  } catch (err) {
    console.error('Paraloid compose failed', err);
    return null;
  }
}
