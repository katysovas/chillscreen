'use client';

import { useId } from 'react';
import type { StageSocialLinkKind } from '@/lib/stages/socialLinks';

type Props = {
  kind: StageSocialLinkKind | 'youtube-channel';
  size?: number;
};

export function StageSocialLinkIcon({ kind, size = 18 }: Props) {
  const igGradId = useId();
  const iconKind = kind === 'youtube-channel' ? 'youtube' : kind;

  switch (iconKind) {
    case 'youtube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <path
            fill="#FF0033"
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
          />
          <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'x':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <defs>
            <linearGradient id={igGradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f9ce34" />
              <stop offset="50%" stopColor="#ee2a7b" />
              <stop offset="100%" stopColor="#6228d7" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="6" fill={`url(#${igGradId})`} />
          <circle cx="12" cy="12" r="4.25" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.4" cy="6.6" r="1.2" fill="#fff" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <path
            fill="#FF5500"
            d="M17.5 10.2c-.3 0-.6.1-.8.2-.2-2.1-2-3.8-4.2-3.8-1.2 0-2.3.5-3.1 1.3-.2.2-.2.5 0 .7l.2.2c.2.2.5.2.7 0 .6-.6 1.4-1 2.2-1 1.6 0 2.9 1.2 3.1 2.8-.4.2-.7.6-.7 1.1v.2c0 .7.5 1.2 1.2 1.2H18c1.1 0 2-.9 2-2s-.9-2-2-2h-.5zM4.5 12.8c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5v2.4c0 .3.2.5.5.5s.5-.2.5-.5v-2.4c0-.3-.2-.5-.5-.5zm2-.4c-.3 0-.5.2-.5.5v2.8c0 .3.2.5.5.5s.5-.2.5-.5v-2.8c0-.3-.2-.5-.5-.5zm2-.6c-.3 0-.5.2-.5.5v3.4c0 .3.2.5.5.5s.5-.2.5-.5v-3.4c0-.3-.2-.5-.5-.5z"
          />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <path
            fill="#fff"
            d="M16.6 5.82c.92.66 2.04 1.05 3.25 1.05V9.4c-1.18 0-2.28-.35-3.2-.95v6.78c0 3.45-2.8 6.25-6.25 6.25S4.15 18.68 4.15 15.23c0-3.45 2.8-6.25 6.25-6.25.34 0 .67.03 1 .08v3.45a3.2 3.2 0 0 0-1-.16c-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V2.25h2.8c.08.98.5 1.86 1.2 2.57z"
          />
        </svg>
      );
    case 'patreon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <path
            fill="#FF424D"
            d="M15.386 2.25H18v19.5h-2.614V2.25zM9.614 6.863A5.137 5.137 0 1 0 9.614 17.14a5.137 5.137 0 0 0 0-10.277z"
          />
        </svg>
      );
    case 'website':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.72)" strokeWidth="1.6" />
          <path d="M3 12h18M12 3c2.8 3.1 2.8 14.9 0 18M12 3c-2.8 3.1-2.8 14.9 0 18" stroke="rgba(255,255,255,0.72)" strokeWidth="1.4" />
        </svg>
      );
  }
}
