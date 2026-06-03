import { CoverrVideo, CoverrAudio } from './types';

function get<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
  catch { return null; }
}
function set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const storage = {
  getSelected: () => get<CoverrVideo>('cs:selected'),
  setSelected: (v: CoverrVideo) => set('cs:selected', v),
  getAudio: () => get<CoverrAudio>('cs:audio'),
  setAudio: (a: CoverrAudio) => set('cs:audio', a),
  isAudioOn: () => localStorage.getItem('cs:audio-on') === 'true',
  setAudioOn: (on: boolean) => localStorage.setItem('cs:audio-on', String(on)),
  getFavorites: () => get<CoverrVideo[]>('cs:favorites') ?? [],
  toggleFavorite: (v: CoverrVideo) => {
    const favs = storage.getFavorites();
    const next = favs.some(f => f.id === v.id)
      ? favs.filter(f => f.id !== v.id)
      : [...favs, v];
    set('cs:favorites', next);
    return next.some(f => f.id === v.id);
  },
  getCategory: () => localStorage.getItem('cs:category'),
  setCategory: (slug: string) => localStorage.setItem('cs:category', slug),
};
