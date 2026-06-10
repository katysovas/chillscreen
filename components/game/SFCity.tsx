'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Character from './Character';
import NPC, { worldXToScreenPct } from './NPC';
import { AmbientPlayerOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
import { playerBubbleSide } from './ChatBubble';
import { CHAR_BOTTOM, crowdDepthOffsetPx } from './groundLayout';
import { SKY_F, MID_F, GND_F, midScrollTile, gndScrollTile } from '@/lib/parallax';
import { scheduleIdleCallback } from '@/lib/scheduleIdleCallback';
import { setAudioMuted } from '@/lib/audioMute';
import { playChatInviteBeep } from '@/lib/playChatInviteBeep';
import { SFX_VOLUME } from '@/lib/sfxVolume';
import { npcCastForVenue } from '@/lib/npcCast';
import RemotePlayer from './RemotePlayer';
import { PLAYER_AMBIENT_VISIBLE_MS, useMultiplayer } from '@/lib/multiplayer/useMultiplayer';
import { filterChatMessage } from '@/lib/messageFilter';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import type { PlayerProfile } from '@/lib/multiplayer/protocol';
import { getPlayerLoadout, unequipLoadoutItem } from '@/lib/playerLoadout';
import { addPlayerCoins, getPlayerCoins, STARTING_COINS } from '@/lib/playerCoins';
import { GroundScoreLayer } from './GroundScoreLayer';
import { purchaseVendorItem } from '@/lib/vendorPurchase';
import { preloadPurchaseSound, unlockPurchaseSound } from '@/lib/playPurchaseSound';
import { serializeLoadout } from '@/lib/multiplayer/loadoutSync';
import { isBuzNpc } from '@/lib/vendorShop';
import {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName as savePlayerName,
} from '@/lib/playerStorage';
import { identifyPlayer, trackCharacterCreated } from '@/lib/analytics';
import { installGameInputAnalytics, trackMobileControl } from '@/lib/gameInputAnalytics';
import { pickFallbackReply, type ChatTurn } from '@/lib/npcChat';
import { fetchNpcReplyWithTyping } from '@/lib/npcChatClient';
import { getCinemaNowPlaying, subscribeCinemaNowPlaying } from '@/lib/cinemaNow';
import { getConcertNowPlaying, subscribeConcertNowPlaying } from '@/lib/concertNowPlaying';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import {
  moveBroadcastFrameInterval,
  moveBroadcastWorldEpsilon,
} from '@/lib/presenceBroadcast';
import { isNearStage } from '@/lib/concertDance';
import {
  cityTileForRoute,
  cityWorldOffBounds,
  partyRoomIdForRoute,
  stageChannelForRoute,
  stageWorldOffForRoute,
} from '@/lib/isolatedCity';
import { setPinnedStageChannel } from '@/lib/pinnedStageChannel';
import { setVenueDressCode } from '@/lib/dressCode';
import { LovingCarLayer } from './LovingCar';
import { WelcomePopup } from './WelcomePopup';
import { CityNavSigns } from './CityNavSigns';
import { StagePicker } from './StagePicker';
import { SkyCreaturesLayer } from './SkyCreatures';
import { SkyLayer } from './city/SkyLayer';
import { SkyCloudsLayer } from './city/SkyCloudsLayer';
import { MidLayer } from './city/MidLayer';
import { GroundLayer } from './city/GroundLayer';
import { CabanaForegroundLayer } from './city/CabanaForegroundLayer';
import { PlayerVariantGallery } from './PlayerVariantGallery';
import { useSkyPeriod } from './hooks/useSkyPeriod';
import { useNpcAmbientChat } from './hooks/useNpcAmbientChat';
import { MobileGameControls } from './MobileGameControls';
import { MobileChatInputBar } from './MobileChatInputBar';
import { venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { isMobileLoungeDevice } from '@/lib/mobileLounge';
import { BottomControlPanel } from './BottomControlPanel';
import { VendorShopPanel, preloadVendorShopPanel } from './VendorShopPanelLazy';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import { hasStickerTripActive, preloadAllLoadoutSlots, StickerTripOverlay } from './characters/loadout';
import { runAllNpcMovementTicks } from '@/lib/npcMovementRegistry';
import { runAllStagePlayerSyncs } from '@/lib/stagePlayerRegistry';
import type { CharacterLoadout } from './characters/loadout';
import { defaultLoadout } from './characters/loadout';

/** Set to an NPC id to spawn only that character immediately (testing). */
const TEST_SPAWN_NPC_ID: string | null = null;

/** Force all characters into dance mode regardless of stage proximity (testing). */
const TEST_FORCE_DANCE = false;

/** Show all four player variant skins side-by-side (testing). */
const TEST_PLAYER_VARIANT_GALLERY = false;

/** Equip loadout items on the player at startup (testing). */
const TEST_PLAYER_LOADOUT = {} as const;

// ─── NPC cast ─────────────────────────────────────────────────────────────────

// Characters are defined in characters.ts (names, personalities, AI chat).

// ─── Main ─────────────────────────────────────────────────────────────────────

type SFCityProps = {
  /** When set (venue deep link), spawn centered on that stage. */
  spawnWorldOff?: number;
  /** Venue for this city page — required in isolated city mode. */
  venueRoute: VenueRoute;
  /** Home `/` backdrop — locked on stage, no gameplay UI. */
  homePreview?: boolean;
  /** Controlled mute when `homePreview` (lifted to HomeCityPicker). */
  muted?: boolean;
};

export default function SFCity({
  spawnWorldOff: spawnOverride,
  venueRoute,
  homePreview = false,
  muted: mutedProp,
}: SFCityProps) {
  const router = useRouter();
  const skyPeriod  = useSkyPeriod();

  const [mobileDevice, setMobileDevice] = useState(
    () => typeof window !== 'undefined' && isMobileLoungeDevice(),
  );
  const [showCityPicker, setShowCityPicker] = useState(false);
  const showCityPickerRef = useRef(false);
  const connectNearRef = useRef<(() => void) | null>(null);

  const effectiveVenueRoute = venueRoute;
  // Generated crowd for this stage (+ local Buz). Falls back to legacy cast when
  // no generated NPCs are saved for the channel yet.
  const npcCast = useMemo(
    () => npcCastForVenue(effectiveVenueRoute),
    [effectiveVenueRoute],
  );
  const isolatedTile = cityTileForRoute(effectiveVenueRoute);
  const cityBounds = cityWorldOffBounds(effectiveVenueRoute);
  const cityBoundsRef = useRef(cityBounds);
  cityBoundsRef.current = cityBounds;

  // Clamp into city bounds — wide stages (EDC, Coachella) center past the
  // tile edge, and the walk loop clamps every frame; an out-of-bounds spawn
  // would instantly teleport the view off the single rendered tile.
  const rawSpawn = homePreview || spawnOverride == null
    ? stageWorldOffForRoute(effectiveVenueRoute)
    : spawnOverride;
  const spawnWorldOff = Math.max(cityBounds.min, Math.min(cityBounds.max, rawSpawn));
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
  const cloudsRef = useRef<SVGSVGElement>(null);
  const navSignsRef = useRef<SVGSVGElement>(null);
  const lastMidScrollTileRef = useRef<number | null>(null);
  const lastGndScrollTileRef = useRef<number | null>(null);

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
    navSignsRef.current?.setAttribute('viewBox', vb(gndVx));
    cloudsRef.current?.setAttribute('viewBox', vb(skyVx));
  };

  // ── Greeting / collision ───────────────────────────────────────────────────
  // Each NPC reports its world-x each frame (same coordinate space as worldRef).
  // Infinity until each NPC's RAF loop reports a live position — avoids
  // connecting to off-screen entry coords while the sprite is still hidden.
  const npcWorldXRefs     = useRef<number[]>(npcCast.map(() => Infinity));
  const greetingRef       = useRef<number | null>(null);
  const nearNpcRef        = useRef<number | null>(null);
  const disconnectUntil   = useRef(0);

  // Pin scroll to the (clamped) city spawn on first paint.
  // Mid scroll drives venue live/shell + invite UI; ground layers scroll imperatively.
  const [midScrollWorldOff, setMidScrollWorldOff] = useState(spawnWorldOff);
  const [gndScrollWorldOff, setGndScrollWorldOff] = useState(spawnWorldOff);
  const [facing,    setFacing]    = useState<'left' | 'right'>('right');
  const [walking,   setWalking]   = useState(false);
  const [jumping,   setJumping]   = useState(false);
  const [playerDancing, setPlayerDancing] = useState(false);
  const [npcDancing,  setNpcDancing]  = useState<boolean[]>(() => npcCast.map(() => false));
  const playerDancingRef = useRef(false);
  const npcDancingRef    = useRef<boolean[]>(npcCast.map(() => false));
  const [greetingNpc, setGreetingNpc] = useState<number | null>(null);
  const [nearNpc,     setNearNpc]     = useState<number | null>(null);
  const [greetNpcX,   setGreetNpcX]   = useState(50);
  // ── Player chat ─────────────────────────────────────────────────────────────
  type ChatMode = null | 'chat' | 'ambient';
  const [showWelcome,   setShowWelcome]   = useState(false);
  const [playerName,    setPlayerName]    = useState<string | null>(null);
  const [playerDepthY,  setPlayerDepthY]  = useState(0);
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
  const [playerCoins, setPlayerCoins] = useState(STARTING_COINS);

  useEffect(() => {
    setPlayerLoadout({ ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT });
    setPlayerCoins(getPlayerCoins());
  }, [myColor]);

  const handleVendorPurchase = useCallback((itemId: string): boolean => {
    const coinsBefore = getPlayerCoins();
    const result = purchaseVendorItem(itemId, myColor);
    if (!result.ok) return false;
    setPlayerLoadout({ ...result.loadout, ...TEST_PLAYER_LOADOUT });
    setPlayerCoins(result.coins);
    return result.charged || result.coins < coinsBefore;
  }, [myColor]);

  const handleVendorUnequip = useCallback((itemId: string) => {
    const next = unequipLoadoutItem(itemId, myColor);
    if (next) setPlayerLoadout({ ...next, ...TEST_PLAYER_LOADOUT });
  }, [myColor]);

  const [vendorShopManualOpen, setVendorShopManualOpen] = useState(false);
  const [vendorShopDismissed, setVendorShopDismissed] = useState(false);

  const toggleVendorShop = useCallback(() => {
    unlockPurchaseSound();
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
    preloadPurchaseSound();
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
    npcCast,
    showWelcome || showCityPicker || greetingNpc !== null || peerChatId !== null,
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
    spawnWorldOffRef: gameWorldOffRef,
    roomId: partyRoomIdForRoute(effectiveVenueRoute),
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
    if (isMobileLoungeDevice()) trackMobileControl('connect_peer');
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
    npcWorldXRefs.current = npcCast.map(() => Infinity);
    lastMidScrollTileRef.current = midScrollTile(spawnWorldOff);
    lastGndScrollTileRef.current = gndScrollTile(spawnWorldOff);
  // updateViewBoxes is stable (no deps); spawnWorldOff is the only meaningful dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnWorldOff]);

  const navigateToCity = useCallback((route: VenueRoute) => {
    if (route === effectiveVenueRoute) {
      setShowCityPicker(false);
      return;
    }
    router.push(`/${venueSlugForRoute(route)}`);
  }, [effectiveVenueRoute, router]);

  useEffect(() => {
    setMobileDevice(isMobileLoungeDevice());

    if (homePreview) return;

    const storedName = getPlayerName();
    if (storedName) {
      setPlayerName(storedName);
      identifyPlayer(storedName);
      return scheduleIdleCallback(
        () => mpRef.current?.requestConnect(),
        { timeout: 4_000 },
      );
    }

    setShowWelcome(true);
  }, [homePreview]);

  useEffect(() => {
    bootstrapStageSyncFromApi();
    installGameInputAnalytics();
    setPlayerDepthY(crowdDepthOffsetPx(getOrCreatePlayerId()));
  }, []);

  // Keep this city's stage mounted + audible regardless of scroll position.
  useEffect(() => {
    setPinnedStageChannel(stageChannelForRoute(effectiveVenueRoute));
    setVenueDressCode(effectiveVenueRoute);
    return () => {
      setPinnedStageChannel(null);
      setVenueDressCode(null);
    };
  }, [effectiveVenueRoute]);

  useEffect(() => { showWelcomeRef.current = showWelcome; }, [showWelcome]);
  useEffect(() => { showCityPickerRef.current = showCityPicker; }, [showCityPicker]);
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

    const character = npcCast[greetingNpc];
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

    const character = npcCast[greetingNpc];
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

  // ── Ground Score — sidewalk coin pickups ───────────────────────────────────
  const handleGroundScore = useCallback((value: number) => {
    setPlayerCoins(addPlayerCoins(value));
    const message = `Ground Score! ${value} Coins!`;
    showPlayerAmbient(message);
    mpRef.current?.sendAmbientMessage(message);
    try {
      const found = new Audio('/audio/found.wav');
      found.volume = SFX_VOLUME;
      void found.play().catch(() => {});
    } catch { /* ignore */ }
    // Celebrate — same jump as the keyboard/mobile triggers.
    if (!jumpingRef.current) {
      jumpingRef.current = true;
      setJumping(true);
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = setTimeout(() => {
        jumpTimerRef.current = null;
        jumpingRef.current = false;
        setJumping(false);
      }, 560);
    }
  }, [showPlayerAmbient]);

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

  const handleWelcomeName = (name: string, route: VenueRoute) => {
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
    if (route !== effectiveVenueRoute) {
      navigateToCity(route);
    }
  };

  const handleCityPickerEnter = useCallback((name: string, route: VenueRoute) => {
    if (!getPlayerName() && name) {
      savePlayerName(name);
      identifyPlayer(name);
      setPlayerName(name);
    }
    closeVendorShop();
    navigateToCity(route);
  }, [closeVendorShop, navigateToCity]);

  const handleOpenAmbientChat = useCallback(() => {
    if (greetingNpc !== null || peerChatId !== null) return;
    if (chatMode === 'ambient') {
      setChatMode(null);
      setChatDraft('');
      return;
    }
    setChatMode('ambient');
    window.setTimeout(() => chatInputRef.current?.focus(), 30);
  }, [greetingNpc, peerChatId, chatMode]);

  // ── Stage audio mute (YouTube players only) ────────────────────────────────
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setAudioMuted(homePreview ? (mutedProp ?? false) : muted);
  }, [homePreview, muted, mutedProp]);

  useEffect(() => {
    if (homePreview) return;

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
      if (mobileDevice) {
        trackMobileControl('connect_npc');
        setChatMode('chat');
        setTimeout(() => chatInputRef.current?.focus(), 120);
      }
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

      // Let the chat input / contact form handle their own keys without interference
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (['ArrowLeft',  'a', 'A'].includes(e.key)) { keysRef.current.left  = true;  e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keysRef.current.right = true;  e.preventDefault(); }
      if (
        !showWelcomeRef.current
        && !showCityPickerRef.current
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

    // Stream local position to PartyKit — ~15 Hz desktop, ~7.5 Hz mobile, only on change.
    const broadcastMove = () => {
      if (showWelcomeRef.current || showCityPickerRef.current) return;
      const last = lastSentRef.current;
      const wx = worldRef.current;
      const f  = facingRef.current;
      const w  = walkingRef.current;
      const eps = moveBroadcastWorldEpsilon();
      if (Math.abs(wx - last.worldX) > eps || f !== last.facing || w !== last.walking) {
        last.worldX = wx; last.facing = f; last.walking = w;
        mpRef.current?.sendMove(wx, f, w);
      }
    };

    const shouldBroadcastMove = () =>
      frameCountRef.current % moveBroadcastFrameInterval() === 0;

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

    connectNearRef.current = () => {
      if (greetingRef.current !== null || peerChatRef.current !== null) return;
      if (Date.now() <= disconnectUntil.current) return;
      if (nearNpcRef.current !== null) {
        const i = nearNpcRef.current;
        const width = window.innerWidth;
        const screenPct = worldXToScreenPct(
          npcWorldXRefs.current[i], worldRef.current, width,
        );
        connectToNpc(i, screenPct);
      } else if (nearPeerRef.current !== null) {
        beginPeerChatRef.current?.(nearPeerRef.current, true);
      }
    };

    const loop = () => {
      const inChatFreeze = greetingRef.current !== null || peerChatRef.current !== null;
      const noWalk = inChatFreeze;

      if (noWalk) {
        keysRef.current.left = false;
        keysRef.current.right = false;
        if (walkingRef.current) { walkingRef.current = false; setWalking(false); }
      }

      // While in any conversation (NPC or peer), skip movement only
      if (inChatFreeze) {
        frameCountRef.current++;
        tickNpcs();
        tickStagePlayers();
        updateViewBoxes(worldRef.current);
        if (frameCountRef.current % 4 === 0) updateDanceState(worldRef.current);
        if (shouldBroadcastMove()) broadcastMove();
        gameWorldOffRef.current = worldRef.current;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { left, right } = keysRef.current;
      let isWalking = false;

      if (!noWalk) {
        if (left && !right) {
          worldRef.current -= SPEED;
          if (facingRef.current !== 'left') { facingRef.current = 'left'; setFacing('left'); }
          isWalking = true;
        } else if (right && !left) {
          worldRef.current += SPEED;
          if (facingRef.current !== 'right') { facingRef.current = 'right'; setFacing('right'); }
          isWalking = true;
        }
        const { min, max } = cityBoundsRef.current;
        worldRef.current = Math.max(min, Math.min(max, worldRef.current));
      }

      if (isWalking !== walkingRef.current) {
        walkingRef.current = isWalking;
        setWalking(isWalking);
      }

      // Always update viewBoxes + sign overlap imperatively — no React re-render
      const off = worldRef.current;
      updateViewBoxes(off);
      tickNpcs();
      tickStagePlayers();

      // Re-render layers only when the visible tile window changes — avoids per-frame React re-renders.
      if (isWalking) {
        const midTile = midScrollTile(off);
        if (midTile !== lastMidScrollTileRef.current) {
          lastMidScrollTileRef.current = midTile;
          setMidScrollWorldOff(off);
        }
        const gndTile = gndScrollTile(off);
        if (gndTile !== lastGndScrollTileRef.current) {
          lastGndScrollTileRef.current = gndTile;
          setGndScrollWorldOff(off);
        }
      }

      // Throttle proximity + dance checks to every 4 frames (~15 Hz).
      // These don't need 60 Hz precision — 15 Hz is imperceptibly snappy.
      frameCountRef.current++;
      if (frameCountRef.current % 4 === 0) {
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

      if (shouldBroadcastMove()) broadcastMove();

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
  }, [homePreview]);

  // Home backdrop — keep stage video in sync without gameplay loop.
  useEffect(() => {
    if (!homePreview) return;

    bootstrapStageSyncFromApi();

    const loop = () => {
      runAllStagePlayerSyncs();
      updateViewBoxes(worldRef.current);
      gameWorldOffRef.current = worldRef.current;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homePreview]);

  const inConversation = greetingNpc !== null || peerChatId !== null;
  const showMobileChatBar = mobileDevice
    && !showWelcome
    && !showCityPicker
    && (
      (chatMode === 'ambient' && !inConversation)
      || (chatMode === 'chat' && inConversation)
    );
  const showVendorShop =
    greetingNpc !== null && isBuzNpc(npcCast[greetingNpc]?.id ?? '');
  const showVendorPanel =
    vendorShopManualOpen || (showVendorShop && !vendorShopDismissed);

  useEffect(() => {
    if (!showVendorShop) setVendorShopDismissed(false);
  }, [showVendorShop]);

  useEffect(() => {
    if (nearNpc === null) return;
    if (!isBuzNpc(npcCast[nearNpc]?.id ?? '')) return;
    warmVendorShop();
  }, [nearNpc, warmVendorShop]);

  useEffect(() => {
    if (!showVendorPanel) return;
    warmVendorShop();
  }, [showVendorPanel, warmVendorShop]);

  const conversationPartnerName = peerChatId !== null
    ? (mp.remoteStateRef.current.get(peerChatId)?.name ?? 'Wanderer')
    : greetingNpc !== null ? npcCast[greetingNpc]?.name : null;
  const nearPeerName = nearPeer !== null
    ? (mp.remoteStateRef.current.get(nearPeer)?.name ?? 'Wanderer')
    : null;

  return (
    <div
      className="game-surface"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        animation: 'fdi 1.5s ease',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div>
        <SkyLayer ref={skyRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
        <SkyCloudsLayer ref={cloudsRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
        <SkyCreaturesLayer period={skyPeriod} />
        <MidLayer
          ref={midRef}
          foregroundRef={midForegroundRef}
          worldOff={midScrollWorldOff}
          deepLinkRoute={effectiveVenueRoute}
          hideTrees={mobileDevice}
          isolatedTileIndex={isolatedTile}
        />
        <GroundLayer
          ref={groundRef}
          worldOff={gndScrollWorldOff}
          hideTrees={mobileDevice}
          hideStreetDogs={effectiveVenueRoute === 'silent-disco'}
          isolatedTileIndex={isolatedTile}
        />
        <CabanaForegroundLayer ref={cabanaRef} worldOff={gndScrollWorldOff} />
        {effectiveVenueRoute !== 'silent-disco' && <LovingCarLayer />}

        {!homePreview && (
          <GroundScoreLayer
            active={!showWelcome && !showCityPicker}
            onPickup={handleGroundScore}
          />
        )}

        {!homePreview && (
          <CityNavSigns
            ref={navSignsRef}
            route={effectiveVenueRoute}
            worldOff={gndScrollWorldOff}
            active={!showWelcome && !showCityPicker}
          />
        )}

        {/* Autonomous NPCs */}
        {!homePreview && npcCast.map((cfg, i) => {
          if (TEST_SPAWN_NPC_ID && cfg.id !== TEST_SPAWN_NPC_ID) return null;
          const testing = TEST_SPAWN_NPC_ID === cfg.id;
          return (
          <NPC
            key={cfg.id}
            characterId={cfg.id}
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
        {!homePreview && mp.remoteIds.map(pid => (
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

        {!homePreview && (TEST_PLAYER_VARIANT_GALLERY ? (
          <PlayerVariantGallery
            walking={walking}
            dancing={TEST_FORCE_DANCE || playerDancing}
          />
        ) : (
          /* Player — world scrolls, character stays centred */
          <div
            className="game-character"
            style={{
            position: 'absolute',
            left: '50%',
            bottom: CHAR_BOTTOM,
            transform: `translateY(${playerDepthY}px)`,
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
                      mobileNativeInput={mobileDevice}
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
                      mobileNativeInput={mobileDevice}
                    />
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>

      {!homePreview && (
      <>
      <BottomControlPanel
        worldOff={midScrollWorldOff}
        playerName={playerName}
        venueRoute={effectiveVenueRoute}
        connectName={
          !inConversation && nearNpc !== null
            ? npcCast[nearNpc]?.name
            : !inConversation && nearPeer !== null
              ? nearPeerName
              : null
        }
        hidden={showWelcome || showCityPicker}
        onConnectTap={mobileDevice ? () => connectNearRef.current?.() : undefined}
        onOpenCityPicker={() => setShowCityPicker(true)}
        vendorShopOpen={vendorShopManualOpen}
        onToggleVendorShop={toggleVendorShop}
        onVendorShopWarm={warmVendorShop}
        isMobile={mobileDevice}
      />

      {showVendorPanel && (
        <VendorShopPanel
          loadout={playerLoadout}
          coins={playerCoins}
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

      <StickerTripOverlay active={hasStickerTripActive(playerLoadout)} />

      {showWelcome && (
        <WelcomePopup
          balloonColor={myColor}
          initialRoute={effectiveVenueRoute}
          onEnter={handleWelcomeName}
        />
      )}

      {showCityPicker && (
        <StagePicker
          variant="swap"
          requireName={false}
          initialRoute={effectiveVenueRoute}
          onEnter={handleCityPickerEnter}
          onClose={() => setShowCityPicker(false)}
        />
      )}

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

      {showMobileChatBar && (
        <MobileChatInputBar
          value={chatDraft}
          onChange={setChatDraft}
          placeholder={
            chatMode === 'ambient'
              ? 'Shout something…'
              : 'Say something…'
          }
          inputRef={chatInputRef}
          onSend={() => {
            const text = chatDraft.trim();
            if (!text) return;
            if (chatMode === 'ambient') handleAmbientSend(text);
            else handleSendMessage(text);
          }}
          onClose={() => {
            setChatMode(null);
            setChatDraft('');
          }}
        />
      )}

      {!showWelcome && !showCityPicker && (
        <MobileGameControls
          muted={muted}
          vendorShopOpen={vendorShopManualOpen}
          onToggleVendorShop={toggleVendorShop}
          onVendorShopWarm={warmVendorShop}
          onOpenStageSwap={() => setShowCityPicker(true)}
          onOpenAmbientChat={mobileDevice ? handleOpenAmbientChat : undefined}
          ambientChatOpen={chatMode === 'ambient'}
          onToggleMute={() => setMuted(m => !m)}
        />
      )}

      </>
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
        background: 'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 38%, rgba(0,0,0,.5) 100%)',
      }} />

    </div>
  );
}
