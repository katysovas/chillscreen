'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Syne, Space_Mono } from 'next/font/google';
import { LOGO_PATH, TWITTER_HANDLE } from '@/lib/site';
import type { VenueRoute } from '@/lib/venueRoutes';
import { LANDING_FAQ, LANDING_STAGES } from './landingData';
import { LANDING_HERO } from './landingHeroCopy';
import { LandingHeroCanvas } from './LandingHeroCanvas';
import { LandingHeroCta } from './LandingHeroCta';
import { LandingHeroHeader } from './LandingHeroHeader';
import { LandingHeroStageLayer } from './LandingHeroScene';
import './landing-page.css';

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' });
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-space-mono',
});

type Props = {
  onEnter: (route?: VenueRoute) => void;
  onSignIn: () => void;
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*
function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M4 2.5l10 5.5-10 5.5V2.5z" fill="white" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg className="img-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
      <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1" />
    </svg>
  );
}
*/

function SpeakerSvg() {
  return (
    <svg width="110" height="152" viewBox="0 0 110 152" fill="none" aria-hidden>
      <path d="M96 14 L112 24 L112 146 L96 138 Z" fill="#0a0804" />
      <rect x="8" y="8" width="90" height="132" rx="14" fill="#1a160c" stroke="rgba(255,220,140,0.09)" strokeWidth="1.2" />
      <ellipse cx="53" cy="62" rx="36" ry="6" fill="rgba(240,120,30,0.12)" />
      <circle cx="53" cy="58" r="33" fill="#110e09" stroke="rgba(255,220,140,0.07)" strokeWidth="1.5" />
      <circle cx="53" cy="58" r="26" fill="none" stroke="rgba(255,220,140,0.05)" strokeWidth="1" />
      <circle cx="53" cy="58" r="20" fill="#0d0b07" stroke="rgba(255,220,140,0.05)" strokeWidth="1" />
      <circle cx="53" cy="58" r="12" fill="#0a0805" />
      <circle cx="53" cy="58" r="5" fill="#1e180d" />
      <circle cx="53" cy="58" r="33" fill="none" stroke="rgba(240,120,30,0.55)" strokeWidth="2.5" />
      <circle cx="53" cy="58" r="20" fill="none" stroke="rgba(240,120,30,0.18)" strokeWidth="1" />
      <circle cx="53" cy="108" r="18" fill="#110e09" stroke="rgba(255,220,140,0.07)" strokeWidth="1.2" />
      <circle cx="53" cy="108" r="12" fill="#0d0b07" />
      <circle cx="53" cy="108" r="6" fill="#0a0805" />
      <circle cx="53" cy="108" r="2.5" fill="#1a160c" />
      <circle cx="20" cy="20" r="2.5" fill="#0d0b07" stroke="rgba(255,220,140,0.06)" strokeWidth="1" />
      <circle cx="86" cy="20" r="2.5" fill="#0d0b07" stroke="rgba(255,220,140,0.06)" strokeWidth="1" />
      <circle cx="20" cy="132" r="2.5" fill="#0d0b07" stroke="rgba(255,220,140,0.06)" strokeWidth="1" />
      <circle cx="86" cy="132" r="2.5" fill="#0d0b07" stroke="rgba(255,220,140,0.06)" strokeWidth="1" />
    </svg>
  );
}

/*
const GALLERY_ITEMS = [
  { title: 'Deep Space Stage — Set 01', meta: '42:18', play: true, bg: 'linear-gradient(135deg,#1e1508 0%,#0c0a05 100%)' },
  { title: 'Silent Disco · 2 AM', meta: 'Photo', play: false, bg: 'linear-gradient(135deg,#0a1408 0%,#070e06 100%)' },
  { title: 'The Forest crowd', meta: 'Photo', play: false, bg: 'linear-gradient(155deg,#1a0d05 0%,#0e0806 100%)' },
  { title: 'Concert Stage highlights', meta: '12:44', play: true, bg: 'linear-gradient(135deg,#08101a 0%,#060810 100%)' },
  { title: 'Chill Cinema', meta: 'Photo', play: false, bg: 'linear-gradient(135deg,#0f1a08 0%,#090e06 100%)' },
  { title: 'Which Stage 2025 — Full event recap', meta: '1:24:06', play: true, wide: true, bg: 'linear-gradient(90deg,#1a1508 0%,#080706 50%,#1a1508 100%)' },
] as const;
*/

