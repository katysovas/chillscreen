'use client';

import { useEffect } from 'react';
import { CHARACTER_STYLES } from './characterStyles';

let injected = false;

/** Inject character sprite CSS once — scoped to game routes, not the landing page. */
export function GameCharacterStyles() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.setAttribute('data-game-character-styles', '');
    el.textContent = CHARACTER_STYLES;
    document.head.appendChild(el);
    injected = true;
  }, []);
  return null;
}
