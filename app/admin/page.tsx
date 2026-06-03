'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CoverrVideo } from '@/lib/types';

function VideoCard({
  video: v,
  selected,
  onToggle,
}: {
  video: CoverrVideo;
  selected: boolean;
  onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  };

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden ring-2 transition group ${
        selected ? 'ring-emerald-500' : 'ring-transparent hover:ring-white/30'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={v.thumbnail}
        alt={v.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-0' : 'opacity-100'}`}
      />
      {/* Inline preview video */}
      <video
        ref={videoRef}
        src={v.urls.mp4_preview}
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold pointer-events-none">
          ✓
        </div>
      )}

      {/* Action buttons — visible on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={v.urls.mp4}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="px-1.5 py-0.5 rounded bg-black/70 text-white/80 hover:text-white text-[10px] font-medium"
          title="Open full video in new tab"
        >
          ↗
        </a>
      </div>

      {/* Bottom bar — click to toggle */}
      <div
        className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1.5 cursor-pointer"
        onClick={onToggle}
      >
        <p className="text-xs text-white truncate">{v.title}</p>
        <p className="text-[10px] text-white/40 font-mono">{v.id}</p>
      </div>
    </div>
  );
}

type Curated = { videos: string[]; audio: string[] };

function useAdmin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  const login = async (pw: string) => {
    const res = await fetch('/api/admin/curated', {
      headers: { 'x-admin-password': pw },
    });
    if (res.ok) { setAuthed(true); setPassword(pw); setError(''); }
    else setError('Wrong password');
  };

  return { password, authed, error, login };
}

export default function AdminPage() {
  const { password, authed, error, login } = useAdmin();
  const [pw, setPw] = useState('');
  const [curated, setCurated] = useState<Curated>({ videos: [], audio: [] });
  const [videos, setVideos] = useState<CoverrVideo[]>([]);
  const [query, setQuery] = useState('calm nature');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchCurated = useCallback(async () => {
    const res = await fetch('/api/admin/curated', {
      headers: { 'x-admin-password': password },
    });
    if (res.ok) setCurated(await res.json());
  }, [password]);

  useEffect(() => {
    if (authed) fetchCurated();
  }, [authed, fetchCurated]);

  const search = async () => {
    setLoading(true);
    const res = await fetch(`/api/coverr/videos?query=${encodeURIComponent(query)}&sort=popular&page_size=20&urls=true`);
    const data = await res.json();
    setVideos(data.hits ?? []);
    setLoading(false);
  };

  const toggleVideo = (id: string) => {
    setCurated(c => ({
      ...c,
      videos: c.videos.includes(id) ? c.videos.filter(v => v !== id) : [...c.videos, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/curated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(curated),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 w-80 flex flex-col gap-4">
          <h1 className="text-white text-xl font-bold text-center">Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login(pw)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={() => login(pw)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-medium transition"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="font-bold text-lg">🎬 Curated library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50">{curated.videos.length} videos selected</span>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search Coverr…"
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            onClick={search}
            disabled={loading}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {/* Curated IDs (raw, for reference) */}
        {curated.videos.length > 0 && (
          <details className="bg-gray-900 rounded-xl p-4">
            <summary className="text-sm text-white/60 cursor-pointer">Current video IDs ({curated.videos.length})</summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {curated.videos.map(id => (
                <span key={id} className="font-mono text-xs bg-gray-800 text-emerald-400 px-2 py-1 rounded">
                  {id}
                  <button onClick={() => toggleVideo(id)} className="ml-1.5 text-white/40 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </details>
        )}

        {/* Video grid */}
        {videos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map(v => {
              const selected = curated.videos.includes(v.id);
              return (
                <VideoCard
                  key={v.id}
                  video={v}
                  selected={selected}
                  onToggle={() => toggleVideo(v.id)}
                />
              );
            })}
          </div>
        )}

        {videos.length === 0 && (
          <div className="text-center text-white/30 py-20 text-sm">
            Search for videos above to start building your library
          </div>
        )}
      </div>
    </div>
  );
}
