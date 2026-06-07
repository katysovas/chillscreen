'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { setCinemaNowPlaying } from '@/lib/cinemaNow';
import { cinemaEmbedSrc } from '@/lib/cinemaVideoPool';
import { getAudioMuted } from '@/lib/audioMute';
import { currentSchedule, subscribeStageSync, useStageChannel } from '@/lib/stageClock';
import {
  applyYouTubeAudio,
  nudgeYouTubePlayback,
  primeYouTubePlayback,
  scheduleYouTubePlaybackKicks,
} from '@/lib/youtubePlayer';

const IFRAME_W = 400;
const IFRAME_H = 225;
const CIN_W = 460;

// ── SF city palette — gold marquee on Victorian blue-gray ─────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap');

  .cin-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 0;
    position: relative; z-index: 1;
    filter:
      drop-shadow(0 0 28px rgba(212,168,48,.14))
      drop-shadow(0 18px 40px rgba(0,0,0,.55));
  }

  .cin-street-glow {
    position: absolute; bottom: -6px;
    width: 460px; height: 44px;
    background: radial-gradient(ellipse 80% 100% at 50% 100%, rgba(212,168,48,.14) 0%, transparent 70%);
    pointer-events: none;
  }

  .cin-crown { width: ${CIN_W}px; display: block; }

  .cin-sign-band {
    width: ${CIN_W}px; height: 58px;
    background: #3d4870;
    border-left: 2px solid rgba(212,168,48,.28);
    border-right: 2px solid rgba(212,168,48,.28);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .cin-sign-band::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,48,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cin-sign-band::before {
    content: '✦ ✦';
    position: absolute; left: 12px;
    color: #d4a830; font-size: 8px; letter-spacing: 4px; opacity: .45;
  }
  .cin-neon {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 21px; letter-spacing: 8px; font-weight: 300;
    color: #e8c040;
    text-shadow:
      0 0 4px #e8c040,
      0 0 14px rgba(232,192,64,.85),
      0 0 28px rgba(212,168,48,.45),
      0 0 50px rgba(180,130,30,.25);
    animation: cin-flicker 9s ease-in-out infinite;
    user-select: none; position: relative; z-index: 1;
  }
  @keyframes cin-flicker {
    0%,17%,19%,21%,58%,60%,100% {
      text-shadow: 0 0 4px #e8c040,0 0 14px rgba(232,192,64,.85),0 0 28px rgba(212,168,48,.45),0 0 50px rgba(180,130,30,.25);
      color: #e8c040;
    }
    18%,59% { text-shadow: none; color: #4a4020; }
  }

  .cin-film {
    width: ${CIN_W}px; height: 18px;
    background: #1a2038;
    border-left: 2px solid rgba(212,168,48,.28);
    border-right: 2px solid rgba(212,168,48,.28);
    background-image:
      radial-gradient(circle at 9px 9px, #4a5688 5px, #1a2038 5px),
      repeating-linear-gradient(90deg, transparent 0 1px, rgba(212,168,48,.05) 1px 2px);
    background-size: 18px 18px, 18px 18px;
  }

  .cin-screen-section {
    width: ${CIN_W}px;
    background: #3d4870;
    border-left: 2px solid rgba(212,168,48,.28);
    border-right: 2px solid rgba(212,168,48,.28);
    padding: 18px 0 14px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    position: relative;
  }
  .cin-screen-section::before, .cin-screen-section::after {
    content: ''; position: absolute;
    width: 12px; height: 12px;
    border-color: #d4a830; border-style: solid;
    opacity: .5; top: 8px;
  }
  .cin-screen-section::before { left: 10px; border-width: 1.5px 0 0 1.5px; }
  .cin-screen-section::after  { right: 10px; border-width: 1.5px 1.5px 0 0; }
  .cin-mist-top {
    position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(to bottom, rgba(180,205,235,.12), transparent);
    pointer-events: none;
  }

  .cin-screen-frame {
    width: ${IFRAME_W}px; position: relative;
    border: 1.5px solid rgba(212,168,48,.5);
    box-shadow:
      0 0 0 1px #1a2038,
      0 0 0 2px rgba(212,168,48,.12),
      inset 0 0 0 1px #1a2038,
      0 0 18px rgba(212,168,48,.1);
    background: #000;
  }
  .cin-screen-frame::before, .cin-screen-frame::after {
    content: '◆'; position: absolute;
    color: #d4a830; font-size: 9px; opacity: .45;
    top: -7px; z-index: 1;
  }
  .cin-screen-frame::before { left: -6px; }
  .cin-screen-frame::after  { right: -7px; }

  .cin-iframe {
    display: block; width: 100%;
    aspect-ratio: 16/9; border: none; background: #000;
  }

  .cin-marquee {
    width: 420px;
    background: #4a5688;
    border: 1.5px solid rgba(212,168,48,.32);
    border-top: none;
    box-shadow: 0 6px 16px rgba(0,0,0,.45), 0 0 0 1px #1a2038;
    padding: 8px 0 10px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    position: relative;
  }
  .cin-marquee::after {
    content: ''; position: absolute; bottom: -5px;
    left: 20px; right: 20px; height: 5px;
    background: rgba(212,168,48,.07);
    filter: blur(4px); pointer-events: none;
  }

  .cin-bulbs {
    display: flex; gap: 12px; align-items: center; padding: 0 14px;
  }
  .cin-bulb {
    width: 6px; height: 6px; border-radius: 50%;
    background: #fff6d0;
    box-shadow: 0 0 4px 2px rgba(212,168,48,.5);
    animation: cin-ba 1.4s ease-in-out infinite;
  }
  .cin-bulb:nth-child(odd) { animation-name: cin-bb; }
  @keyframes cin-ba { 0%,100%{opacity:.25;box-shadow:0 0 2px rgba(212,168,48,.2)} 50%{opacity:1;box-shadow:0 0 6px 3px rgba(212,168,48,.6)} }
  @keyframes cin-bb { 0%,100%{opacity:1;box-shadow:0 0 6px 3px rgba(212,168,48,.6)} 50%{opacity:.25;box-shadow:0 0 2px rgba(212,168,48,.2)} }

  .cin-now {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 8px; letter-spacing: 6px; color: #d4a830;
    opacity: .55; text-transform: uppercase; font-weight: 300;
    animation: cin-fade 3s ease-in-out infinite;
  }
  @keyframes cin-fade { 0%,100%{opacity:.45} 50%{opacity:.7} }
  .cin-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 14px; letter-spacing: 2px; font-weight: 400;
    color: rgba(255,240,200,.85); text-align: center;
    padding: 0 16px;
    animation: cin-title-in .4s ease;
  }
  @keyframes cin-title-in { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:none} }

  .cin-facade {
    width: ${CIN_W}px; height: 88px;
    background: #4a5688;
    border-left: 2px solid rgba(212,168,48,.28);
    border-right: 2px solid rgba(212,168,48,.28);
    position: relative;
    display: flex; justify-content: space-between; align-items: flex-end;
    overflow: hidden;
  }
  .cin-facade::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg,
      transparent, rgba(212,168,48,.28) 20%, rgba(240,208,96,.45) 50%,
      rgba(212,168,48,.28) 80%, transparent);
  }
  .cin-col {
    width: 32px; height: 88px;
    background: repeating-linear-gradient(
      90deg,
      #4a5688 0 2px, rgba(212,168,48,.1) 2px 4px,
      #4a5688 4px 8px, rgba(212,168,48,.05) 8px 10px,
      #4a5688 10px 14px, rgba(212,168,48,.1) 14px 16px,
      #4a5688 16px 20px, rgba(212,168,48,.04) 20px 22px,
      #4a5688 22px 28px, rgba(212,168,48,.1) 28px 30px,
      #4a5688 30px 32px
    );
    border-right: 1px solid rgba(212,168,48,.12);
    border-left:  1px solid rgba(212,168,48,.12);
  }
  .cin-col:last-child { transform: scaleX(-1); }

  .cin-entrance {
    flex: 1; height: 88px; position: relative;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .cin-arch {
    width: 120px; height: 75px;
    border: 1.5px solid rgba(212,168,48,.4);
    border-bottom: none;
    border-radius: 60px 60px 0 0;
    position: absolute; bottom: 0;
    background: #1a2038;
    overflow: hidden;
    box-shadow: inset 0 0 18px rgba(212,168,48,.04), 0 0 12px rgba(212,168,48,.06);
  }
  .cin-arch::before {
    content: ''; position: absolute;
    left: 12px; right: 12px; top: 16px; height: 55px;
    border: 1px solid rgba(212,168,48,.12);
    border-bottom: none; border-radius: 40px 40px 0 0;
  }
  .cin-door-lights {
    position: absolute; bottom: 3px; left: 50%;
    transform: translateX(-50%);
    display: flex; gap: 8px;
  }
  .cin-door-light {
    width: 4px; height: 4px; border-radius: 50%;
    background: #fff6d0; opacity: .65;
    box-shadow: 0 0 4px rgba(212,168,48,.45);
    animation: cin-ba 2s ease-in-out infinite;
  }
  .cin-door-light:nth-child(2) { animation-duration: 2.5s; }
  .cin-door-light:nth-child(3) { animation-duration: 1.8s; }

  .cin-base {
    width: ${CIN_W}px; height: 14px;
    background: #3d4870;
    border-left: 2px solid rgba(212,168,48,.28);
    border-right: 2px solid rgba(212,168,48,.28);
    border-bottom: 2px solid rgba(212,168,48,.22);
    background-image: repeating-linear-gradient(
      90deg, transparent 0 8px, rgba(212,168,48,.04) 8px 10px
    );
  }

  .cin-steps { display: flex; flex-direction: column; align-items: center; }
  .cin-step {
    height: 9px;
    background: linear-gradient(to bottom, #5a6488, #3d4870);
    border-top: 1px solid rgba(212,168,48,.1);
    border-bottom: 1px solid rgba(0,0,0,.35);
  }
  .cin-step:nth-child(1) { width: 430px; }
  .cin-step:nth-child(2) { width: 456px; }
  .cin-step:nth-child(3) { width: 482px; }
`;

function Crown() {
  const g  = 'rgba(212,168,48,.55)';
  const g2 = '#d4a830';
  const d  = '#3d4870';
  const dk = '#1a2038';
  return (
    <svg viewBox="0 0 360 70" width={CIN_W} height="70" className="cin-crown" style={{ display: 'block' }}>
      <defs>
        <filter id="cfglow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path
        d="M0,70 L0,50 L22,50 L22,34 L50,34 L50,20 L75,20 L75,10
           L115,10 L115,4 L245,4 L245,10 L285,10 L285,20 L310,20
           L310,34 L338,34 L338,50 L360,50 L360,70 Z"
        fill={d}
      />
      <polyline
        points="0,50 22,50 22,34 50,34 50,20 75,20 75,10 115,10 115,4 245,4 245,10 285,10 285,20 310,20 310,34 338,34 338,50 360,50"
        stroke={g} strokeWidth="1.5" fill="none"
      />
      <line x1="0" y1="70" x2="360" y2="70" stroke={g} strokeWidth="1.5" />
      {[100, 128, 156, 180, 204, 232, 260].map((x, i) => (
        <g key={i} filter="url(#cfglow)">
          <rect x={x - 1.5} y={4} width={3} height={16} fill={g2} rx={1} opacity={0.6} />
          <circle cx={x} cy={3} r={2} fill={g2} opacity={0.5} />
        </g>
      ))}
      <g transform="translate(180,4)" filter="url(#cfglow)">
        <polygon points="0,-9 7,0 0,7 -7,0" fill={g2} opacity={0.8} />
        <polygon points="0,-9 7,0 0,7 -7,0" fill="none" stroke={g2} strokeWidth=".8" opacity={0.6} />
        <circle cx={0} cy={0} r={2.5} fill={dk} />
        <circle cx={0} cy={0} r={1.2} fill={g2} />
      </g>
      <line x1="50" y1="20" x2="310" y2="20" stroke={g} strokeWidth=".6" opacity={0.3} />
      <line x1="22" y1="34" x2="338" y2="34" stroke={g} strokeWidth=".6" opacity={0.25} />
      {[32, 328].map((x, i) => (
        <circle key={i} cx={x} cy={42} r={2.5} fill={g2} opacity={0.4} />
      ))}
    </svg>
  );
}

export default function Cinema({ live = true }: { live?: boolean }) {
  const { video, vidKey } = useStageChannel('cinema', live);
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (live && video?.title) setCinemaNowPlaying(video.title);
    else if (live) setCinemaNowPlaying(null);
    return () => { if (live) setCinemaNowPlaying(null); };
  }, [live, video?.title]);

  // Embed URL depends on syncedNow() — set after mount to avoid SSR/client mismatch.
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!live || !video) {
      setSrc('');
      return;
    }
    const sched = currentSchedule('cinema');
    setSrc(cinemaEmbedSrc(video.id, sched?.offsetSec ?? 0));
  }, [live, video?.id, vidKey]);

  useEffect(() => {
    if (!live || !src) return;
    let cancelRetries = scheduleYouTubePlaybackKicks(iframeRef.current);
    const afterPaint = requestAnimationFrame(() => {
      cancelRetries();
      cancelRetries = scheduleYouTubePlaybackKicks(iframeRef.current);
    });
    const onSync = () => {
      nudgeYouTubePlayback(iframeRef.current);
      applyYouTubeAudio(iframeRef.current, getAudioMuted());
    };
    const onGesture = () => {
      nudgeYouTubePlayback(iframeRef.current);
      applyYouTubeAudio(iframeRef.current, getAudioMuted());
    };
    const unsub = subscribeStageSync(onSync);
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture);
    return () => {
      cancelAnimationFrame(afterPaint);
      cancelRetries();
      unsub();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [live, src, vidKey]);

  const onIframeLoad = () => {
    primeYouTubePlayback(iframeRef.current);
  };

  const [playerVisible, setPlayerVisible] = useState(false);
  useEffect(() => {
    if (!live) return;
    setPlayerVisible(false);
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 1) {
          setPlayerVisible(true);
          applyYouTubeAudio(iframeRef.current, getAudioMuted());
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('message', onMessage);
    const fallback = setTimeout(() => {
      setPlayerVisible(true);
      applyYouTubeAudio(iframeRef.current, getAudioMuted());
    }, 5000);
    return () => { window.removeEventListener('message', onMessage); clearTimeout(fallback); };
  }, [vidKey, live]);

  const bulbs = useMemo(() => Array.from({ length: 18 }), []);
  const marqueeTitle = video?.title ?? (live ? 'Loading…' : 'Cute Animals');

  return (
    <div ref={wrapRef} className="cin-wrap">
      <style>{S}</style>

      <Crown />

      <div className="cin-sign-band">
        <span className="cin-neon">CHILL CINEMA</span>
      </div>

      <div className="cin-film" />

      <div className="cin-screen-section">
        <div className="cin-mist-top" />
        <div className="cin-screen-frame">
          {live && video && src ? (
            <>
              <iframe
                key={vidKey}
                ref={iframeRef}
                className="cin-iframe"
                src={src}
                title={video.title}
                width={IFRAME_W}
                height={IFRAME_H}
                onLoad={onIframeLoad}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ display: 'block', border: 'none', background: '#000' }}
              />
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,0,0,0.93)', pointerEvents: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: playerVisible ? 0 : 1,
                transition: playerVisible ? 'opacity 0.8s' : 'none',
              }}>
                <span style={{ fontFamily: 'sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>▶ now playing</span>
                {video?.title && <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', padding: '0 16px', lineHeight: 1.3 }}>{video.title}</span>}
              </div>
            </>
          ) : (
            <div
              className="cin-iframe"
              style={{ width: IFRAME_W, height: IFRAME_H, background: '#0a0e18' }}
            />
          )}
        </div>
      </div>

      <div className="cin-film" />

      <div className="cin-marquee">
        <div className="cin-bulbs">
          {bulbs.map((_, i) => <div key={i} className="cin-bulb" />)}
        </div>
        <div className="cin-now">Now Playing</div>
        <div key={vidKey} className="cin-title">{marqueeTitle}</div>
      </div>

      <div className="cin-facade">
        <div className="cin-col" />
        <div className="cin-entrance">
          <div className="cin-arch">
            <div className="cin-door-lights">
              <div className="cin-door-light" />
              <div className="cin-door-light" />
              <div className="cin-door-light" />
            </div>
          </div>
        </div>
        <div className="cin-col" />
      </div>

      <div className="cin-base" />

      <div className="cin-steps">
        <div className="cin-step" />
        <div className="cin-step" />
        <div className="cin-step" />
      </div>

      <div className="cin-street-glow" />
    </div>
  );
}

export { CINEMA_MID_X } from '@/lib/venues';
export const CINEMA_WIDTH = CIN_W;
export const CINEMA_SCALE = 0.74;
export const CINEMA_HEIGHT = 593;
