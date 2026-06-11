const INTRO_KEY = 'festie_intro_seen';
const TAB_EXIT_KEY = 'festie_life_tab_exit_shown';

export function markFestieLifeIntroSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTRO_KEY, 'true');
  } catch {
    /* ignore */
  }
}

/** Once per session — show Life modal when user leaves the tab. */
export function shouldShowFestieLifeOnTabExit(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(TAB_EXIT_KEY) !== 'true';
  } catch {
    return false;
  }
}

export function markFestieLifeTabExitShown(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TAB_EXIT_KEY, 'true');
  } catch {
    /* ignore */
  }
}
