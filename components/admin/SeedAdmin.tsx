'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GENERAL_SUBREDDITS,
  SEED_STAGE_META,
  type SeedPoolTarget,
} from '@/lib/seedAdmin';
import type { RedditFeedPost } from '@/lib/redditFeed';
import type { SeedsFile } from '@/lib/seedsFile';

const PAGE_STYLE: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '32px 24px 80px',
  fontFamily: 'system-ui, sans-serif',
};

const CARD_STYLE: React.CSSProperties = {
  background: '#181c26',
  border: '1px solid #2a3040',
  borderRadius: 10,
  padding: 16,
};

const BUTTON_STYLE: React.CSSProperties = {
  background: '#2d6cdf',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const LINK_STYLE: React.CSSProperties = {
  color: '#8ab4f8',
  fontSize: 13,
  textDecoration: 'none',
};

type PoolKey = string;

function poolKey(target: SeedPoolTarget): PoolKey {
  if (target.scope === 'general') return `general:${target.kind}`;
  return `stage:${target.slug}:${target.kind}`;
}

function parsePoolKey(key: PoolKey): SeedPoolTarget {
  if (key.startsWith('general:')) {
    const kind = key.endsWith('fallback') ? 'fallback' : 'generated';
    return { scope: 'general', kind };
  }
  const [, slug, kind] = key.split(':');
  return {
    scope: 'stage',
    slug: slug!,
    kind: kind === 'fallback' ? 'fallback' : 'generated',
  };
}

function poolLabel(target: SeedPoolTarget): string {
  if (target.scope === 'general') {
    return target.kind === 'generated' ? 'General · generated' : 'General · fallback';
  }
  const label = SEED_STAGE_META.find(s => s.slug === target.slug)?.label ?? target.slug;
  return `${label} · ${target.kind}`;
}

function getPoolLines(file: SeedsFile, target: SeedPoolTarget): string[] {
  if (target.scope === 'general') return [...file[target.kind]];
  return [...(file.stages[target.slug]?.[target.kind] ?? [])];
}

function setPoolLines(file: SeedsFile, target: SeedPoolTarget, lines: string[]): SeedsFile {
  const next = {
    ...file,
    generated: [...file.generated],
    fallback: [...file.fallback],
    stages: { ...file.stages },
  };
  if (target.scope === 'general') {
    next[target.kind] = lines;
    return next;
  }
  next.stages[target.slug] = {
    ...next.stages[target.slug],
    [target.kind]: lines,
  };
  return next;
}

export function SeedAdmin() {
  const [file, setFile] = useState<SeedsFile | null>(null);
  const [activePool, setActivePool] = useState<PoolKey>('general:generated');
  const [search, setSearch] = useState('');
  const [manualSeed, setManualSeed] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [subreddit, setSubreddit] = useState('festivals');
  const [redditPosts, setRedditPosts] = useState<RedditFeedPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [redditOAuth, setRedditOAuth] = useState<boolean | null>(null);
  const [redditOAuthError, setRedditOAuthError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string[]>([]);

  const target = useMemo(() => parsePoolKey(activePool), [activePool]);

  const loadSeeds = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/seeds');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setFile(data as SeedsFile);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void loadSeeds();
  }, [loadSeeds]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/reddit-feed?status=1');
        const data = await res.json();
        if (!res.ok) return;
        const oauth = data.oauth as { configured?: boolean; ok?: boolean; error?: string };
        setRedditOAuth(Boolean(oauth?.configured && oauth?.ok));
        setRedditOAuthError(oauth?.configured && !oauth?.ok ? (oauth.error ?? 'OAuth failed') : null);
      } catch {
        /* ignore status probe */
      }
    })();
  }, []);

  const poolLines = useMemo(() => {
    if (!file) return [];
    return getPoolLines(file, target);
  }, [file, target]);

  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return poolLines.map((text, index) => ({ text, index }));
    return poolLines
      .map((text, index) => ({ text, index }))
      .filter(({ text }) => text.toLowerCase().includes(q));
  }, [poolLines, search]);

  const updatePool = (lines: string[]) => {
    if (!file) return;
    setFile(setPoolLines(file, target, lines));
    setSaveStatus(null);
  };

  const deleteSeed = (index: number) => {
    updatePool(poolLines.filter((_, i) => i !== index));
  };

  const addManualSeed = () => {
    const line = manualSeed.trim();
    if (!line) return;
    if (poolLines.some(s => s.toLowerCase() === line.toLowerCase())) return;
    updatePool([line, ...poolLines]);
    setManualSeed('');
  };

  const addGeneratedToPool = () => {
    if (generatedPreview.length === 0) return;
    const existing = new Set(poolLines.map(s => s.toLowerCase()));
    const fresh = generatedPreview.filter(s => !existing.has(s.toLowerCase()));
    updatePool([...fresh, ...poolLines]);
    setGeneratedPreview([]);
    setSelectedPostIds(new Set());
  };

  const saveFile = async () => {
    if (!file) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/admin/seeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setFile(data.file as SeedsFile);
      setSaveStatus(`Saved ${new Date(data.updatedAt).toLocaleString()}`);
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const fetchReddit = async (daily: boolean) => {
    setRedditLoading(true);
    setRedditError(null);
    setGeneratedPreview([]);
    try {
      const params = new URLSearchParams();
      if (daily) {
        params.set('daily', '1');
        params.set('scope', target.scope);
        params.set('kind', target.kind);
        if (target.scope === 'stage') params.set('slug', target.slug);
      } else {
        params.set('sub', subreddit);
      }
      const res = await fetch(`/api/admin/reddit-feed?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setRedditPosts(data.posts as RedditFeedPost[]);
      setRedditOAuth(typeof data.oauth === 'boolean' ? data.oauth : null);
      setSelectedPostIds(new Set());
    } catch (err) {
      setRedditError(err instanceof Error ? err.message : 'Reddit fetch failed');
    } finally {
      setRedditLoading(false);
    }
  };

  const togglePost = (id: string) => {
    setSelectedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateSeeds = async () => {
    const selected = redditPosts.filter(p => selectedPostIds.has(p.id));
    if (selected.length === 0) return;
    setGenerating(true);
    setRedditError(null);
    try {
      const res = await fetch('/api/admin/generate-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          topics: selected.map(p => ({
            title: p.title,
            subreddit: p.subreddit,
            score: p.score,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setGeneratedPreview(data.seeds as string[]);
    } catch (err) {
      setRedditError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const poolOptions: { key: PoolKey; label: string }[] = [
    { key: 'general:generated', label: 'General · generated' },
    { key: 'general:fallback', label: 'General · fallback' },
    ...SEED_STAGE_META.flatMap(meta => [
      { key: `stage:${meta.slug}:generated`, label: `${meta.label} · generated` },
      { key: `stage:${meta.slug}:fallback`, label: `${meta.label} · fallback` },
    ]),
  ];

  return (
    <div style={PAGE_STYLE}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Seed admin</h1>
        <p style={{ margin: 0, color: '#9aa0a6', fontSize: 14 }}>
          Password-protected · writes to <code style={{ color: '#8ab4f8' }}>chat_seeds</code> (Neon)
          {file?.updatedAt && (
            <span> · last saved {new Date(file.updatedAt).toLocaleString()}</span>
          )}
        </p>
        <nav style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/admin/stage-playlists" style={LINK_STYLE}>Stage playlists</a>
          <a href="/admin/npc-generator" style={LINK_STYLE}>NPC generator</a>
          <a href="/admin/seeds" style={{ ...LINK_STYLE, fontWeight: 600 }}>Seeds</a>
        </nav>
      </header>

      {loadError && (
        <div style={{ ...CARD_STYLE, borderColor: '#a13a3a', color: '#ff9d9d', marginBottom: 16 }}>
          {loadError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {poolOptions.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => { setActivePool(opt.key); setSearch(''); }}
            style={{
              ...BUTTON_STYLE,
              background: activePool === opt.key ? '#2d6cdf' : '#3a4154',
              fontSize: 12,
              padding: '8px 12px',
            }}
          >
            {opt.label}
            {file && (
              <span style={{ opacity: 0.6, marginLeft: 6 }}>
                ({getPoolLines(file, parsePoolKey(opt.key)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Seed list */}
        <section style={CARD_STYLE}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>{poolLabel(target)}</h2>
            <button
              type="button"
              onClick={() => void saveFile()}
              disabled={saving || !file}
              style={{ ...BUTTON_STYLE, background: '#1f8a5b', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Save to file'}
            </button>
          </div>

          <input
            type="search"
            placeholder="Search seeds…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Add seed manually…"
              value={manualSeed}
              onChange={e => setManualSeed(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addManualSeed(); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="button" onClick={addManualSeed} style={BUTTON_STYLE}>Add</button>
          </div>

          {saveStatus && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#9aa0a6' }}>{saveStatus}</p>
          )}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 480, overflow: 'auto' }}>
            {filteredLines.length === 0 && (
              <li style={{ color: '#6b7280', fontSize: 13 }}>No seeds in this pool.</li>
            )}
            {filteredLines.map(({ text, index }) => (
              <li
                key={`${index}-${text.slice(0, 24)}`}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid #2a3040',
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ flex: 1 }}>{text}</span>
                <button
                  type="button"
                  onClick={() => deleteSeed(index)}
                  style={{ ...BUTTON_STYLE, background: '#5c2b2b', padding: '4px 10px', fontSize: 12 }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Reddit + generate */}
        <section style={CARD_STYLE}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Reddit topics → seeds</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9aa0a6', lineHeight: 1.5 }}>
            Target pool: <strong>{poolLabel(target)}</strong>.
            Reddit blocks anonymous JSON. Add <code style={{ color: '#8ab4f8' }}>REDDIT_CLIENT_ID</code> and{' '}
            <code style={{ color: '#8ab4f8' }}>REDDIT_CLIENT_SECRET</code> to <code style={{ color: '#8ab4f8' }}>.env.local</code>{' '}
            (<a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noreferrer" style={{ color: '#8ab4f8' }}>reddit.com/prefs/apps</a>, script or web app)
            and restart <code style={{ color: '#8ab4f8' }}>npm run dev</code>. Without OAuth, RSS is used (rate-limited).
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <input
              type="text"
              value={subreddit}
              onChange={e => setSubreddit(e.target.value)}
              placeholder="subreddit"
              style={{ ...inputStyle, width: 140 }}
            />
            <button
              type="button"
              onClick={() => void fetchReddit(false)}
              disabled={redditLoading}
              style={{ ...BUTTON_STYLE, opacity: redditLoading ? 0.6 : 1 }}
            >
              Fetch hot
            </button>
            <button
              type="button"
              onClick={() => void fetchReddit(true)}
              disabled={redditLoading}
              style={{ ...BUTTON_STYLE, background: '#6b4fd8', opacity: redditLoading ? 0.6 : 1 }}
            >
              Daily pull
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {GENERAL_SUBREDDITS.map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubreddit(sub)}
                style={{
                  ...BUTTON_STYLE,
                  background: '#3a4154',
                  fontSize: 11,
                  padding: '4px 10px',
                }}
              >
                r/{sub}
              </button>
            ))}
          </div>

          {redditOAuth === true && (
            <p style={{ color: '#7dcea0', fontSize: 12, margin: '0 0 12px' }}>Reddit OAuth connected.</p>
          )}
          {redditOAuth === false && redditOAuthError && (
            <p style={{ color: '#ff9d9d', fontSize: 12, margin: '0 0 12px', lineHeight: 1.45 }}>
              Reddit OAuth misconfigured: {redditOAuthError}
            </p>
          )}
          {redditOAuth === false && !redditOAuthError && (
            <p style={{ color: '#f0c674', fontSize: 12, margin: '0 0 12px' }}>
              No Reddit OAuth — using RSS fallback (slower, rate-limited).
            </p>
          )}
          {redditError && (
            <p style={{ color: '#ff9d9d', fontSize: 13, margin: '0 0 12px', lineHeight: 1.45 }}>{redditError}</p>
          )}

          <div style={{ maxHeight: 280, overflow: 'auto', marginBottom: 12 }}>
            {redditPosts.map(post => (
              <label
                key={post.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 0',
                  borderBottom: '1px solid #2a3040',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPostIds.has(post.id)}
                  onChange={() => togglePost(post.id)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <strong style={{ fontWeight: 600 }}>{post.title}</strong>
                  <span style={{ display: 'block', color: '#9aa0a6', fontSize: 11, marginTop: 2 }}>
                    r/{post.subreddit} · {post.score} pts · {post.numComments} comments
                  </span>
                </span>
              </label>
            ))}
            {redditPosts.length === 0 && !redditLoading && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Fetch posts to pick topics.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void generateSeeds()}
            disabled={generating || selectedPostIds.size === 0}
            style={{ ...BUTTON_STYLE, opacity: generating || selectedPostIds.size === 0 ? 0.5 : 1 }}
          >
            {generating ? 'Generating…' : `Generate seeds (${selectedPostIds.size} selected)`}
          </button>

          {generatedPreview.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #2a3040' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Preview</h3>
              <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, lineHeight: 1.45 }}>
                {generatedPreview.map(seed => (
                  <li key={seed} style={{ marginBottom: 6 }}>{seed}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addGeneratedToPool}
                style={{ ...BUTTON_STYLE, background: '#1f8a5b' }}
              >
                Add to {poolLabel(target)}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#10131c',
  color: '#e8eaed',
  border: '1px solid #2a3040',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 14,
};
