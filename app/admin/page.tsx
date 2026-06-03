'use client';
import { useState, useEffect, useRef } from 'react';
import { CoverrVideo, CoverrAudio, CuratedCategory } from '@/lib/types';

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video: v, selected, onToggle }: {
  video: CoverrVideo; selected: boolean; onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden ring-2 transition group cursor-pointer ${
        selected ? 'ring-emerald-500' : 'ring-transparent hover:ring-white/30'
      }`}
      onMouseEnter={() => { setHovered(true); videoRef.current?.play().catch(() => {}); }}
      onMouseLeave={() => { setHovered(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
      onClick={onToggle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.thumbnail} alt={v.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-0' : 'opacity-100'}`} />
      <video ref={videoRef} src={v.urls.mp4_preview} muted loop playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold pointer-events-none">✓</div>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <a href={v.urls.mp4} target="_blank" rel="noopener noreferrer"
          className="px-1.5 py-0.5 rounded bg-black/70 text-white/80 hover:text-white text-[10px]">↗</a>
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1.5 pointer-events-none">
        <p className="text-xs text-white truncate">{v.title}</p>
        <p className="text-[10px] text-white/50 font-mono">{v.id}</p>
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
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return (
    <div onClick={onToggle}
      className={`rounded-xl p-4 cursor-pointer ring-2 transition flex flex-col gap-3 bg-gray-900 ${
        selected ? 'ring-emerald-500' : 'ring-transparent hover:ring-white/20'
      }`}
    >
      <audio ref={audioRef} src={a.urls.preview} loop preload="none" onEnded={() => setPlaying(false)} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{a.name}</p>
          <p className="text-[10px] text-white/40 font-mono">{a.id}</p>
        </div>
        {selected && <span className="text-emerald-400 text-sm shrink-0">✓</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {a.moods?.slice(0, 3).map(m => (
          <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{m}</span>
        ))}
        {a.isPremium && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Premium</span>}
      </div>
      <button onClick={e => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
      }} className={`w-full py-2 rounded-lg text-sm font-medium transition ${playing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 hover:bg-white/20'}`}>
        {playing ? '⏸ Pause' : '▶ Preview'}
      </button>
    </div>
  );
}

// ─── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel({ curated, onClose }: {
  curated: Curated;
  onClose: () => void;
}) {
  const json = JSON.stringify(curated, null, 2);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl flex flex-col gap-4 p-6 max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Export JSON</h2>
            <p className="text-white/40 text-sm mt-0.5">Copy → paste into <code className="text-emerald-400">data/curated.json</code> → commit &amp; push</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>
        <textarea
          readOnly
          value={json}
          className="flex-1 bg-gray-800 text-emerald-300 font-mono text-xs rounded-xl p-4 outline-none resize-none overflow-y-auto min-h-[300px]"
        />
        <button onClick={copy} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition">
          {copied ? '✓ Copied to clipboard!' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  );
}

// ─── Categories tab ───────────────────────────────────────────────────────────

const EMOJIS = ['🌿', '🌊', '🏔', '🌇', '❄️', '🌸', '🌅', '🔥', '🌙', '🌦', '🎋', '🏜', '🌲', '🌁', '🐚', '🏙', '🌃', '🌌'];

