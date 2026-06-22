'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Syne, Space_Mono } from 'next/font/google';
import { SITE_NAME, TWITTER_HANDLE, TWITTER_URL } from '@/lib/site';

const TRANSPARENT_LOGO_PATH = '/images/logos/logo_transparent.png';
import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import { LANDING_FAQ, LANDING_TRENDING_JOIN_LABEL } from './landingData';
import { FeaturedStagesChart } from '@/components/stages/FeaturedStagesChart';
import { LANDING_HERO } from './landingHeroCopy';
import { LandingHeroBackdrop } from './LandingHeroBackdrop';
import { LandingHeroCta } from './LandingHeroCta';
import { LandingHeroHeader } from './LandingHeroHeader';
import {
  LANDING_HERO_SCREEN_HEIGHT_FRAC,
  LANDING_HERO_SCREEN_TOP_FRAC,
} from '@/lib/staticCityViewport';
import './landing-page.css';

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' });
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-space-mono',
});

type Props = {
  onScrollToStages: () => void;
  onStageEnter: (target: StagePickerTarget) => void;
  onSignIn: () => void;
  initialCreatorStageCount?: number;
};

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

export function LandingPage({
  onScrollToStages,
  onStageEnter,
  onSignIn,
  initialCreatorStageCount = 0,
}: Props) {
  const navRef = useRef<HTMLElement>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNavScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id);
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

      <nav className="nav" ref={navRef} aria-label="Primary">
        <div className="nav-logo">
          <a href="#hero" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <Image src={TRANSPARENT_LOGO_PATH} alt="Which Stage" width={818} height={138} style={{ height: 30, width: 'auto' }} priority />
          </a>
        </div>
        <ul className="nav-links">
          <li>
            <a className="nav-link" href="#stages" onClick={e => handleNavScroll(e, 'stages')}>
              Join The Stage
            </a>
          </li>
          <li>
            <a className="nav-link" href="#faq" onClick={e => handleNavScroll(e, 'faq')}>
              FAQ
            </a>
          </li>
          <li>
            <a className="nav-link" href="#contact" onClick={e => handleNavScroll(e, 'contact')}>
              Get In Touch
            </a>
          </li>
          <li>
            <Link className="nav-link" href="/create">
              Create Your Stage
            </Link>
          </li>
        </ul>
        <div className="nav-actions">
          <button type="button" className="nav-pill nav-pill--ghost" onClick={onSignIn}>
            Sign In
          </button>
          <button
            type="button"
            className="nav-pill nav-pill--join"
            aria-label={LANDING_HERO.navCta}
            onClick={onScrollToStages}
          >
            <span className="nav-join-text">{LANDING_HERO.navCta}</span>
          </button>
        </div>
      </nav>

      <section
        className="hero"
        id="hero"
        style={
          {
            '--landing-hero-screen-top': LANDING_HERO_SCREEN_TOP_FRAC,
            '--landing-hero-screen-height': LANDING_HERO_SCREEN_HEIGHT_FRAC,
          } as React.CSSProperties
        }
      >
        <LandingHeroBackdrop />

        <div className="hero-content">
          <LandingHeroHeader />
          <LandingHeroCta
            onScrollToStages={onScrollToStages}
            initialCreatorStageCount={initialCreatorStageCount}
          />
        </div>

        <div className="hero-scroll" aria-hidden>
          <div className="hero-scroll-line" />
          <span className="hero-scroll-txt">scroll · the party's down here</span>
        </div>
      </section>

      <section className="stages-section" id="stages">
        <div className="stages-inner">
          <header className="stages-header">
            <p className="stages-eyebrow">Trending Now</p>
            <h2 className="stages-title">Join a stage</h2>
            <div className="stages-subrow">
              <p className="stages-subtitle">Or create your own</p>
              <Link href="/create" className="stages-create-btn">
                Create stage
              </Link>
            </div>
          </header>

          <FeaturedStagesChart
            variant="page"
            showHeader={false}
            showTabs
            showJoinAction
            joinLabel={LANDING_TRENDING_JOIN_LABEL}
            onSelect={onStageEnter}
            className="featured-stages-chart--landing"
          />
        </div>
      </section>

      <section
        className="section faq-section"
        id="faq"
        aria-labelledby="faq-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <div className="inner">
          <p className="section-label">AI goes to the festival</p>
          <h2 id="faq-heading" className="section-title">
            Questions?
          </h2>
          <div className="faq-list">
            {LANDING_FAQ.map((item, i) => (
              <article
                key={item.q}
                className="faq-item"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h3 className="faq-q" itemProp="name">
                  <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="faq-q-text">{item.q}</span>
                </h3>
                <div
                  className="faq-a"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p className="faq-a-inner" itemProp="text">
                    {item.a}
                  </p>
                </div>
              </article>
            ))}
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
              
              <h2 className="section-title" style={{ marginBottom: 0 }}>Say<br />hello.</h2>
              <p className="contact-blurb">
              Help build the festival of the future. Whether you make music, write code, or just love a good set in strange company - we want to hear from you.
              </p>
              <p className="contact-handle">
                <a className="contact-handle-link" href={TWITTER_URL} target="_blank" rel="noopener noreferrer">
                  → {TWITTER_HANDLE}
                </a>
              </p>
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
          <Image src={TRANSPARENT_LOGO_PATH} alt="Which Stage" width={818} height={138} style={{ height: 26, width: 'auto' }} />
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} {SITE_NAME}.</p>
      </footer>
    </div>
  );
}
