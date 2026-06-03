'use client';
import { useEffect, useState, useCallback } from 'react';
import { CoverrVideo, CoverrCategory } from '@/lib/types';
import { fetchVideos, fetchCategoryVideos, fetchCategories } from '@/lib/coverr';
import { storage } from '@/lib/storage';
import ThumbnailCard from './ThumbnailCard';

interface Props {
  open: boolean;
  favorites: CoverrVideo[];
  onClose: () => void;
  onSelect: (v: CoverrVideo) => void;
  onFavorite: (v: CoverrVideo) => void;
}

const TABS = [
  { id: 'popular', label: '🔥 Popular' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'ocean', label: '🌊 Ocean' },
  { id: 'city', label: '🏙 City' },
  { id: 'winter', label: '❄️ Winter' },
  { id: 'favorites', label: '♥ Saved' },
];

export default function BrowseDrawer({ open, favorites, onClose, onSelect, onFavorite }: Props) {
  const [tab, setTab] = useState(() => storage.getCategory() ?? 'popular');
  const [videos, setVideos] = useState<CoverrVideo[]>([]);
  const [categories, setCategories] = useState<CoverrCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVideos = useCallback(async (tabId: string) => {
    if (tabId === 'favorites') { setVideos(favorites); return; }
    setLoading(true);
    try {
      const cat = categories.find(c => c.slug === tabId);
      const vids = cat
        ? await fetchCategoryVideos(cat.id)
        : await fetchVideos(tabId === 'popular' ? 'calm nature' : tabId);
      setVideos(vids);
    } finally {
      setLoading(false);
    }
  }, [categories, favorites]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    loadVideos(tab);
  }, [open, tab, loadVideos]);

  const handleTab = (id: string) => {
    setTab(id);
    storage.setCategory(id);
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdrop}
      />

      {/* Drawer */}
      <div
        className={`
          fixed z-50 bg-black/90 backdrop-blur-md transition-transform duration-300
          inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:w-96 md:h-full md:rounded-none
          ${open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full'
          }
        `}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-white font-semibold text-base">Browse scenes</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="overflow-y-auto h-[calc(100%-8rem)] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              Loading…
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              {tab === 'favorites' ? 'No saved scenes yet' : 'No scenes found'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {videos.map(v => (
                <ThumbnailCard
                  key={v.id}
                  video={v}
                  isFavorite={favorites.some(f => f.id === v.id)}
                  onSelect={onSelect}
                  onFavorite={onFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