function CategoriesTab({ curated, setCurated }: {
  curated: Curated;
  setCurated: React.Dispatch<React.SetStateAction<Curated>>;
}) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    curated.categories[0]?.id ?? null
  );
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🌿');
  const [catQuery, setCatQuery] = useState('');
  const [catResults, setCatResults] = useState<CoverrVideo[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [manualId, setManualId] = useState('');
  const [catVideoDetails, setCatVideoDetails] = useState<Record<string, CoverrVideo>>({});

  const selectedCat = curated.categories.find(c => c.id === selectedCatId);

  const createCategory = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setCurated(c => ({ ...c, categories: [...c.categories, { id, name: newName.trim(), emoji: newEmoji, videoIds: [] }] }));
    setNewName(''); setCreating(false); setSelectedCatId(id);
  };

  const deleteCategory = (id: string) => {
    setCurated(c => ({ ...c, categories: c.categories.filter(cat => cat.id !== id) }));
    if (selectedCatId === id) setSelectedCatId(curated.categories.find(c => c.id !== id)?.id ?? null);
  };

  const updateCategory = (id: string, patch: Partial<CuratedCategory>) => {
    setCurated(c => ({ ...c, categories: c.categories.map(cat => cat.id === id ? { ...cat, ...patch } : cat) }));
  };

  const toggleVideoInCat = (videoId: string) => {
    if (!selectedCatId || !selectedCat) return;
    const next = selectedCat.videoIds.includes(videoId)
      ? selectedCat.videoIds.filter(id => id !== videoId)
      : [...selectedCat.videoIds, videoId];
    updateCategory(selectedCatId, { videoIds: next });
  };

  const addManualId = () => {
    const id = manualId.trim();
    if (!id || !selectedCatId || !selectedCat) return;
    if (!selectedCat.videoIds.includes(id)) {
      updateCategory(selectedCatId, { videoIds: [...selectedCat.videoIds, id] });
    }
    setManualId('');
  };

  const searchCatVideos = async () => {
    if (!catQuery.trim()) return;
    setCatLoading(true);
    const res = await fetch(`/api/coverr/videos?query=${encodeURIComponent(catQuery)}&sort=popular&page_size=24&urls=true`);
    const results: CoverrVideo[] = (await res.json()).hits ?? [];
    setCatResults(results);
    // Cache these details for the "current" panel
    setCatVideoDetails(prev => ({ ...prev, ...Object.fromEntries(results.map(v => [v.id, v])) }));
    setCatLoading(false);
  };

  // Fetch details for IDs already in category that we haven't cached yet
  useEffect(() => {
    if (!selectedCat) return;
    const missing = selectedCat.videoIds.filter(id => !catVideoDetails[id]);
    if (!missing.length) return;
    missing.forEach(id => {
      fetch(`/api/coverr/videos/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(v => { if (v) setCatVideoDetails(prev => ({ ...prev, [id]: v })); });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatId, selectedCat?.videoIds.length]);

  return (
    <div className="flex gap-6">
      {/* Left: category list */}
      <div className="w-52 shrink-0 flex flex-col gap-2">
        <button onClick={() => setCreating(true)}
          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition">
          + New category
        </button>

        {creating && (
          <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`w-7 h-7 rounded text-base transition ${newEmoji === e ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'}`}>{e}</button>
              ))}
            </div>
            <input autoFocus type="text" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Category name"
              className="bg-gray-800 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500 text-white" />
            <div className="flex gap-2">
              <button onClick={createCategory} className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition">Create</button>
              <button onClick={() => setCreating(false)} className="flex-1 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs transition">Cancel</button>
            </div>
          </div>
        )}

        {curated.categories.map(cat => (
          <div key={cat.id} onClick={() => setSelectedCatId(cat.id)}
            className={`rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 group transition ${
              selectedCatId === cat.id ? 'bg-white/15 ring-1 ring-white/30' : 'bg-gray-900 hover:bg-gray-800'
            }`}>
            <span className="text-lg">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{cat.name}</p>
              <p className="text-[10px] text-white/40">{cat.videoIds.length} video{cat.videoIds.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition text-sm">×</button>
          </div>
        ))}
        {curated.categories.length === 0 && !creating && (
          <p className="text-center text-white/30 text-xs py-6">No categories yet</p>
        )}
      </div>

      {/* Right: editor */}
      {selectedCat ? (
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Name / emoji */}
          <div className="flex items-center gap-3">
            <select value={selectedCat.emoji} onChange={e => updateCategory(selectedCat.id, { emoji: e.target.value })}
              className="bg-gray-900 rounded-lg px-2 py-1.5 text-lg outline-none">
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="text" value={selectedCat.name}
              onChange={e => updateCategory(selectedCat.id, { name: e.target.value })}
              className="bg-gray-900 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-emerald-500 text-white max-w-xs" />
            <span className="text-white/30 text-sm">{selectedCat.videoIds.length} videos</span>
          </div>

          {/* Add by ID */}
          <div className="flex gap-2">
            <input type="text" value={manualId} onChange={e => setManualId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManualId()}
              placeholder="Paste a Coverr video ID and press Enter…"
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
            <button onClick={addManualId}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition whitespace-nowrap">
              Add ID
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <input type="text" value={catQuery} onChange={e => setCatQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCatVideos()} placeholder="Or search Coverr to browse…"
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            <button onClick={searchCatVideos} disabled={catLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {catLoading ? '…' : 'Search'}
            </button>
          </div>

          {/* Search results */}
          {catResults.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Click a video to add / remove it from this category</p>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {catResults.map(v => (
                  <VideoCard key={v.id} video={v} selected={selectedCat.videoIds.includes(v.id)} onToggle={() => toggleVideoInCat(v.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Current videos */}
          {selectedCat.videoIds.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Videos in this category — click to remove</p>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {selectedCat.videoIds.map(id => {
                  const v = catVideoDetails[id];
                  if (!v) return (
                    <div key={id} className="aspect-video rounded-xl bg-gray-800 flex flex-col items-center justify-center gap-1 cursor-pointer hover:ring-1 hover:ring-red-500/50 transition"
                      onClick={() => toggleVideoInCat(id)}>
                      <span className="font-mono text-[10px] text-white/30 px-2 text-center break-all">{id}</span>
                      <span className="text-[10px] text-white/20">loading…</span>
                    </div>
                  );
                  return <VideoCard key={id} video={v} selected onToggle={() => toggleVideoInCat(id)} />;
                })}
              </div>
            </div>
          )}

          {catResults.length === 0 && selectedCat.videoIds.length === 0 && (
            <p className="text-center text-white/30 py-16 text-sm">Paste a video ID above, or search Coverr to find videos</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
          Select a category to edit it
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Curated = { videos: string[]; audio: string[]; categories: CuratedCategory[] };
type Tab = 'categories' | 'videos' | 'audio';

export default function AdminPage() {
  const [pw, setPw] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [curated, setCurated] = useState<Curated>({ videos: [], audio: [], categories: [] });
  const [tab, setTab] = useState<Tab>('categories');
  const [videos, setVideos] = useState<CoverrVideo[]>([]);
  const [audios, setAudios] = useState<CoverrAudio[]>([]);
  const [query, setQuery] = useState('calm nature');
  const [audioQuery, setAudioQuery] = useState('ambient');
  const [loading, setLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const login = async (p: string) => {
    const res = await fetch('/api/admin/curated', { headers: { 'x-admin-password': p } });
    if (res.ok) {
      const data = await res.json();
      setAuthed(true); setPassword(p); setAuthError('');
      setCurated({ videos: data.videos ?? [], audio: data.audio ?? [], categories: data.categories ?? [] });
    } else setAuthError('Wrong password');
  };

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

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 w-80 flex flex-col gap-4">
          <h1 className="text-white text-xl font-bold text-center">Admin</h1>
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login(pw)}
            className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button onClick={() => login(pw)} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-medium transition">Sign in</button>
        </div>
      </div>
    );
  }

  // password is read on login but not needed for read-only admin
  void password;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showExport && <ExportPanel curated={curated} onClose={() => setShowExport(false)} />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">🎬 Library</h1>
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {([
              { id: 'categories', label: `Categories (${curated.categories.length})` },
              { id: 'videos', label: `Videos (${curated.videos.length})` },
              { id: 'audio', label: `Audio (${curated.audio.length})` },
            ] as { id: Tab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${tab === t.id ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowExport(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition">
          Export JSON →
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">

        {tab === 'categories' && (
          <CategoriesTab curated={curated} setCurated={setCurated} />
        )}

        {tab === 'videos' && (
          <>
            <p className="text-white/40 text-sm">These are the fallback videos used on first load when no category is selected. Video IDs can also be added directly to categories.</p>
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
              <div className="text-center text-white/30 py-20 text-sm">Search for videos above</div>
            )}
          </>
        )}

        {tab === 'audio' && (
          <>
            <p className="text-white/40 text-sm">Ambient audio tracks used as background sound.</p>
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
              <div className="text-center text-white/30 py-20 text-sm">Search for audio tracks above</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
