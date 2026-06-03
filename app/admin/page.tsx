'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CoverrVideo, CoverrAudio } from '@/lib/types';

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video: v, selected, onToggle }: {
  video: CoverrVideo; selected: boolean; onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden ring-2 transition group ${
        selected ? 'ring-emerald-500' : 'ring-transparent hover:ring-white/30'
      }`}
      onMouseEnter={() => { setHovered(true); videoRef.current?.play().catch(() => {}); }}
      onMouseLeave={() => { setHovered(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.thumbnail} alt={v.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-0' : 'opacity-100'}`} />
      <video ref={videoRef} src={v.urls.mp4_preview} muted loop playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold pointer-events-none">✓</div>
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={v.urls.mp4} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="px-1.5 py-0.5 rounded bg-black/70 text-white/80 hover:text-white text-[10px]" title="Open full video">↗</a>
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1.5 cursor-pointer" onClick={onToggle}>
        <p className="text-xs text-white truncate">{v.title}</p>
        <p className="text-[10px] text-white/40 font-mono">{v.id}</p>
      </div>
    </div>
  );
}

// ─── Audio card ───────────────────────────────────────────────────────────────

function AudioCard({ track: a, selected, onToggle }: {
  track: CoverrAudio; selected: boolean; onToggle: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return (
    <div
      onClick={onToggle}
      className={`relative rounded-xl p-4 cursor-pointer ring-2 transition flex flex-col gap-3 bg-gray-900 ${
        selected ? 'ring-emerald-500' : 'ring-transparent hover:ring-white/20'
      }`}
    >
      <audio ref={audioRef} src={a.urls.preview} loop preload="none" onEnded={() => setPlaying(false)} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{a.name}</p>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">{a.id}</p>
        </div>
        {selected && <span className="text-emerald-400 text-sm shrink-0">✓</span>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {a.moods?.slice(0, 3).map(m => (
          <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{m}</span>
        ))}
        {a.isPremium && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Premium</span>}
      </div>

      <button
        onClick={togglePlay}
        className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
          playing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {playing ? '⏸ Pause' : '▶ Preview'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Curated = { videos: string[]; audio: string[] };
type Tab = 'videos' | 'audio';

export default function AdminPage() {
  const [pw, setPw] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [curated, setCurated] = useState<Curated>({ videos: [], audio: [] });
  const [tab, setTab] = useState<Tab>('videos');
  const [videos, setVideos] = useState<CoverrVideo[]>([]);
  const [audios, setAudios] = useState<CoverrAudio[]>([]);
  const [query, setQuery] = useState('calm nature');
  const [audioQuery, setAudioQuery] = useState('ambient');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const login = async (p: string) => {
    const res = await fetch('/api/admin/curated', { headers: { 'x-admin-password': p } });
    if (res.ok) { setAuthed(true); setPassword(p); setAuthError(''); setCurated(await res.json()); }
    else setAuthError('Wrong password');
  };

  const fetchCurated = useCallback(async () => {
    const res = await fetch('/api/admin/curated', { headers: { 'x-admin-password': password } });
    if (res.ok) setCurated(await res.json());
  }, [password]);

  useEffect(() => { if (authed) fetchCurated(); }, [authed, fetchCurated]);

  const searchVideos = async () => {
    setLoading(true);
    const res = await fetch(`/api/coverr/videos?query=${encodeURIComponent(query)}&sort=popular&page_size=20&urls=true`);
    setVideos((await res.json()).hits ?? []);
    setLoading(false);
  };

  const searchAudio = async () => {
    setLoading(true);
    const res = await fetch(`/api/coverr/audios?query=${encodeURIComponent(audioQuery)}&sort=popular&page_size=20`);
    setAudios((await res.json()).hits ?? []);
    setLoading(false);
  };

  const toggleVideo = (id: string) => setCurated(c => ({
    ...c, videos: c.videos.includes(id) ? c.videos.filter(v => v !== id) : [...c.videos, id],
  }));

  const toggleAudio = (id: string) => setCurated(c => ({
    ...c, audio: c.audio.includes(id) ? c.audio.filter(a => a !== id) : [...c.audio, id],
  }));

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/curated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(curated),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 w-80 flex flex-col gap-4">
          <h1 className="text-white text-xl font-bold text-center">Admin</h1>
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login(pw)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button onClick={() => login(pw)} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-medium transition">Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">🎬 Curated library</h1>
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {(['videos', 'audio'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition capitalize ${tab === t ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                {t} {t === 'videos' ? `(${curated.videos.length})` : `(${curated.audio.length})`}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Videos tab ── */}
        {tab === 'videos' && (
          <>
            <div className="flex gap-2">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchVideos()} placeholder="Search videos…"
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              <button onClick={searchVideos} disabled={loading}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition disabled:opacity-50">
                {loading ? '…' : 'Search'}
              </button>
            </div>

            {curated.videos.length > 0 && (
              <details className="bg-gray-900 rounded-xl p-4">
                <summary className="text-sm text-white/60 cursor-pointer">Selected video IDs ({curated.videos.length})</summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {curated.videos.map(id => (
                    <span key={id} className="font-mono text-xs bg-gray-800 text-emerald-400 px-2 py-1 rounded">
                      {id}<button onClick={() => toggleVideo(id)} className="ml-1.5 text-white/40 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </details>
            )}

            {videos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {videos.map(v => (
                  <VideoCard key={v.id} video={v} selected={curated.videos.includes(v.id)} onToggle={() => toggleVideo(v.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center text-white/30 py-20 text-sm">Search for videos to start building your library</div>
            )}
          </>
        )}

        {/* ── Audio tab ── */}
        {tab === 'audio' && (
          <>
            <div className="flex gap-2">
              <input type="text" value={audioQuery} onChange={e => setAudioQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAudio()} placeholder="Search audio…"
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              <button onClick={searchAudio} disabled={loading}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition disabled:opacity-50">
                {loading ? '…' : 'Search'}
              </button>
            </div>

            {curated.audio.length > 0 && (
              <details className="bg-gray-900 rounded-xl p-4">
                <summary className="text-sm text-white/60 cursor-pointer">Selected audio IDs ({curated.audio.length})</summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {curated.audio.map(id => (
                    <span key={id} className="font-mono text-xs bg-gray-800 text-emerald-400 px-2 py-1 rounded">
                      {id}<button onClick={() => toggleAudio(id)} className="ml-1.5 text-white/40 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </details>
            )}

            {audios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {audios.map(a => (
                  <AudioCard key={a.id} track={a} selected={curated.audio.includes(a.id)} onToggle={() => toggleAudio(a.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center text-white/30 py-20 text-sm">Search for audio tracks to add ambient sound</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
