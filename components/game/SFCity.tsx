'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Character from './Character';
import NPC, { worldXToScreenPct } from './NPC';
import { AmbientPlayerOverlay, NpcPairChatOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
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
import type { NpcConvoMeta, PlayerProfile } from '@/lib/multiplayer/protocol';
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
  stageWorldOffForRoute,
} from '@/lib/isolatedCity';
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
import { AMBIENT_CHAT_ENABLED } from '@/lib/ambientChatEnabled';
import { useRoomChatter } from './hooks/useRoomChatter';
import { npcChatLabelForId } from '@/lib/npcRoster';
import { MobileGameControls } from './MobileGameControls';
import { MobileChatInputBar } from './MobileChatInputBar';
import { venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { isMobileLoungeDevice } from '@/lib/mobileLounge';
import { BottomControlPanel } from './BottomControlPanel';
import { VendorShopPanel, preloadVendorShopPanel } from './VendorShopPanelLazy';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import { hasStickerTripActive, preloadAllLoadoutSlots, StickerTripOverlay } from './characters/loadout';
import { runAllNpcMovementTicks } from '@/lib/npcMovementRegistry';
import { chatConnectSpreadPlayerPx } from '@/lib/chatConnectSpread';
import { getNpcConvoHold, hasNpcConvoHold, setNpcConvoReleaseListener } from '@/lib/npcConvoHold';
import { releaseNpcConvoSnap, snapNpcPairForConvo } from '@/lib/npcConvoSnap';
import { npcPairInAnyPlayerView, npcTouchDistPx } from '@/lib/npcProximity';
import { appendChatLine, type ChatLine } from '@/lib/chatLines';
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

/** Auto-connect player + first NPC on load to preview chat connect glow (testing). */
const TEST_CHAT_CONNECT_ON_LOAD = false;

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
  const midSkyLabelsRef = useRef<SVGSVGElement>(null);
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
    midSkyLabelsRef.current?.setAttribute('viewBox', vb(midVx));
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
  const [playerMessages, setPlayerMessages] = useState<ChatLine[]>([]);
  const [playerAmbientMessages, setPlayerAmbientMessages] = useState<ChatLine[]>([]);
  const ambientHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [npcMessages,   setNpcMessages]   = useState<ChatLine[]>([]);
  const [npcTyping,     setNpcTyping]     = useState(false);
  const [convoHoldTick, setConvoHoldTick] = useState(0);
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
  const [peerMessages, setPeerMessages] = useState<ChatLine[]>([]);
  const [peerTyping,  setPeerTyping]  = useState(false);
  const [nearPeer,    setNearPeer]    = useState<string | null>(null);
  const peerChatRef = useRef<string | null>(null);
  const nearPeerRef = useRef<string | null>(null);
  const lastSentRef = useRef<{ worldX: number; facing: 'left' | 'right'; walking: boolean }>(
    { worldX: NaN, facing: 'right', walking: false },
  );
  const beginPeerChatRef = useRef<((peerId: string, announce: boolean) => void) | null>(null);
  const endPeerChatRef   = useRef<((announce: boolean) => void) | null>(null);
  const lastNpcPosSendRef = useRef(0);

  const npcChatLabel = useCallback((npcId: string, fallback: string) => {
    return npcChatLabelForId(npcId, fallback);
  }, []);

  const resolvePlayerId = useCallback((nameOrId: string) => {
    const m = mpRef.current;
    if (!m?.selfId) return null;
    const selfName = profileRef.current.name?.trim();
    if (selfName && nameOrId === selfName) return m.selfId;
    if (nameOrId === m.selfId || m.selfId.startsWith(nameOrId)) return m.selfId;
    for (const [id, st] of m.remoteStateRef.current) {
      const n = st.name?.trim();
      if (n && n === nameOrId) return id;
      if (id.startsWith(nameOrId)) return id;
    }
    return null;
  }, []);

  const chatterHandlersRef = useRef({
    onRoomChat: (_sender: string, _text: string) => {},
    onNpcConvoStart: (_convoId: string, _participants: [string, string], _meta?: NpcConvoMeta) => {},
    onNpcLine: (_convoId: string, _npc: string, _text: string) => {},
    onNpcConvoEnd: (_convoId: string) => {},
  });

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
    },
    onPeerMessage: (pid, text) => {
      if (peerChatRef.current !== pid) return;
      setPeerTyping(false);
      setPeerMessages(prev => appendChatLine(prev, text));
    },
    onRoomChat: (sender, text) => chatterHandlersRef.current.onRoomChat(sender, text),
    onNpcConvoStart: (convoId, participants, meta) =>
      chatterHandlersRef.current.onNpcConvoStart(convoId, participants, meta),
    onNpcLine: (convoId, npc, text) =>
      chatterHandlersRef.current.onNpcLine(convoId, npc, text),
    onNpcConvoEnd: convoId => chatterHandlersRef.current.onNpcConvoEnd(convoId),
  });
  const mpRef = useRef(mp);
  mpRef.current = mp;

  const roomChatter = useRoomChatter(resolvePlayerId);

  useEffect(() => {
    setNpcConvoReleaseListener(() => setConvoHoldTick(t => t + 1));
    return () => setNpcConvoReleaseListener(null);
  }, []);

  const skipRoomChatEcho = useCallback((sender: string) => {
    if (!sender.startsWith('user:')) return false;
    const label = sender.slice(5);
    const selfName = playerName?.trim();
    if (selfName && label === selfName) return true;
    const sid = mpRef.current?.selfId;
    return Boolean(sid && (label === sid || sid.startsWith(label)));
  }, [playerName]);

  chatterHandlersRef.current = {
    onRoomChat: (sender, text) => {
      if (skipRoomChatEcho(sender)) return;
      roomChatter.handleRoomChat(sender, text);
    },
    onNpcConvoStart: (_convoId, participants, meta) => {
      if (meta) {
        console.log('[npc-chatter] seed', meta.seedKind, meta.seed);
        console.log('[npc-chatter] models', meta.models);
      }
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const idxA = npcCast.findIndex(c => c.id === participants[0]);
      const idxB = npcCast.findIndex(c => c.id === participants[1]);
      const wxA = idxA >= 0 ? npcWorldXRefs.current[idxA] : undefined;
      const wxB = idxB >= 0 ? npcWorldXRefs.current[idxB] : undefined;
      if (
        wxA == null
        || wxB == null
        || !Number.isFinite(wxA)
        || !Number.isFinite(wxB)
        || !npcPairInAnyPlayerView(wxA, wxB, [{ worldOff: worldRef.current, viewportWidth: width }])
      ) {
        return;
      }
      snapNpcPairForConvo(participants[0], participants[1], width, {
        npcCast,
        npcWorldXRefs,
      });
      roomChatter.onNpcConvoStart(participants);
    },
    onNpcLine: (_convoId, npc, text) => roomChatter.handleNpcLine(npc, text),
    onNpcConvoEnd: () => {
      releaseNpcConvoSnap();
      roomChatter.onNpcConvoEnd();
    },
  };
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
    setPeerMessages([]);
    setPeerTyping(false);
    setPlayerMessages([]);
    const toward = screenPct < 50 ? 'left' : 'right';
    facingRef.current = toward; setFacing(toward);
    walkingRef.current = false; setWalking(false);
    nearPeerRef.current = null; setNearPeer(null);
    nearNpcRef.current = null;  setNearNpc(null);
    if (announce) mpRef.current?.openPeerChat(peerId);
    playChatInviteBeep();
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
    setPeerMessages([]);
    setPeerTyping(false);
    setChatMode(null);
    setChatDraft('');
    setPlayerMessages([]);
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
  // updateViewBoxes is stable (no deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnWorldOff, npcCast]);

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

  useEffect(() => {
    setVenueDressCode(effectiveVenueRoute);
    return () => { setVenueDressCode(null); };
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
    setNpcMessages([]);
    setNpcTyping(false);
    setChatHistory([]);
    setChatSendTick(0);
    sentMessageRef.current = '';
    greetingSessionRef.current = null;
  }, [greetingNpc]);

  // 1:1 chat session — NPCs wait for the player to speak first (no auto-greeting).
  useEffect(() => {
    if (greetingNpc === null) return;
    if (greetingSessionRef.current === greetingNpc) return;
    greetingSessionRef.current = greetingNpc;

    chatAbortRef.current?.abort();
    setNpcTyping(false);
    setNpcMessages([]);
    setChatHistory([]);
    setPlayerMessages([]);
    setChatSendTick(0);
    sentMessageRef.current = '';
    setChatMode(playerName ? 'chat' : null);

    if (playerName) {
      setTimeout(() => chatInputRef.current?.focus(), 120);
    }
  }, [greetingNpc, playerName]);

  // Dev: auto-connect to first NPC on load for connect-glow preview.
  const testChatConnectRef = useRef(false);
  useEffect(() => {
    if (!TEST_CHAT_CONNECT_ON_LOAD || homePreview || testChatConnectRef.current) return;
    if (showWelcome || showCityPicker) return;
    if (npcCast.length === 0) return;
    testChatConnectRef.current = true;
    const npcIndex = 0;
    greetingRef.current = npcIndex;
    setGreetingNpc(npcIndex);
    setGreetNpcX(50);
    setChatMode('chat');
    mpRef.current?.requestConnect();
    const npcId = npcCast[npcIndex]?.id;
    if (npcId) mpRef.current?.sendNpcChat(npcId, true);
  }, [homePreview, showWelcome, showCityPicker, npcCast]);

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
      },
      reply => {
        setNpcTyping(false);
        setNpcMessages(prev => appendChatLine(prev, reply));
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
      setNpcMessages(prev => appendChatLine(prev, pickFallbackReply(character)));
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
    setPlayerAmbientMessages(prev => appendChatLine(prev, text));
    ambientHideRef.current = setTimeout(() => {
      setPlayerAmbientMessages([]);
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
    setPlayerMessages(prev => appendChatLine(prev, safe));
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
    if (!AMBIENT_CHAT_ENABLED) return;
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
    if (!AMBIENT_CHAT_ENABLED) return;
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

    const SPEED = 3.5;

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
      const npcId = npcCast[i]?.id;
      if (npcId) mpRef.current?.sendNpcChat(npcId, true);
      playChatInviteBeep();
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
      const npcIndex = greetingRef.current;
      const npcId = npcIndex !== null ? npcCast[npcIndex]?.id : null;
      greetingRef.current = null;
      setGreetingNpc(null);
      if (npcId) mpRef.current?.sendNpcChat(npcId, false);
      disconnectUntil.current = Date.now() + 2000;
      setChatMode(null);
      setChatDraft('');
      setPlayerMessages([]);
    };

    const openChatPanel = () => {
      setChatMode('chat');
      setTimeout(() => chatInputRef.current?.focus(), 30);
    };

    const openAmbientPanel = () => {
      if (!AMBIENT_CHAT_ENABLED) return;
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

    const broadcastNpcPositions = () => {
      const now = Date.now();
      if (now - lastNpcPosSendRef.current <= 500) return;
      lastNpcPosSendRef.current = now;
      const width = window.innerWidth;
      const positions = npcCast
        .map((cfg, i) => ({
          id: cfg.id,
          worldX: npcWorldXRefs.current[i]!,
        }))
        .filter(p => Number.isFinite(p.worldX));
      mpRef.current?.sendNpcPositions(positions, width);
    };

    const tickNpcs = () => {
      runAllNpcMovementTicks(
        worldRef.current,
        window.innerWidth,
        npcWorldXRefs.current,
      );
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
        updateViewBoxes(worldRef.current);
        if (frameCountRef.current % 4 === 0) {
          updateDanceState(worldRef.current);
          broadcastNpcPositions();
        }
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
          const greetDistPx = npcTouchDistPx(width);
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
        broadcastNpcPositions();
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

  const npcPairOverlay = useMemo(() => {
    const convo = roomChatter.npcConvo;
    if (!convo) return null;
    const [idA, idB] = convo.participants;
    const wxA = getNpcConvoHold(idA);
    const wxB = getNpcConvoHold(idB);
    if (wxA === undefined || wxB === undefined) return null;
    const cfgA = npcCast.find(c => c.id === idA);
    const cfgB = npcCast.find(c => c.id === idB);
    if (!cfgA || !cfgB) return null;
    return (
      <NpcPairChatOverlay
        worldXA={wxA}
        worldXB={wxB}
        lines={convo.lines}
        speakers={[
          {
            key: idA,
            name: npcChatLabel(idA, cfgA.name),
            color: cfgA.balloonColor,
            worldX: wxA,
          },
          {
            key: idB,
            name: npcChatLabel(idB, cfgB.name),
            color: cfgB.balloonColor,
            worldX: wxB,
          },
        ]}
      />
    );
  }, [roomChatter.npcConvo, roomChatter.npcConvo?.lines.length, npcCast, npcChatLabel, convoHoldTick]);

  const inConversation = greetingNpc !== null || peerChatId !== null;

  const isPlayerChatConnected = useCallback((playerId: string) => {
    if (mp.selfId === playerId && inConversation) return true;
    if (peerChatId === playerId) return true;
    if (mp.chatPairs.some(p => p.a === playerId || p.b === playerId)) return true;
    return mp.remoteNpcChats.some(c => c.playerId === playerId);
  }, [mp.selfId, mp.chatPairs, mp.remoteNpcChats, inConversation, peerChatId]);

  const isNpcChatConnected = useCallback((npcIndex: number, npcId: string) => {
    if (greetingNpc === npcIndex) return true;
    if (mp.remoteNpcChats.some(c => c.npcId === npcId)) return true;
    if (roomChatter.isNpcInConvo(npcId)) return true;
    if (hasNpcConvoHold(npcId)) return true;
    return false;
  }, [greetingNpc, mp.remoteNpcChats, roomChatter, convoHoldTick]);
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
    : greetingNpc !== null
      ? npcChatLabel(npcCast[greetingNpc]!.id, npcCast[greetingNpc]!.name)
      : null;
  const conversationPartnerColor = peerChatId !== null
    ? (mp.remoteStateRef.current.get(peerChatId)?.balloonColor ?? '#ef4023')
    : greetingNpc !== null ? npcCast[greetingNpc]?.balloonColor ?? '#ef4023' : '#ef4023';
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
          skyLabelsRef={midSkyLabelsRef}
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
          const chatConnected = isNpcChatConnected(i, cfg.id);
          const npcLabel = npcChatLabel(cfg.id, cfg.name);
          return (
          <NPC
            key={cfg.id}
            characterId={cfg.id}
            index={i}
            {...cfg}
            stageAnchor={cfg.stageAnchor}
            startX={testing ? 55 : cfg.startX}
            entryDelay={testing ? 0 : cfg.entryDelay}
            paused={chatConnected}
            greeting={greetingNpc === i}
            chatConnected={chatConnected}
            greetFacing={greetNpcX < 50 ? 'right' : 'left'}
            dancing={TEST_FORCE_DANCE || npcDancing[i]}
            greetingChat={greetingNpc === i ? {
              name: npcLabel,
              npcTyping,
              messages: npcMessages,
            } : undefined}
          />
          );
        })}

        {!homePreview && npcPairOverlay}

        {/* Remote human players (PartyKit presence) */}
        {!homePreview && mp.remoteIds.map(pid => (
          <RemotePlayer
            key={pid}
            id={pid}
            stateRef={mp.remoteStateRef}
            ambientRef={mp.ambientRef}
            greeting={peerChatId === pid}
            chatConnected={isPlayerChatConnected(pid)}
            greetingChat={peerChatId === pid ? {
              name: mp.remoteStateRef.current.get(pid)?.name ?? 'Wanderer',
              npcTyping: peerTyping,
              messages: peerMessages,
            } : undefined}
            publicMessages={roomChatter.playerMessages.get(pid)}
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
            transform: `translate(${inConversation ? chatConnectSpreadPlayerPx(greetNpcX) : 0}px, ${playerDepthY}px)`,
            transition: 'transform 0.25s ease',
            zIndex: inConversation ? 200 : 20,
          }}>
            <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
              <Character
                walking={walking}
                facing={facing}
                dancing={TEST_FORCE_DANCE || playerDancing}
                balloonColor={myColor}
                loadout={playerLoadout}
                bubbleSide={inConversation ? 'center' : playerBubbleSide(greetNpcX)}
                chatConnected={inConversation}
                chatOverlay={
                  inConversation ? (
                    <PlayerChatOverlay
                      npcScreenX={greetNpcX}
                      chatMode={chatMode === 'ambient' ? null : chatMode}
                      playerName={playerName}
                      messages={playerMessages}
                      partnerName={conversationPartnerName ?? 'Wanderer'}
                      playerColor={myColor}
                      partnerColor={conversationPartnerColor}
                      partnerMessages={peerChatId !== null ? peerMessages : npcMessages}
                      partnerTyping={peerChatId !== null ? peerTyping : npcTyping}
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
                      messages={playerAmbientMessages}
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
            ? npcChatLabel(npcCast[nearNpc]!.id, npcCast[nearNpc]!.name)
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
          onOpenAmbientChat={mobileDevice && AMBIENT_CHAT_ENABLED ? handleOpenAmbientChat : undefined}
          ambientChatOpen={AMBIENT_CHAT_ENABLED && chatMode === 'ambient'}
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
