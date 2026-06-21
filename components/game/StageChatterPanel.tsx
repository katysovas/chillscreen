'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { filterChatMessage } from '@/lib/messageFilter';
import {
  filterStageChatterMessages,
  filterStageChatterTypingSenders,
  getHumansOnlyStageChatter,
  subscribeHumansOnlyStageChatter,
} from '@/lib/stageChatter/preferences';
import type { StageChatterMessage } from '@/lib/stageChatter/types';
import type { CharacterLoadout } from './characters/loadout';
import { Z_CONTROLS } from '@/lib/zLayers';
import { ShoppingCartIcon } from './BottomControlPanel';
import { StageLineupPanel } from './StageLineupPanel';
import { StageInfoPanel } from './StageInfoPanel';
import { VendorShopPanel } from './VendorShopPanelLazy';
import type { StageChannel } from '@/lib/stageVideos';
import type { Multiplayer } from '@/lib/multiplayer/useMultiplayer';

const PANEL_STYLES = `
@keyframes stage-chatter-glow {
  0%, 100% { box-shadow: 0 0 18px rgba(255, 120, 200, 0.22), 0 0 36px rgba(120, 200, 255, 0.12), inset 0 0 24px rgba(255, 255, 255, 0.03); }
  50% { box-shadow: 0 0 22px rgba(255, 160, 120, 0.28), 0 0 42px rgba(160, 120, 255, 0.16), inset 0 0 28px rgba(255, 255, 255, 0.05); }
}
@keyframes stage-chatter-typing {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.stage-chatter-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
  touch-action: pan-y;
}
.stage-chatter-scroll::-webkit-scrollbar {
  display: none;
}
.stage-chatter-scroll.is-dragging {
  cursor: grabbing;
  user-select: none;
}
.stage-chatter-scroll:not(.is-dragging) {
  cursor: grab;
}
`;

export type StageSidePanelTab = 'lineup' | 'chat' | 'shop' | 'info';

type Props = {
  messages: StageChatterMessage[];
  typingSenders: string[];
  resolveName: (sender: string) => string;
  resolveGlow?: (sender: string) => string | undefined;
  onSend: (text: string) => void;
  onTypingChange?: (typing: boolean) => void;
  onHumansOnlyChange?: (enabled: boolean) => void;
  stageName?: string;
  stageDescription?: string | null;
  isStageOwner?: boolean;
  hidden?: boolean;
  activeTab: StageSidePanelTab;
  onTabChange: (tab: StageSidePanelTab) => void;
  shopLoadout: CharacterLoadout;
  shopCoins: number;
  onShopPurchase: (itemId: string) => boolean | Promise<boolean>;
  onShopUnequip: (itemId: string) => void | Promise<void>;
  /** Curated JSON stage channel — enables the Lineup tab when set. */
  stageChannel?: StageChannel | null;
  /** Built-in venue playback channel for info links (now-playing artist). */
  playbackChannel?: StageChannel | null;
  lineupMultiplayer?: Pick<
    Multiplayer,
    | 'connected'
    | 'requestConnect'
    | 'sendLineupSubscribe'
    | 'sendLineupVote'
    | 'sendLineupSuggest'
    | 'registerLineupStateHandler'
  > | null;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function CollapseIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{
        transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <path
        d="M2.5 7.5L6 4l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatTabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LineupTabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M5 7h14M5 12h14M5 17h10"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function InfoTabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path
        d="M12 11v5.5M12 8.25h.01"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

const tabBtnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  border: 'none',
  borderRadius: 8,
  padding: '5px 6px',
  fontSize: 9,
  letterSpacing: 0.9,
  textTransform: 'uppercase',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

function SidePanelTab({
  active,
  label,
  icon,
  notify = false,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  notify?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={notify ? `${label}, new messages` : label}
      onClick={onClick}
      style={{
        ...tabBtnBase,
        position: 'relative',
        color: active ? 'rgba(255, 240, 250, 0.95)' : 'rgba(255, 255, 255, 0.45)',
        background: active ? 'rgba(255, 120, 200, 0.18)' : 'transparent',
        boxShadow: active ? 'inset 0 0 12px rgba(255, 120, 200, 0.08)' : 'none',
      }}
    >
      {icon}
      {label}
      {notify ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            right: 4,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffb4dc 0%, #ff6eb4 70%)',
            boxShadow: '0 0 10px rgba(255, 110, 180, 0.85)',
          }}
        />
      ) : null}
    </button>
  );
}