export function LandingPage({ onEnter, onSignIn }: Props) {
  const starsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 110; i++) {
      const star = document.createElement('div');
      const size = Math.random() < 0.18 ? 2 : 1;
      const so = (0.3 + Math.random() * 0.7).toFixed(2);
      star.style.cssText = [
        'position:absolute',
        `left:${(Math.random() * 100).toFixed(1)}%`,
        `top:${(Math.random() * 82).toFixed(1)}%`,
        `width:${size}px`,
        `height:${size}px`,
        'border-radius:50%',
        'background:#fff',
        `--so:${so}`,
        `animation:lp-star ${(2.5 + Math.random() * 4).toFixed(1)}s ${(Math.random() * 6).toFixed(1)}s ease-in-out infinite alternate`,
        `opacity:${so}`,
      ].join(';');
      fragment.appendChild(star);
    }
    container.appendChild(fragment);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const notes = String(fd.get('message') ?? '').trim();

    setContactStatus('sending');
    setContactError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, notes }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setContactError(data.error ?? 'Something went wrong.');
        setContactStatus('error');
        return;
      }
      setContactStatus('sent');
      form.reset();
      window.setTimeout(() => setContactStatus('idle'), 4000);
    } catch {
      setContactError('Network error. Please try again.');
      setContactStatus('error');
    }
  };

  const layoutClass = (layout: string) => {
    if (layout === 'featured') return 'stage-card stage-featured';
    if (layout === 'right') return 'stage-card stage-right';
    return 'stage-card stage-small';
  };

  /*
  const galleryClass = (i: number, wide?: boolean) => {
    if (wide) return 'gi gi-6';
    return `gi gi-${i + 1}`;
  };
  */

  return (
    <div className={`landing-page ${syne.variable} ${spaceMono.variable}`}>
      <svg className="grain" aria-hidden>
        <filter id="lp-gf">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lp-gf)" />
      </svg>

      <nav className="nav" ref={navRef}>
        <div className="nav-logo">
          <a href="#hero" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <Image src={LOGO_PATH} alt="Which Stage" width={818} height={138} style={{ height: 30, width: 'auto' }} priority />
          </a>
        </div>
        <div className="nav-actions">
          <button type="button" className="nav-pill nav-pill--ghost" onClick={onSignIn}>
            Sign In
          </button>
          <button type="button" className="nav-pill nav-pill--join" onClick={() => onEnter()}>
            {LANDING_HERO.navCta}
          </button>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="hero-stars" ref={starsRef} />
        <LandingHeroCanvas />
        <div className="hero-glow-l" />
        <div className="hero-glow-r" />
        <div className="hero-crescent" aria-hidden />
        <div className="hero-dot-a" aria-hidden />
        <div className="hero-dot-b" aria-hidden />

        <LandingHeroStageLayer />

        <div className="hero-content">
          <LandingHeroHeader />
          <LandingHeroCta onEnter={() => onEnter()} />
        </div>

        <svg className="hero-arc-svg" width="460" height="280" viewBox="0 0 460 280" fill="none" aria-hidden>
          <ellipse cx="230" cy="220" rx="210" ry="160" stroke="white" strokeWidth="1.2" strokeDasharray="7 9" />
        </svg>

        <div className="hero-speaker-wrap" aria-hidden>
          <SpeakerSvg />
        </div>

        <div className="hero-scroll" aria-hidden>
          <div className="hero-scroll-line" />
          <span className="hero-scroll-txt">scroll</span>
        </div>
      </section>

      <section className="stages-section" id="stages">
        <div className="stages-inner">
          <p className="stages-eyebrow">9 stages · always on</p>
          <div className="stages-grid">
            {LANDING_STAGES.map(stage => (
              <button
                key={stage.route}
                type="button"
                className={layoutClass(stage.layout)}
                style={{ background: stage.background }}
                onClick={() => onEnter(stage.route)}
              >
                {stage.bgImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="stage-bg-img" src={stage.bgImage} alt="" />
                )}
                <div className="stage-accent" style={{ ['--sa' as string]: stage.accent }} />
                <div className="stage-content">
                  {stage.live && (
                    <div className="stage-live-tag">
                      <span className="stage-live-dot" />
                      LIVE NOW
                    </div>
                  )}
                  <h3 className="stage-name">{stage.name}</h3>
                  {stage.desc && <p className="stage-desc">{stage.desc}</p>}
                  <span className="stage-cta-btn">
                    {stage.featured ? 'Enter stage →' : 'Enter →'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="inner">
          <p className="section-label">AI goes to the festival</p>
          <h2 className="section-title">Questions?</h2>
          <div>
            {LANDING_FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`faq-item${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq-q-text">{item.q}</span>
                    <span className="faq-icon" aria-hidden>+</span>
                  </button>
                  <div className="faq-a" role="region">
                    <div className="faq-a-inner">{item.a}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/*
      <section className="section gallery-section" id="gallery">
        <div className="inner">
          <p className="section-label">From the stages</p>
          <h2 className="section-title">Live from<br />the festival floor</h2>
          <div className="gallery-grid">
            {GALLERY_ITEMS.map((item, i) => (
              <button
                key={item.title}
                type="button"
                className={galleryClass(i, 'wide' in item && item.wide)}
                onClick={() => onEnter()}
              >
                <div className="gi-thumb" style={{ background: item.bg }}>
                  {item.play ? (
                    <div className="play-ring" style={'wide' in item && item.wide ? { width: 60, height: 60 } : undefined}>
                      <PlayIcon size={'wide' in item && item.wide ? 20 : 16} />
                    </div>
                  ) : (
                    <PhotoIcon />
                  )}
                </div>
                <div className="gi-cap">
                  <span className="gi-cap-title">{item.title}</span>
                  <span className="gi-cap-meta">{item.meta}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      */}

      <section className="section contact-section" id="contact">
        <div className="contact-bg-word" aria-hidden>HELLO</div>
        <div className="inner">
          <div className="contact-grid">
            <div>
              <p className="section-label">Get in touch</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Say<br />hello.</h2>
              <p className="contact-blurb">
                Help us build Which Stage. Whether you&apos;re an artist, a developer, or just a fan of live music and AI — we want to hear from you.
              </p>
              <p className="contact-handle">→ {TWITTER_HANDLE}</p>
            </div>
            <form className="c-form" onSubmit={e => void handleContactSubmit(e)}>
              <div>
                <label className="c-label" htmlFor="cf-n">Name</label>
                <input className="c-input" id="cf-n" name="name" type="text" placeholder="Your name" required disabled={contactStatus === 'sending'} />
              </div>
              <div>
                <label className="c-label" htmlFor="cf-e">Email</label>
                <input className="c-input" id="cf-e" name="email" type="email" placeholder="your@email.com" required disabled={contactStatus === 'sending'} />
              </div>
              <div>
                <label className="c-label" htmlFor="cf-m">Message</label>
                <textarea className="c-input" id="cf-m" name="message" placeholder="What's on your mind?" required disabled={contactStatus === 'sending'} />
              </div>
              {contactError && <p className="c-error">{contactError}</p>}
              <button
                className="c-submit"
                type="submit"
                disabled={contactStatus === 'sending' || contactStatus === 'sent'}
                style={contactStatus === 'sent' ? { background: '#8fd49a' } : undefined}
              >
                {contactStatus === 'sent'
                  ? 'Sent ✓'
                  : contactStatus === 'sending'
                    ? 'Sending…'
                    : 'Send it →'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <Image src={LOGO_PATH} alt="Which Stage" width={818} height={138} style={{ height: 26, width: 'auto' }} />
        </div>
        <p className="footer-copy">© 2026 WhichStage. No download needed.</p>
      </footer>
    </div>
  );
}
