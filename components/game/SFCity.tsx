'use client';
import { useState, useEffect, useRef } from 'react';
import Character from './Character';
import NPC, { screenPctToWorldX, worldXToScreenPct } from './NPC';
import { NpcChatOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
import { playerBubbleSide } from './ChatBubble';
import { CHAR_BOTTOM } from './groundLayout';
import { START_WORLD_OFF } from '@/lib/venues';
import { getConcertInView, subscribeConcertInView } from '@/lib/concertNow';
import CHARACTERS from './characters';

/** Set to an NPC id to spawn only that character immediately (testing). */
const TEST_SPAWN_NPC_ID: string | null = null;
import {
  getPlayerName,
  setPlayerName as savePlayerName,
  isValidPlayerName,
} from '@/lib/playerStorage';
import { pickFallbackReply, type ChatTurn } from '@/lib/npcChat';
import { fetchNpcReplyWithTyping } from '@/lib/npcChatClient';
import { getCinemaNowPlaying, subscribeCinemaNowPlaying } from '@/lib/cinemaNow';
import { getConcertNowPlaying, subscribeConcertNowPlaying } from '@/lib/concertNowPlaying';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { isNearConcert } from '@/lib/concertDance';
import { loadCinemaVideos } from '@/lib/cinemaVideoPool';
import { LovingCarLayer } from './LovingCar';
import { SkyCreaturesLayer } from './SkyCreatures';
import { CITY_SCENE_KEYFRAMES } from './city/citySceneKeyframes';
import { CHARACTER_STYLES } from './characterStyles';
import { SkyLayer } from './city/SkyLayer';
import { MidLayer } from './city/MidLayer';
import { GroundLayer } from './city/GroundLayer';
import { VenueSignsLayer } from './city/VenueSignsLayer';
import { useSkyPeriod } from './hooks/useSkyPeriod';
import { DPadBtn } from './DPadBtn';

const KF = `${CITY_SCENE_KEYFRAMES}\n${CHARACTER_STYLES}`;


// ─── NPC cast ─────────────────────────────────────────────────────────────────

// Characters are defined in characters.ts (names, personalities, AI chat).

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SFCity() {
  const skyPeriod  = useSkyPeriod();
  const worldRef   = useRef(START_WORLD_OFF);
  const keysRef    = useRef({ left: false, right: false });
  const facingRef  = useRef<'left' | 'right'>('right');
  const walkingRef = useRef(false);
  const rafRef     = useRef<number | null>(null);
  const jumpingRef = useRef(false);

  // ── Greeting / collision ───────────────────────────────────────────────────
  // Each NPC reports its world-x each frame (same coordinate space as worldRef).
  const npcWorldXRefs     = useRef(
    CHARACTERS.map(c => screenPctToWorldX(c.startX, START_WORLD_OFF)),
  );
  const greetingRef       = useRef<number | null>(null);
  const nearNpcRef        = useRef<number | null>(null);
  const disconnectUntil   = useRef(0);

  const [worldOff,    setWorldOff]    = useState(() => START_WORLD_OFF);
  const [facing,      setFacing]      = useState<'left' | 'right'>('right');
  const [walking,     setWalking]     = useState(false);
  const [jumping,     setJumping]     = useState(false);
  const [playerDancing, setPlayerDancing] = useState(false);
  const [npcDancing,  setNpcDancing]  = useState<boolean[]>(() => CHARACTERS.map(() => false));
  const playerDancingRef = useRef(false);
  const npcDancingRef    = useRef<boolean[]>(CHARACTERS.map(() => false));
  const [greetingNpc, setGreetingNpc] = useState<number | null>(null);
  const [nearNpc,     setNearNpc]     = useState<number | null>(null);
  const [greetNpcX,   setGreetNpcX]   = useState(50);
  // ── Player chat ─────────────────────────────────────────────────────────────
  type ChatMode = null | 'name' | 'chat';
  const [playerName,    setPlayerName]    = useState<string | null>(null);
  const [chatMode,      setChatMode]      = useState<ChatMode>(null);
  const [nameDraft,     setNameDraft]     = useState('');
  const [chatDraft,     setChatDraft]     = useState('');
  const [playerMessage, setPlayerMessage] = useState<string | null>(null);
  const [npcMessage,    setNpcMessage]    = useState<string | null>(null);
  const [npcTyping,     setNpcTyping]     = useState(false);
  const [chatHistory,   setChatHistory]   = useState<ChatTurn[]>([]);
  const [chatSendTick,  setChatSendTick]  = useState(0);
  const [cinemaNowPlaying, setCinemaNowPlaying]   = useState<string | null>(null);
  const [concertNowPlaying, setConcertNowPlaying] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const playerNameRef = useRef<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const sentMessageRef = useRef('');
  const chatHistoryRef = useRef<ChatTurn[]>([]);
  const cinemaNowRef  = useRef<string | null>(null);
  const concertNowRef = useRef<string | null>(null);
  const greetingSessionRef = useRef<number | null>(null);

  useEffect(() => { setPlayerName(getPlayerName()); }, []);
  useEffect(() => { loadCinemaVideos(); }, []);

  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  useEffect(() => {
    cinemaNowRef.current = cinemaNowPlaying;
  }, [cinemaNowPlaying]);
  useEffect(() => {
    concertNowRef.current = concertNowPlaying;
  }, [concertNowPlaying]);
  useEffect(() => {
    setCinemaNowPlaying(getCinemaNowPlaying());
    return subscribeCinemaNowPlaying(() => {
      setCinemaNowPlaying(getCinemaNowPlaying());
    });
  }, []);
  useEffect(() => {
    setConcertNowPlaying(getConcertNowPlaying());
    return subscribeConcertNowPlaying(() => {
      setConcertNowPlaying(getConcertNowPlaying());
    });
  }, []);

  // Clear conversation on disconnect
  useEffect(() => {
    if (greetingNpc !== null) return;
    chatAbortRef.current?.abort();
    setNpcMessage(null);
    setNpcTyping(false);
    setChatHistory([]);
    setChatSendTick(0);
    sentMessageRef.current = '';
    greetingSessionRef.current = null;
  }, [greetingNpc]);

  // AI greeting when connecting to an NPC
  useEffect(() => {
    if (greetingNpc === null) return;
    if (greetingSessionRef.current === greetingNpc) return;
    greetingSessionRef.current = greetingNpc;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const character = CHARACTERS[greetingNpc];
    setNpcTyping(true);
    setNpcMessage(null);
    setChatHistory([]);
    setPlayerMessage(null);
    setChatSendTick(0);
    sentMessageRef.current = '';
    setChatMode(playerName ? 'chat' : null);

    fetchNpcReplyWithTyping(
      {
        characterId: character.id,
        playerName: playerName ?? 'friend',
        isGreeting: true,
        cinemaNowPlaying: cinemaNowRef.current,
        concertNowPlaying: concertNowRef.current,
      },
      controller.signal,
      () => {
        setNpcTyping(true);
        setNpcMessage(null);
      },
      reply => {
        setNpcTyping(false);
        setNpcMessage(reply);
        setChatHistory([{ role: 'assistant', content: reply }]);
      },
    ).catch(err => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNpcTyping(false);
      setNpcMessage(`Hey! I'm ${character.name}.`);
    });

    if (playerName) {
      setTimeout(() => chatInputRef.current?.focus(), 120);
    }

    return () => controller.abort();
  }, [greetingNpc, playerName]);

  // AI reply when the player sends a message
  useEffect(() => {
    if (chatSendTick === 0 || greetingNpc === null) return;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const character = CHARACTERS[greetingNpc];
    const message = sentMessageRef.current;

    fetchNpcReplyWithTyping(
      {
        characterId: character.id,
        playerName: playerName ?? 'friend',
        message,
        history: chatHistoryRef.current,
        cinemaNowPlaying: cinemaNowRef.current,
        concertNowPlaying: concertNowRef.current,
      },
      controller.signal,
      () => {
        setNpcTyping(true);
        setNpcMessage(null);
      },
      reply => {
        setNpcTyping(false);
        setNpcMessage(reply);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: message },
          { role: 'assistant', content: reply },
        ]);
        setTimeout(() => chatInputRef.current?.focus(), 0);
      },
    ).catch(err => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNpcTyping(false);
      setNpcMessage(pickFallbackReply(character));
      setTimeout(() => chatInputRef.current?.focus(), 0);
    });

    return () => controller.abort();
  }, [chatSendTick, greetingNpc, playerName]);

  const handleSendMessage = (text: string) => {
    sentMessageRef.current = text;
    setPlayerMessage(text);
    setChatDraft('');
    setChatSendTick(t => t + 1);
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!isValidPlayerName(trimmed)) return;
    savePlayerName(trimmed);
    setPlayerName(trimmed);
    setNameDraft('');
    setChatMode('chat');
    setTimeout(() => chatInputRef.current?.focus(), 30);
  };

  // ── Audio ──────────────────────────────────────────────────────────────────
  const TRACKS = ['/audio/1.mp3', '/audio/2.mp3', '/audio/3.mp3'];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted,  setMuted] = useState(false);

  useEffect(() => {
    const src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const el  = new Audio(src);
    el.loop   = true;
    el.volume = 0.35;
    el.muted  = muted;
    audioRef.current = el;

    const tryPlay = () => el.play().catch(() => {});
    tryPlay();
    // Fallback: play on first interaction if autoplay is blocked
    window.addEventListener('keydown',     tryPlay, { once: true });
    window.addEventListener('pointerdown', tryPlay, { once: true });

    return () => {
      el.pause();
      window.removeEventListener('keydown',     tryPlay);
      window.removeEventListener('pointerdown', tryPlay);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const syncBgAudio = () => {
      const el = audioRef.current;
      if (!el) return;
      if (getConcertInView()) {
        el.pause();
      } else if (!muted) {
        el.play().catch(() => {});
      }
    };
    syncBgAudio();
    return subscribeConcertInView(syncBgAudio);
  }, [muted]);

  useEffect(() => {
    const SPEED      = 3.5;
    const GREET_DIST = 5; // % of viewport — must be quite close to "touch"

    const triggerJump = () => {
      if (jumpingRef.current) return;
      jumpingRef.current = true;
      setJumping(true);
      setTimeout(() => { jumpingRef.current = false; setJumping(false); }, 560);
    };

    const connectToNpc = (i: number, screenPct: number) => {
      greetingRef.current = i;
      setGreetingNpc(i);
      setGreetNpcX(screenPct);
      setNearNpc(null);
      nearNpcRef.current = null;
      const towardNpc = screenPct < 50 ? 'left' : 'right';
      facingRef.current = towardNpc;
      setFacing(towardNpc);
      setWalking(false);
      walkingRef.current = false;
    };

    const disconnect = () => {
      greetingRef.current = null;
      setGreetingNpc(null);
      disconnectUntil.current = Date.now() + 2000;
      setChatMode(null);
      setNameDraft('');
      setChatDraft('');
      setPlayerMessage(null);
    };

    const openChatPanel = () => {
      if (!playerNameRef.current) {
        setChatMode('name');
        setTimeout(() => nameInputRef.current?.focus(), 30);
      } else {
        setChatMode('chat');
        setTimeout(() => chatInputRef.current?.focus(), 30);
      }
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (greetingRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          setChatMode(null);
          setNameDraft('');
          setChatDraft('');
        }
        return;
      }

      // Let the chat input handle its own keys without interference
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (['ArrowLeft',  'a', 'A'].includes(e.key)) { keysRef.current.left  = true;  e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keysRef.current.right = true;  e.preventDefault(); }
      if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
        e.preventDefault();
        if (greetingRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          triggerJump();
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (greetingRef.current !== null) {
          openChatPanel();
        } else if (
          nearNpcRef.current !== null
          && Date.now() > disconnectUntil.current
        ) {
          const i = nearNpcRef.current;
          const width = window.innerWidth;
          const screenPct = worldXToScreenPct(
            npcWorldXRefs.current[i], worldRef.current, width,
          );
          connectToNpc(i, screenPct);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (['ArrowLeft',  'a', 'A'].includes(e.key)) keysRef.current.left  = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = false;
    };
    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup',   onUp);

    const updateDanceState = (off: number) => {
      const width = window.innerWidth;
      const greeting = greetingRef.current;

      const playerNear = greeting === null && isNearConcert(off, off, width);
      if (playerNear !== playerDancingRef.current) {
        playerDancingRef.current = playerNear;
        setPlayerDancing(playerNear);
      } else if (greeting !== null && playerDancingRef.current) {
        playerDancingRef.current = false;
        setPlayerDancing(false);
      }

      const next = npcWorldXRefs.current.map((wx, i) =>
        greeting === i ? false : isNearConcert(wx, off, width),
      );
      if (next.some((v, i) => v !== npcDancingRef.current[i])) {
        npcDancingRef.current = next;
        setNpcDancing([...next]);
      }
    };

    const loop = () => {
      // While greeting, freeze the player completely
      if (greetingRef.current !== null) {
        if (walkingRef.current) { walkingRef.current = false; setWalking(false); }
        updateDanceState(worldRef.current);
        gameWorldOffRef.current = worldRef.current;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { left, right } = keysRef.current;
      let isWalking = false;

      if (left && !right) {
        worldRef.current -= SPEED;
        if (facingRef.current !== 'left') { facingRef.current = 'left'; setFacing('left'); }
        isWalking = true;
      } else if (right && !left) {
        worldRef.current += SPEED;
        if (facingRef.current !== 'right') { facingRef.current = 'right'; setFacing('right'); }
        isWalking = true;
      }

      if (isWalking !== walkingRef.current) {
        walkingRef.current = isWalking;
        setWalking(isWalking);
      }
      if (isWalking) setWorldOff(worldRef.current);

      // Proximity check only — connection requires Enter.
      if (greetingRef.current === null) {
        const width = window.innerWidth;
        const greetDistPx = (GREET_DIST / 100) * width;
        let inRange: number | null = null;
        if (Date.now() > disconnectUntil.current) {
          for (let i = 0; i < npcWorldXRefs.current.length; i++) {
            const npcWorldX = npcWorldXRefs.current[i];
            const screenPct = worldXToScreenPct(npcWorldX, worldRef.current, width);
            const distPx    = Math.abs(npcWorldX - worldRef.current);
            if (screenPct >= 5 && screenPct <= 95 && distPx < greetDistPx) {
              inRange = i;
              break;
            }
          }
        }
        if (inRange !== nearNpcRef.current) {
          nearNpcRef.current = inRange;
          setNearNpc(inRange);
        }
      } else if (nearNpcRef.current !== null) {
        nearNpcRef.current = null;
        setNearNpc(null);
      }

      updateDanceState(worldRef.current);
      gameWorldOffRef.current = worldRef.current;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', animation: 'fdi 1.5s ease' }}>
      <style>{KF}</style>

      <SkyLayer         worldOff={worldOff} period={skyPeriod} />
      <MidLayer         worldOff={worldOff} />
      <SkyCreaturesLayer period={skyPeriod} worldOff={worldOff} />
      <GroundLayer      worldOff={worldOff} />
      <VenueSignsLayer  worldOff={worldOff} />

      <LovingCarLayer />

      {/* Autonomous NPCs */}
      {CHARACTERS.map((cfg, i) => {
        if (TEST_SPAWN_NPC_ID && cfg.id !== TEST_SPAWN_NPC_ID) return null;
        const testing = TEST_SPAWN_NPC_ID === cfg.id;
        return (
        <NPC
          key={cfg.id}
          {...cfg}
          startX={testing ? 55 : cfg.startX}
          entryDelay={testing ? 0 : cfg.entryDelay}
          worldOff={worldOff}
          paused={greetingNpc === i}
          greeting={greetingNpc === i}
          greetFacing={greetNpcX < 50 ? 'right' : 'left'}
          dancing={npcDancing[i]}
          onMove={wx => { npcWorldXRefs.current[i] = wx; }}
          greetingChat={greetingNpc === i ? {
            name: cfg.name,
            npcTyping,
            npcMessage,
          } : undefined}
        />
        );
      })}

      {/* Player — world scrolls, character stays centred */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: CHAR_BOTTOM,
        zIndex: greetingNpc !== null ? 200 : 20,
      }}>
        <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
          <Character
            walking={walking}
            facing={facing}
            dancing={playerDancing}
            bubbleSide={playerBubbleSide(greetNpcX)}
            chatOverlay={greetingNpc !== null ? (
              <PlayerChatOverlay
                npcScreenX={greetNpcX}
                chatMode={chatMode}
                playerName={playerName}
                playerMessage={playerMessage}
                nameDraft={nameDraft}
                setNameDraft={setNameDraft}
                chatDraft={chatDraft}
                setChatDraft={setChatDraft}
                onSaveName={handleSaveName}
                onSendMessage={handleSendMessage}
                chatInputRef={chatInputRef}
                nameInputRef={nameInputRef}
              />
            ) : undefined}
          />
        </div>
      </div>

      {/* Proximity hint — touching but not yet connected */}
      {nearNpc !== null && greetingNpc === null && (
        <div style={{
          position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
          borderRadius: 40, padding: '7px 18px',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
          fontFamily: "Georgia,'Times New Roman',serif",
        }}>
          ↵ connect with {CHARACTERS[nearNpc]?.name}
        </div>
      )}

      {/* Greeting status bar */}
      {greetingNpc !== null && chatMode !== 'chat' && chatMode !== 'name' && (
        <div style={{
          position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
          borderRadius: 40, padding: '7px 18px',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
          fontFamily: "Georgia,'Times New Roman',serif",
          display: 'flex', gap: 16,
        }}>
          <span>↑ or esc · say goodbye to {CHARACTERS[greetingNpc]?.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span>{playerName ? '↵ chat' : '↵ enter name'}</span>
        </div>
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
        background: 'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 38%, rgba(0,0,0,.5) 100%)',
      }} />

     

      {/* Keyboard hint + mute — hidden on mobile, bottom-right */}
      <div className="hidden md:flex" style={{
        position: 'absolute', bottom: 22, right: 22,
        gap: 10, alignItems: 'center', zIndex: 40,
      }}>
        {['←', '→', '↑'].map((k, i) => (
          <div key={i} style={{
            width: 30, height: 30, borderRadius: 7,
            border: '1px solid rgba(255,255,255,.2)',
            background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,.45)', fontSize: 14,
            pointerEvents: 'none',
          }}>{k}</div>
        ))}
        <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 9, letterSpacing: 3, fontFamily: 'Georgia,serif', pointerEvents: 'none' }}>
          A · D · W · walk & jump
        </div>
        <button onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'} style={{
          width: 30, height: 30, borderRadius: 7,
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: muted ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)',
          fontSize: 14, cursor: 'pointer',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Mobile D-pad + mute — shown only on touch devices */}
      <div className="flex md:hidden" style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        gap: 12, zIndex: 40, alignItems: 'center',
      }}>
        <DPadBtn label="←"
          onStart={() => { keysRef.current.left = true; }}
          onEnd={()   => { keysRef.current.left = false; }} />
        <DPadBtn label="↑"
          onStart={() => {
            if (!jumpingRef.current) {
              jumpingRef.current = true;
              setJumping(true);
              setTimeout(() => { jumpingRef.current = false; setJumping(false); }, 560);
            }
          }}
          onEnd={() => {}} />
        <DPadBtn label="→"
          onStart={() => { keysRef.current.right = true; }}
          onEnd={()   => { keysRef.current.right = false; }} />
        <button onClick={() => setMuted(m => !m)} style={{
          width: 56, height: 56, borderRadius: 12,
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(6px)',
          color: muted ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)',
          fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

    </div>
  );
}