export function StageChatterPanel({
  messages,
  typingSenders,
  resolveName,
  resolveGlow,
  onSend,
  onTypingChange,
  onHumansOnlyChange,
  stageName,
  stageDescription,
  isStageOwner = false,
  hidden = false,
  activeTab,
  onTabChange,
  shopLoadout,
  shopCoins,
  onShopPurchase,
  onShopUnequip,
  stageChannel = null,
  playbackChannel = null,
  lineupMultiplayer = null,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const stickToBottomRef = useRef(true);
  const dragRef = useRef<{ active: boolean; startY: number; startScrollTop: number }>({
    active: false,
    startY: 0,
    startScrollTop: 0,
  });
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeenMessageCountRef = useRef(0);
  const messagesInitializedRef = useRef(false);
  const [expanded, setExpanded] = useState(true);
  const [chatUnread, setChatUnread] = useState(false);
  const [dragging, setDragging] = useState(false);
  const humansOnly = useSyncExternalStore(
    subscribeHumansOnlyStageChatter,
    getHumansOnlyStageChatter,
    () => false,
  );

  const visibleMessages = useMemo(
    () => filterStageChatterMessages(messages, humansOnly),
    [humansOnly, messages],
  );

  const visibleTypingSenders = useMemo(
    () => filterStageChatterTypingSenders(typingSenders, humansOnly),
    [humansOnly, typingSenders],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (hidden || !expanded) return;
    if (stickToBottomRef.current) {
      scrollToBottom(visibleMessages.length <= 1 ? 'auto' : 'smooth');
    }
  }, [expanded, hidden, visibleMessages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist < 48;
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    handleScroll();
  }, [handleScroll]);

  const handleScrollPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
    };
    setDragging(true);
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handleScrollPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const dy = e.clientY - dragRef.current.startY;
    el.scrollTop = dragRef.current.startScrollTop - dy;
    stickToBottomRef.current = false;
  }, []);

  const handleScrollPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    scrollRef.current?.releasePointerCapture(e.pointerId);
    endDrag();
  }, [endDrag]);

  const handleSubmit = useCallback(() => {
    const raw = draftRef.current?.value ?? '';
    const filtered = filterChatMessage(raw);
    if (!filtered.ok) return;
    if (draftRef.current) draftRef.current.value = '';
    onTypingChange?.(false);
    onSend(filtered.text);
    stickToBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [onSend, onTypingChange, scrollToBottom]);

  const signalTyping = useCallback(() => {
    onTypingChange?.(true);
    if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
    typingHideTimerRef.current = setTimeout(() => {
      typingHideTimerRef.current = null;
      onTypingChange?.(false);
    }, 1200);
  }, [onTypingChange]);

  const rows = useMemo(
    () => visibleMessages.map(msg => ({
      ...msg,
      name: resolveName(msg.sender),
      glow: resolveGlow?.(msg.sender),
    })),
    [visibleMessages, resolveGlow, resolveName],
  );

  const typingRows = useMemo(
    () => visibleTypingSenders.map(sender => ({
      sender,
      name: resolveName(sender),
      glow: resolveGlow?.(sender),
    })),
    [visibleTypingSenders, resolveGlow, resolveName],
  );

  const welcomeMessage = useMemo(() => {
    const name = stageName?.trim();
    if (!name) return null;
    if (isStageOwner) {
      return `Welcome to ${name}! Customize your stage in Settings, or manage the lineup from the icon below.`;
    }
    const description = stageDescription?.trim();
    return description
      ? `Welcome to ${name} — ${description}`
      : `Welcome to ${name}`;
  }, [isStageOwner, stageDescription, stageName]);

  const infoName = stageName?.trim() ?? '';
  const infoDescription = stageDescription?.trim() ?? '';

  useEffect(() => () => {
    if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
    onTypingChange?.(false);
  }, [onTypingChange]);

  useEffect(() => {
    if (activeTab === 'shop' || activeTab === 'lineup') setExpanded(true);
  }, [activeTab]);

  useEffect(() => {
    if (expanded && activeTab === 'chat') {
      lastSeenMessageCountRef.current = visibleMessages.length;
      setChatUnread(false);
    }
  }, [expanded, activeTab, visibleMessages.length]);

  useEffect(() => {
    const count = visibleMessages.length;
    if (!messagesInitializedRef.current) {
      messagesInitializedRef.current = true;
      lastSeenMessageCountRef.current = count;
      return;
    }

    if (count < lastSeenMessageCountRef.current) {
      lastSeenMessageCountRef.current = count;
      if (count === 0) setChatUnread(false);
      return;
    }

    if (count > lastSeenMessageCountRef.current && (activeTab !== 'chat' || !expanded)) {
      setChatUnread(true);
    }
  }, [visibleMessages.length, expanded, activeTab]);

  const showLineupTab = Boolean(stageChannel);

  if (hidden) return null;

  const panelVisibleOnMobile = activeTab === 'shop';

  return (
    <div
      data-paraloid-ui
      className={panelVisibleOnMobile ? 'flex' : 'hidden md:flex'}
      style={{
        position: 'absolute',
        right: 14,
        top: 20,
        zIndex: Z_CONTROLS,
        width: 320,
        height: expanded ? 800 : 'auto',
        maxHeight: expanded ? 'calc(100vh - 220px)' : undefined,
        flexDirection: 'column',
        borderRadius: 16,
        background: 'linear-gradient(165deg, rgba(12, 8, 28, 0.82) 0%, rgba(20, 12, 36, 0.88) 100%)',
        border: '1px solid rgba(255, 180, 220, 0.22)',
        backdropFilter: 'blur(14px)',
        animation: 'stage-chatter-glow 5s ease-in-out infinite',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      <style>{PANEL_STYLES}</style>

      <div
        style={{
          padding: '10px 12px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          width: '100%',
          borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'transparent',
        }}
        role="tablist"
        aria-label="Stage panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          {showLineupTab ? (
            <SidePanelTab
              active={activeTab === 'lineup'}
              label="Lineup"
              icon={<LineupTabIcon />}
              onClick={() => onTabChange('lineup')}
            />
          ) : null}
          <SidePanelTab
            active={activeTab === 'chat'}
            label="Chat"
            icon={<ChatTabIcon />}
            notify={chatUnread}
            onClick={() => onTabChange('chat')}
          />
          <SidePanelTab
            active={activeTab === 'shop'}
            label="Shop"
            icon={<ShoppingCartIcon size={14} />}
            onClick={() => onTabChange('shop')}
          />
          <SidePanelTab
            active={activeTab === 'info'}
            label="Info"
            icon={<InfoTabIcon />}
            onClick={() => onTabChange('info')}
          />
        </div>


        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse stage panel' : 'Expand stage panel'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            border: 'none',
            color: 'rgba(255, 220, 240, 0.65)',
            background: 'rgba(255, 255, 255, 0.06)',
            flexShrink: 0,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <CollapseIcon expanded={expanded} />
        </button>
      </div>

      {expanded && activeTab === 'chat' && (
      <>
      <div
        ref={scrollRef}
        className={`stage-chatter-scroll${dragging ? ' is-dragging' : ''}`}
        onScroll={handleScroll}
        onPointerDown={handleScrollPointerDown}
        onPointerMove={handleScrollPointerMove}
        onPointerUp={handleScrollPointerUp}
        onPointerCancel={handleScrollPointerUp}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {rows.length === 0 ? (
          <p
            style={{
              margin: '12px 4px',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.38)',
              textAlign: 'left',
            }}
          >
            {welcomeMessage ?? 'Welcome to the stage.'}
          </p>
        ) : (
          rows.map(msg => (
            <div
              key={`${msg.ts}-${msg.sender}-${msg.text}`}
              style={{
                fontSize: 11,
                lineHeight: 1.45,
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: msg.glow ?? 'rgba(180, 220, 255, 0.95)',
                  textShadow: msg.glow
                    ? `0 0 12px ${msg.glow}88`
                    : '0 0 10px rgba(140, 200, 255, 0.35)',
                }}
              >
                {msg.name}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', margin: '0 4px' }}>:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.82)' }}>{msg.text}</span>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 9,
                  letterSpacing: 0.4,
                  color: 'rgba(255, 255, 255, 0.28)',
                }}
              >
                {formatTime(msg.ts)}
              </span>
            </div>
          ))
        )}

        {typingRows.length > 0 && (
          <div
            style={{
              marginTop: 2,
              paddingTop: 6,
              borderTop: '1px dashed rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {typingRows.map(row => (
              <div key={row.sender} style={{ fontSize: 10, lineHeight: 1.35 }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: row.glow ?? 'rgba(180, 220, 255, 0.9)',
                    textShadow: row.glow ? `0 0 10px ${row.glow}88` : 'none',
                  }}
                >
                  {row.name}
                </span>
                <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ animation: 'stage-chatter-typing 1s ease-in-out infinite' }}>...</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '10px 12px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 200, 230, 0.14)',
            boxShadow: 'inset 0 0 12px rgba(255, 120, 200, 0.06)',
          }}
        >
          <input
            ref={draftRef}
            type="text"
            maxLength={120}
            placeholder="Say something…"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
                return;
              }
            }}
            onChange={() => signalTyping()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Send stage chatter"
            style={{
              border: 'none',
              borderRadius: 7,
              padding: '4px 8px',
              fontSize: 10,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: 'rgba(255, 240, 250, 0.9)',
              background: 'linear-gradient(135deg, rgba(255, 100, 180, 0.45), rgba(140, 120, 255, 0.4))',
              boxShadow: '0 0 10px rgba(255, 120, 200, 0.25)',
            }}
          >
            Send
          </button>
        </div>
      </div>
      </>
      )}

      {expanded && activeTab === 'lineup' && stageChannel ? (
        <StageLineupPanel channel={stageChannel} lineupMultiplayer={lineupMultiplayer} />
      ) : null}

      {expanded && activeTab === 'shop' && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <VendorShopPanel
            embedded
            loadout={shopLoadout}
            coins={shopCoins}
            onPurchase={onShopPurchase}
            onUnequip={onShopUnequip}
          />
        </div>
      )}

      {expanded && activeTab === 'info' && (
        <div
          className="stage-chatter-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '14px 14px 16px',
          }}
        >
          {infoName ? (
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.35,
                color: 'rgba(255, 240, 250, 0.95)',
              }}
            >
              {infoName}
            </h2>
          ) : null}
          {infoDescription ? (
            <p
              style={{
                margin: infoName ? '10px 0 0' : 0,
                fontSize: 11,
                lineHeight: 1.55,
                color: 'rgba(255, 255, 255, 0.72)',
              }}
            >
              {infoDescription}
            </p>
          ) : null}
          <StageInfoPanel playbackChannel={playbackChannel} />
          {!infoName && !infoDescription ? (
            <p
              style={{
                margin: '12px 4px 0',
                fontSize: 11,
                lineHeight: 1.5,
                color: 'rgba(255, 255, 255, 0.38)',
              }}
            >
              No stage information yet.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
