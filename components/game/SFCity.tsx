'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import Character from './Character';
import NPC, { screenPctToWorldX, worldXToScreenPct } from './NPC';
import { AmbientPlayerOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
import { playerBubbleSide } from './ChatBubble';
import { CHAR_BOTTOM } from './groundLayout';
import { SKY_F, MID_F, GND_F, midScrollTile, gndScrollTile } from '@/lib/parallax';
import {
  getClientSpawnWorldOff,
  serverSpawnWorldOff,
  subscribeSpawnWorldOff,
} from '@/lib/spawn';
import { setAudioMuted } from '@/lib/audioMute';
import { playChatInviteBeep } from '@/lib/playChatInviteBeep';
import CHARACTERS from './characters';
import RemotePlayer from './RemotePlayer';
import { scheduleIdleCallback } from '@/lib/scheduleIdleCallback';
import { PLAYER_AMBIENT_VISIBLE_MS, useMultiplayer } from '@/lib/multiplayer/useMultiplayer';
import { filterChatMessage } from '@/lib/messageFilter';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import type { PlayerProfile } from '@/lib/multiplayer/protocol';
import { getPlayerLoadout, equipLoadoutItem, unequipLoadoutItem } from '@/lib/playerLoadout';
import { serializeLoadout } from '@/lib/multiplayer/loadoutSync';
import { isBuzNpc } from '@/lib/vendorShop';

/** Set to an NPC id to spawn only that character immediately (testing). */
const TEST_SPAWN_NPC_ID: string | null = null;

/** Force all characters into dance mode regardless of stage proximity (testing). */
const TEST_FORCE_DANCE = false;

/** Show all four player variant skins side-by-side (testing). */
const TEST_PLAYER_VARIANT_GALLERY = false;

/** Equip loadout items on the player at startup (testing). */
const TEST_PLAYER_LOADOUT = {} as const;
import {
  getPlayerName,
  setPlayerName as savePlayerName,
} from '@/lib/playerStorage';
import { identifyPlayer, trackCharacterCreated } from '@/lib/analytics';
import { pickFallbackReply, type ChatTurn } from '@/lib/npcChat';
import { fetchNpcReplyWithTyping } from '@/lib/npcChatClient';
import { getCinemaNowPlaying, subscribeCinemaNowPlaying } from '@/lib/cinemaNow';
import { getConcertNowPlaying, subscribeConcertNowPlaying } from '@/lib/concertNowPlaying';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { isNearStage } from '@/lib/concertDance';
import { LovingCarLayer } from './LovingCar';
import { WelcomePopup } from './WelcomePopup';
import { SkyCreaturesLayer } from './SkyCreatures';
import { CHARACTER_STYLES } from './characterStyles';
import { SkyLayer } from './city/SkyLayer';
import { SkyCloudsLayer } from './city/SkyCloudsLayer';
import { MidLayer } from './city/MidLayer';
import { GroundLayer } from './city/GroundLayer';
import { CabanaForegroundLayer } from './city/CabanaForegroundLayer';
import { VenueSignsLayer } from './city/VenueSignsLayer';
import { WelcomeSignLayer } from './city/WelcomeSignLayer';
import { PlayerVariantGallery } from './PlayerVariantGallery';
import { useSkyPeriod } from './hooks/useSkyPeriod';
import { useNpcAmbientChat } from './hooks/useNpcAmbientChat';
import { DPadBtn } from './DPadBtn';
import type { VenueRoute } from '@/lib/venueRoutes';
import { BottomControlPanel } from './BottomControlPanel';
import { VendorShopPanel, preloadVendorShopPanel } from './VendorShopPanelLazy';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import { hasStickerTripActive, preloadAllLoadoutSlots, StickerTripOverlay } from './characters/loadout';
import { runAllNpcMovementTicks } from '@/lib/npcMovementRegistry';
import { runAllStagePlayerSyncs } from '@/lib/stagePlayerRegistry';
import type { CharacterLoadout } from './characters/loadout';
import { defaultLoadout } from './characters/loadout';

// ─── NPC cast ─────────────────────────────────────────────────────────────────

// Characters are defined in characters.ts (names, personalities, AI chat).

// ─── Main ─────────────────────────────────────────────────────────────────────

type SFCityProps = {
  /** When set (venue deep link), spawn centered on that stage instead of random. */
  spawnWorldOff?: number;
  /** Which venue was deep-linked — keeps that stage live on first paint. */
  venueRoute?: VenueRoute;
};

export default function SFCity({ spawnWorldOff: spawnOverride, venueRoute }: SFCityProps = {}) {
  const skyPeriod  = useSkyPeriod();
  const randomSpawn = useSyncExternalStore(
    subscribeSpawnWorldOff,
    getClientSpawnWorldOff,
    serverSpawnWorldOff,
  );
  const spawnWorldOff = spawnOverride ?? randomSpawn;
  const worldRef        = useRef(spawnWorldOff);
  const keysRef         = useRef({ left: false, right: false });
  const facingRef       = useRef<'left' | 'right'>('right');
  const walkingRef      = useRef(false);
  const rafRef          = useRef<number | null>(null);
  const jumpingRef      = useRef(false);
  const jumpTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCountRef   = useRef(0);

  // ── SVG refs for imperative viewBox updates ────────────────────────────────
  const skyRef    = useRef<SVGSVGElement>(null);
  const midRef    = useRef<SVGSVGElement>(null);
  const midForegroundRef = useRef<SVGSVGElement>(null);
  const groundRef = useRef<SVGSVGElement>(null);
  const cabanaRef = useRef<SVGSVGElement>(null);
  const signsRef  = useRef<SVGSVGElement>(null);
  const welcomeRef = useRef<SVGSVGElement>(null);
  const cloudsRef = useRef<SVGSVGElement>(null);
  const lastMidScrollTileRef = useRef<number | null>(null);
  const lastGndScrollTileRef = useRef<number | null>(null);
  const lastSignCullOffRef = useRef<number | null>(null);

  /** Update scrolling SVG viewBoxes directly — zero React overhead. */
  const updateViewBoxes = (off: number) => {
    const skyVx = off * SKY_F;
    const midVx = off * MID_F;
    const gndVx = off * GND_F;
    const vb    = (x: number) => `${x} 0 1400 900`;
    skyRef.current?.setAttribute('viewBox', vb(skyVx));
    midRef.current?.setAttribute('viewBox', vb(midVx));
    midForegroundRef.current?.setAttribute('viewBox', vb(midVx));
    groundRef.current?.setAttribute('viewBox', vb(gndVx));
    cabanaRef.current?.setAttribute('viewBox', vb(gndVx));
    signsRef.current?.setAttribute('viewBox', vb(gndVx));
    welcomeRef.current?.setAttribute('viewBox', vb(gndVx));
    cloudsRef.current?.setAttribute('viewBox', vb(skyVx));
  };

  // ── Greeting / collision ───────────────────────────────────────────────────
  // Each NPC reports its world-x each frame (same coordinate space as worldRef).
  // Infinity until each NPC's RAF loop reports a live position — avoids
  // connecting to off-screen entry coords while the sprite is still hidden.
  const npcWorldXRefs     = useRef<number[]>(CHARACTERS.map(() => Infinity));
  const greetingRef       = useRef<number | null>(null);
  const nearNpcRef        = useRef<number | null>(null);
  const disconnectUntil   = useRef(0);

  // Venue deep links pin scroll on first paint; home uses SSR default then random spawn.
  // Mid scroll drives venue live/shell + invite UI; ground scroll drives sign tiles.
  const [midScrollWorldOff, setMidScrollWorldOff] = useState(
    () => spawnOverride ?? serverSpawnWorldOff(),
  );
  const [gndScrollWorldOff, setGndScrollWorldOff] = useState(
    () => spawnOverride ?? serverSpawnWorldOff(),
  );
  const [facing,    setFacing]    = useState<'left' | 'right'>('right');
  const [walking,   setWalking]   = useState(false);
  const [jumping,   setJumping]   = useState(false);
  const [playerDancing, setPlayerDancing] = useState(false);
  const [npcDancing,  setNpcDancing]  = useState<boolean[]>(() => CHARACTERS.map(() => false));
  const playerDancingRef = useRef(false);
  const npcDancingRef    = useRef<boolean[]>(CHARACTERS.map(() => false));
  const [greetingNpc, setGreetingNpc] = useState<number | null>(null);
  const [nearNpc,     setNearNpc]     = useState<number | null>(null);
  const [greetNpcX,   setGreetNpcX]   = useState(50);
  // ── Player chat ─────────────────────────────────────────────────────────────
  type ChatMode = null | 'chat' | 'ambient';
  const [showWelcome,   setShowWelcome]   = useState(false);
  const [playerName,    setPlayerName]    = useState<string | null>(null);
  const [chatMode,      setChatMode]      = useState<ChatMode>(null);
  const chatModeRef = useRef<ChatMode>(null);
  const [chatDraft,     setChatDraft]     = useState('');
  const [playerMessage, setPlayerMessage] = useState<string | null>(null);
  const [playerAmbientMessage, setPlayerAmbientMessage] = useState<string | null>(null);
  const ambientHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [npcMessage,    setNpcMessage]    = useState<string | null>(null);
  const [npcTyping,     setNpcTyping]     = useState(false);
  const [chatHistory,   setChatHistory]   = useState<ChatTurn[]>([]);
  const [chatSendTick,  setChatSendTick]  = useState(0);
  const [cinemaNowPlaying, setCinemaNowPlaying]   = useState<string | null>(null);
  const [concertNowPlaying, setConcertNowPlaying] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const playerNameRef = useRef<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const sentMessageRef = useRef('');
  const chatHistoryRef = useRef<ChatTurn[]>([]);
  const cinemaNowRef  = useRef<string | null>(null);
  const concertNowRef = useRef<string | null>(null);
  const greetingSessionRef = useRef<number | null>(null);
  const showWelcomeRef = useRef(false);

  // ── Multiplayer (PartyKit) ──────────────────────────────────────────────────
  // Random per-session balloon color. useSyncExternalStore gives a stable value
  // from the first client render (no SSR mismatch), so the join packet always
  // carries the real color rather than the default.
  const myColor = useSyncExternalStore(
    subscribeBalloonColor,
    getSessionBalloonColor,
    getServerBalloonColor,
  );
  // SSR/hydration: start from defaults; localStorage loadout applies after mount.
  const [playerLoadout, setPlayerLoadout] = useState<CharacterLoadout>(() => ({
    ...defaultLoadout(myColor),
    ...TEST_PLAYER_LOADOUT,
  }));

  useEffect(() => {
    setPlayerLoadout({ ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT });
  }, [myColor]);

  const handleVendorPurchase = useCallback((itemId: string) => {
    const next = equipLoadoutItem(itemId, myColor);
    if (next) setPlayerLoadout({ ...next, ...TEST_PLAYER_LOADOUT });
  }, [myColor]);

  const handleVendorUnequip = useCallback((itemId: string) => {
    const next = unequipLoadoutItem(itemId, myColor);
    if (next) setPlayerLoadout({ ...next, ...TEST_PLAYER_LOADOUT });
  }, [myColor]);

  const [vendorShopManualOpen, setVendorShopManualOpen] = useState(false);
  const [vendorShopDismissed, setVendorShopDismissed] = useState(false);

  const toggleVendorShop = useCallback(() => {
    setVendorShopManualOpen(open => {
      const next = !open;
      if (next) setVendorShopDismissed(false);
      return next;
    });
  }, []);

  const closeVendorShop = useCallback(() => {
    setVendorShopManualOpen(false);
    setVendorShopDismissed(true);
  }, []);

  const warmVendorShop = useCallback(() => {
    preloadVendorShopPanel();
    void preloadAllLoadoutSlots();
  }, []);

  // Peer (real human) 1:1 chat — mirrors the NPC greeting flow.
  const [peerChatId,  setPeerChatId]  = useState<string | null>(null);
  const [peerMessage, setPeerMessage] = useState<string | null>(null);
  const [peerTyping,  setPeerTyping]  = useState(false);
  const [nearPeer,    setNearPeer]    = useState<string | null>(null);
  const peerChatRef = useRef<string | null>(null);
  const nearPeerRef = useRef<string | null>(null);
  const lastSentRef = useRef<{ worldX: number; facing: 'left' | 'right'; walking: boolean }>(
    { worldX: NaN, facing: 'right', walking: false },
  );
  const beginPeerChatRef = useRef<((peerId: string, announce: boolean) => void) | null>(null);
  const endPeerChatRef   = useRef<((announce: boolean) => void) | null>(null);

  const ambientChats = useNpcAmbientChat(
    CHARACTERS.length,
    showWelcome || greetingNpc !== null || peerChatId !== null,
  );

  const profileRef = useRef<PlayerProfile>({
    name: null,
    balloonColor: myColor,
    loadout: serializeLoadout(playerLoadout),
  });
  profileRef.current = {
    name: playerName,
    balloonColor: myColor,
    loadout: serializeLoadout(playerLoadout),
  };

  const mp = useMultiplayer({
    profileRef,
    // The live camera offset doubles as the local player's world-x.
    spawnWorldOffRef: gameWorldOffRef,
    onPeerOpen:   pid => beginPeerChatRef.current?.(pid, false),
    onPeerClose:  pid => { if (peerChatRef.current === pid) endPeerChatRef.current?.(false); },
    onPeerLeft:   pid => { if (peerChatRef.current === pid) endPeerChatRef.current?.(false); },
    onPeerTyping: (pid, typing) => {
      if (peerChatRef.current !== pid) return;
      setPeerTyping(typing);
      if (typing) setPeerMessage(null);
    },
    onPeerMessage: (pid, text) => {
      if (peerChatRef.current !== pid) return;
      setPeerTyping(false);
      setPeerMessage(text);
    },
  });
  const mpRef = useRef(mp);
  mpRef.current = mp;
  const { sendProfile, sendPeerTyping } = mp;

  const beginPeerChat = useCallback((peerId: string, announce: boolean) => {
    // One conversation at a time — ignore if already talking to an NPC or peer.
    if (greetingRef.current !== null || peerChatRef.current !== null) return;
    const st = mpRef.current?.remoteStateRef.current?.get(peerId);
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenPct = st ? worldXToScreenPct(st.worldX, worldRef.current, width) : 50;
    peerChatRef.current = peerId;
    setPeerChatId(peerId);
    setGreetNpcX(screenPct);
    setPeerMessage(null);
    setPeerTyping(false);
    setPlayerMessage(null);
    const toward = screenPct < 50 ? 'left' : 'right';
    facingRef.current = toward; setFacing(toward);
    walkingRef.current = false; setWalking(false);
    nearPeerRef.current = null; setNearPeer(null);
    nearNpcRef.current = null;  setNearNpc(null);
    if (announce) mpRef.current?.openPeerChat(peerId);
    else playChatInviteBeep();
    setChatMode('chat');
    setTimeout(() => chatInputRef.current?.focus(), 120);
  }, []);
  beginPeerChatRef.current = beginPeerChat;

  const endPeerChat = useCallback((announce: boolean) => {
    const peer = peerChatRef.current;
    if (peer === null) return;
    if (announce) mpRef.current?.closePeerChat(peer);
    peerChatRef.current = null;
    setPeerChatId(null);
    setPeerMessage(null);
    setPeerTyping(false);
    setChatMode(null);
    setChatDraft('');
    setPlayerMessage(null);
    disconnectUntil.current = Date.now() + 2000;
  }, []);
  endPeerChatRef.current = endPeerChat;

  // Broadcast identity (name, color, loadout) whenever it changes.
  useEffect(() => {
    sendProfile({
      name: playerName,
      balloonColor: myColor,
      loadout: serializeLoadout(playerLoadout),
    });
  }, [playerName, myColor, playerLoadout, sendProfile]);

  // Relay "typing…" to the peer while the local player composes a message.
  useEffect(() => {
    if (peerChatId === null || chatDraft.length === 0) return;
    sendPeerTyping(peerChatId, true);
    const t = setTimeout(() => sendPeerTyping(peerChatId, false), 1500);
    return () => clearTimeout(t);
  }, [chatDraft, peerChatId, sendPeerTyping]);

  useLayoutEffect(() => {
    worldRef.current = spawnWorldOff;
    setMidScrollWorldOff(spawnWorldOff);
    setGndScrollWorldOff(spawnWorldOff);
    gameWorldOffRef.current = spawnWorldOff;
    updateViewBoxes(spawnWorldOff);
    npcWorldXRefs.current = CHARACTERS.map(() => Infinity);
    lastMidScrollTileRef.current = midScrollTile(spawnWorldOff);
    lastGndScrollTileRef.current = gndScrollTile(spawnWorldOff);
  // updateViewBoxes is stable (no deps); spawnWorldOff is the only meaningful dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnWorldOff]);
  useEffect(() => {
    const stored = getPlayerName();
    if (stored) {
      setPlayerName(stored);
      identifyPlayer(stored);
      const cancelIdle = scheduleIdleCallback(
        () => mpRef.current?.requestConnect(),
        { timeout: 4_000 },
      );
      return cancelIdle;
    }
    setShowWelcome(true);
  }, []);

  useEffect(() => {
    bootstrapStageSyncFromApi();
  }, []);

  useEffect(() => { showWelcomeRef.current = showWelcome; }, [showWelcome]);
  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);
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

  const clearAmbientHide = useCallback(() => {
    if (ambientHideRef.current) clearTimeout(ambientHideRef.current);
    ambientHideRef.current = null;
  }, []);

  const showPlayerAmbient = useCallback((text: string) => {
    clearAmbientHide();
    setPlayerAmbientMessage(text);
    ambientHideRef.current = setTimeout(() => {
      setPlayerAmbientMessage(null);
      ambientHideRef.current = null;
    }, PLAYER_AMBIENT_VISIBLE_MS);
  }, [clearAmbientHide]);

  useEffect(() => () => { clearAmbientHide(); }, [clearAmbientHide]);

  const handleSendMessage = (text: string) => {
    const filtered = filterChatMessage(text);
    if (!filtered.ok) {
      setChatDraft('');
      return;
    }
    const safe = filtered.text;
    setPlayerMessage(safe);
    setChatDraft('');
    if (peerChatRef.current !== null) {
      mpRef.current?.sendPeerMessage(peerChatRef.current, safe);
      mpRef.current?.sendPeerTyping(peerChatRef.current, false);
      return;
    }
    sentMessageRef.current = safe;
    setChatSendTick(t => t + 1);
  };

  const handleAmbientSend = (text: string) => {
    const filtered = filterChatMessage(text);
    setChatDraft('');
    setChatMode(null);
    if (!filtered.ok) return;
    showPlayerAmbient(filtered.text);
    mpRef.current?.sendAmbientMessage(filtered.text);
  };

  const handleWelcomeName = (name: string) => {
    savePlayerName(name);
    const profile = {
      name,
      balloonColor: myColor,
      loadout: serializeLoadout(playerLoadout),
    };
    profileRef.current = profile;
    setPlayerName(name);
    setShowWelcome(false);
    trackCharacterCreated(name);
    mpRef.current?.sendProfile(profile);
    mpRef.current?.requestConnect();
  };

  // ── Stage audio mute (YouTube players only) ────────────────────────────────
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  useEffect(() => {
    const SPEED      = 3.5;
    const GREET_DIST = 5; // % of viewport — must be quite close to "touch"

    const triggerJump = () => {
      if (jumpingRef.current) return;
      jumpingRef.current = true;
      setJumping(true);
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = setTimeout(() => {
        jumpTimerRef.current = null;
        jumpingRef.current   = false;
        setJumping(false);
      }, 560);
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
      if (peerChatRef.current !== null) {
        endPeerChatRef.current?.(true);
        return;
      }
      greetingRef.current = null;
      setGreetingNpc(null);
      disconnectUntil.current = Date.now() + 2000;
      setChatMode(null);
      setChatDraft('');
      setPlayerMessage(null);
    };

    const openChatPanel = () => {
      setChatMode('chat');
      setTimeout(() => chatInputRef.current?.focus(), 30);
    };

    const openAmbientPanel = () => {
      setChatMode('ambient');
      setTimeout(() => chatInputRef.current?.focus(), 30);
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (greetingRef.current !== null || peerChatRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          setChatMode(null);
          setChatDraft('');
        }
        return;
      }

      if (e.key === 'Enter' && chatModeRef.current === 'ambient') {
        return;
      }

      // Let the chat input handle its own keys without interference
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (['ArrowLeft',  'a', 'A'].includes(e.key)) { keysRef.current.left  = true;  e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keysRef.current.right = true;  e.preventDefault(); }
      if (
        !showWelcomeRef.current
        && ['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)
      ) {
        mpRef.current?.requestConnect();
      }
      if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
        e.preventDefault();
        if (greetingRef.current !== null || peerChatRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          triggerJump();
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (greetingRef.current !== null || peerChatRef.current !== null) {
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
        } else if (
          nearPeerRef.current !== null
          && Date.now() > disconnectUntil.current
        ) {
          beginPeerChatRef.current?.(nearPeerRef.current, true);
        } else if (!showWelcomeRef.current) {
          openAmbientPanel();
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

      const playerNear = greeting === null && isNearStage(off, off, width);
      if (playerNear !== playerDancingRef.current) {
        playerDancingRef.current = playerNear;
        setPlayerDancing(playerNear);
      } else if (greeting !== null && playerDancingRef.current) {
        playerDancingRef.current = false;
        setPlayerDancing(false);
      }

      const next = npcWorldXRefs.current.map((wx, i) =>
        greeting === i ? false : isNearStage(wx, off, width),
      );
      if (next.some((v, i) => v !== npcDancingRef.current[i])) {
        npcDancingRef.current = next;
        setNpcDancing([...next]);
      }
    };

    // Stream the local player's position to the room (~15 Hz, only on change).
    const broadcastMove = () => {
      if (showWelcomeRef.current) return;
      const last = lastSentRef.current;
      const wx = worldRef.current;
      const f  = facingRef.current;
      const w  = walkingRef.current;
      if (Math.abs(wx - last.worldX) > 1 || f !== last.facing || w !== last.walking) {
        last.worldX = wx; last.facing = f; last.walking = w;
        mpRef.current?.sendMove(wx, f, w);
      }
    };

    const tickNpcs = () => {
      runAllNpcMovementTicks(
        worldRef.current,
        window.innerWidth,
        npcWorldXRefs.current,
      );
    };

    const tickStagePlayers = () => {
      runAllStagePlayerSyncs();
    };

    const loop = () => {
      // While in any conversation (NPC or peer), freeze the player completely
      if (greetingRef.current !== null || peerChatRef.current !== null) {
        if (walkingRef.current) { walkingRef.current = false; setWalking(false); }
        frameCountRef.current++;
        tickNpcs();
        tickStagePlayers();
        if (frameCountRef.current % 4 === 0) { updateDanceState(worldRef.current); broadcastMove(); }
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

      // Always update viewBoxes imperatively — no React re-render
      updateViewBoxes(worldRef.current);
      tickNpcs();
      tickStagePlayers();

      // Re-render tile-bound layers only when the visible tile window changes.
      if (isWalking) {
        const off = worldRef.current;
        const midTile = midScrollTile(off);
        const gndTile = gndScrollTile(off);
        if (midTile !== lastMidScrollTileRef.current) {
          lastMidScrollTileRef.current = midTile;
          setMidScrollWorldOff(off);
        }
        if (gndTile !== lastGndScrollTileRef.current) {
          lastGndScrollTileRef.current = gndTile;
          setGndScrollWorldOff(off);
        }
        // Ground signs parallax-drift over stages within a tile — re-cull often.
        const lastCull = lastSignCullOffRef.current;
        if (lastCull == null || Math.abs(off - lastCull) >= 32) {
          lastSignCullOffRef.current = off;
          setGndScrollWorldOff(off);
        }
      }

      // Throttle proximity + dance checks to every 4 frames (~15 Hz).
      // These don't need 60 Hz precision — 15 Hz is imperceptibly snappy.
      frameCountRef.current++;
      if (frameCountRef.current % 4 === 0) {
        broadcastMove();

        // Proximity check only — connection requires Enter. Picks the single
        // closest interactable (NPC or real player) within touch range.
        if (greetingRef.current === null && peerChatRef.current === null) {
          const width = window.innerWidth;
          const greetDistPx = (GREET_DIST / 100) * width;
          let nextNpc: number | null = null;
          let nextPeer: string | null = null;
          let bestDist = Infinity;
          if (Date.now() > disconnectUntil.current) {
            for (let i = 0; i < npcWorldXRefs.current.length; i++) {
              const wx = npcWorldXRefs.current[i];
              if (!Number.isFinite(wx)) continue;
              const screenPct = worldXToScreenPct(wx, worldRef.current, width);
              const distPx    = Math.abs(wx - worldRef.current);
              if (screenPct >= 5 && screenPct <= 95 && distPx < greetDistPx && distPx < bestDist) {
                bestDist = distPx; nextNpc = i; nextPeer = null;
              }
            }
            const roster = mpRef.current?.remoteStateRef.current;
            if (roster) {
              for (const [pid, st] of roster) {
                const screenPct = worldXToScreenPct(st.worldX, worldRef.current, width);
                const distPx    = Math.abs(st.worldX - worldRef.current);
                if (screenPct >= 5 && screenPct <= 95 && distPx < greetDistPx && distPx < bestDist) {
                  bestDist = distPx; nextPeer = pid; nextNpc = null;
                }
              }
            }
          }
          if (nextNpc !== nearNpcRef.current) {
            nearNpcRef.current = nextNpc;
            setNearNpc(nextNpc);
          }
          if (nextPeer !== nearPeerRef.current) {
            nearPeerRef.current = nextPeer;
            setNearPeer(nextPeer);
          }
        } else {
          if (nearNpcRef.current !== null)  { nearNpcRef.current = null;  setNearNpc(null); }
          if (nearPeerRef.current !== null) { nearPeerRef.current = null; setNearPeer(null); }
        }

        updateDanceState(worldRef.current);
      }

      gameWorldOffRef.current = worldRef.current;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current)     cancelAnimationFrame(rafRef.current);
      if (jumpTimerRef.current) { clearTimeout(jumpTimerRef.current); jumpTimerRef.current = null; }
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  const inConversation = greetingNpc !== null || peerChatId !== null;
  const showVendorShop =
    greetingNpc !== null && isBuzNpc(CHARACTERS[greetingNpc]?.id ?? '');
  const showVendorPanel =
    vendorShopManualOpen || (showVendorShop && !vendorShopDismissed);

  useEffect(() => {
    if (!showVendorShop) setVendorShopDismissed(false);
  }, [showVendorShop]);

  useEffect(() => {
    if (nearNpc === null) return;
    if (!isBuzNpc(CHARACTERS[nearNpc]?.id ?? '')) return;
    warmVendorShop();
  }, [nearNpc, warmVendorShop]);

  useEffect(() => {
    if (!showVendorPanel) return;
    warmVendorShop();
  }, [showVendorPanel, warmVendorShop]);

  const conversationPartnerName = peerChatId !== null
    ? (mp.remoteStateRef.current.get(peerChatId)?.name ?? 'Wanderer')
    : greetingNpc !== null ? CHARACTERS[greetingNpc]?.name : null;
  const nearPeerName = nearPeer !== null
    ? (mp.remoteStateRef.current.get(nearPeer)?.name ?? 'Wanderer')
    : null;

  return (
    <div
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', animation: 'fdi 1.5s ease' }}
    >
      <style>{CHARACTER_STYLES}</style>

      <SkyLayer ref={skyRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
      <SkyCloudsLayer ref={cloudsRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
      <SkyCreaturesLayer period={skyPeriod} />
      <MidLayer ref={midRef} foregroundRef={midForegroundRef} worldOff={midScrollWorldOff} deepLinkRoute={venueRoute} />
      <GroundLayer      ref={groundRef} worldOff={gndScrollWorldOff} />
      <CabanaForegroundLayer ref={cabanaRef} worldOff={gndScrollWorldOff} />
      <VenueSignsLayer  ref={signsRef}  worldOff={gndScrollWorldOff} />
      {!venueRoute && (
        <WelcomeSignLayer
          ref={welcomeRef}
          spawnWorldOff={spawnWorldOff}
        />
      )}

      <LovingCarLayer />

      <BottomControlPanel
        worldOff={midScrollWorldOff}
        playerName={playerName}
        venueRoute={venueRoute}
        connectName={
          !inConversation && nearNpc !== null
            ? CHARACTERS[nearNpc]?.name
            : !inConversation && nearPeer !== null
              ? nearPeerName
              : null
        }
        hidden={showWelcome}
        vendorShopOpen={vendorShopManualOpen}
        onToggleVendorShop={toggleVendorShop}
        onVendorShopWarm={warmVendorShop}
      />

      {/* Autonomous NPCs */}
      {CHARACTERS.map((cfg, i) => {
        if (TEST_SPAWN_NPC_ID && cfg.id !== TEST_SPAWN_NPC_ID) return null;
        const testing = TEST_SPAWN_NPC_ID === cfg.id;
        return (
        <NPC
          key={cfg.id}
          index={i}
          {...cfg}
          stageAnchor={cfg.stageAnchor}
          startX={testing ? 55 : cfg.startX}
          entryDelay={testing ? 0 : cfg.entryDelay}
          paused={greetingNpc === i}
          greeting={greetingNpc === i}
          greetFacing={greetNpcX < 50 ? 'right' : 'left'}
          dancing={TEST_FORCE_DANCE || npcDancing[i]}
          greetingChat={greetingNpc === i ? {
            name: cfg.name,
            npcTyping,
            npcMessage,
          } : undefined}
          ambientChat={
            greetingNpc !== i && ambientChats[i]?.message
              ? { name: cfg.name, message: ambientChats[i]!.message! }
              : undefined
          }
        />
        );
      })}

      {/* Remote human players (PartyKit presence) */}
      {mp.remoteIds.map(pid => (
        <RemotePlayer
          key={pid}
          id={pid}
          stateRef={mp.remoteStateRef}
          ambientRef={mp.ambientRef}
          greeting={peerChatId === pid}
          greetingChat={peerChatId === pid ? {
            name: mp.remoteStateRef.current.get(pid)?.name ?? 'Wanderer',
            npcTyping: peerTyping,
            npcMessage: peerMessage,
          } : undefined}
        />
      ))}

      {TEST_PLAYER_VARIANT_GALLERY ? (
        <PlayerVariantGallery
          walking={walking}
          dancing={TEST_FORCE_DANCE || playerDancing}
        />
      ) : (
        /* Player — world scrolls, character stays centred */
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: CHAR_BOTTOM,
          zIndex: inConversation ? 200 : 20,
        }}>
          <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
            <Character
              walking={walking}
              facing={facing}
              dancing={TEST_FORCE_DANCE || playerDancing}
              balloonColor={myColor}
              loadout={playerLoadout}
              bubbleSide={playerBubbleSide(greetNpcX)}
              chatOverlay={
                inConversation ? (
                  <PlayerChatOverlay
                    npcScreenX={greetNpcX}
                    chatMode={chatMode === 'ambient' ? null : chatMode}
                    playerName={playerName}
                    playerMessage={playerMessage}
                    chatDraft={chatDraft}
                    setChatDraft={setChatDraft}
                    onSendMessage={handleSendMessage}
                    chatInputRef={chatInputRef}
                  />
                ) : (
                  <AmbientPlayerOverlay
                    chatMode={chatMode}
                    playerName={playerName}
                    ambientMessage={playerAmbientMessage}
                    chatDraft={chatDraft}
                    setChatDraft={setChatDraft}
                    onSendMessage={handleAmbientSend}
                    chatInputRef={chatInputRef}
                    side={facing === 'left' ? 'right' : 'left'}
                  />
                )
              }
            />
          </div>
        </div>
      )}

      {showVendorPanel && (
        <VendorShopPanel
          loadout={playerLoadout}
          onPurchase={handleVendorPurchase}
          onUnequip={handleVendorUnequip}
          onClose={closeVendorShop}
        />
      )}

      {/* Greeting status bar */}
      {inConversation && chatMode !== 'chat' && (
        <div data-paraloid-ui style={{
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
          <span>↑ or esc · say goodbye to {conversationPartnerName}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span>↵ chat</span>
        </div>
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
        background: 'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 38%, rgba(0,0,0,.5) 100%)',
      }} />

      <StickerTripOverlay active={hasStickerTripActive(playerLoadout)} />

      {/* Welcome popup — shown on first visit (no stored name). */}
      {showWelcome && (
        <WelcomePopup
          balloonColor={myColor}
          onEnter={handleWelcomeName}
        />
      )}

     

      {/* Keyboard hint + mute — hidden on mobile, bottom-right */}
      <div data-paraloid-ui className="hidden md:flex" style={{
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
      <div data-paraloid-ui className="flex md:hidden" style={{
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
