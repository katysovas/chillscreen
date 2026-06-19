const LINK_STYLE = { color: '#8ab4f8', fontSize: 13, textDecoration: 'none' as const };

export function AdminNav({ active }: { active: 'playlists' | 'npc' | 'seeds' | 'chat' }) {
  return (
    <nav style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <a href="/admin/stage-playlists" style={{ ...LINK_STYLE, fontWeight: active === 'playlists' ? 600 : 400 }}>
        Stage playlists
      </a>
      <a href="/admin/npc-generator" style={{ ...LINK_STYLE, fontWeight: active === 'npc' ? 600 : 400 }}>
        NPC generator
      </a>
      <a href="/admin/seeds" style={{ ...LINK_STYLE, fontWeight: active === 'seeds' ? 600 : 400 }}>
        Seeds
      </a>
      <a href="/admin/chat-moderation" style={{ ...LINK_STYLE, fontWeight: active === 'chat' ? 600 : 400 }}>
        Chat moderation
      </a>
    </nav>
  );
}
