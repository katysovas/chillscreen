'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { ambientSeedForRoute } from '@/lib/ambientSeed';
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
import { purchaseVendorItemAsync } from '@/lib/vendorPurchase';
import { festieLifeFill } from '@/lib/festie/config';
import {
  acknowledgeFestieReturn,
  dismissFestieHelp,
  fetchFestie,
  fetchSessionRecapSince,
  logoutFestie,
} from '@/lib/festie/client';
import {
  sampleSessionRecap,
  shouldShowSessionRecap,
  type FestieSessionRecap,
} from '@/lib/festie/sessionRecap';
import {
  markSessionRecapAcked,
  wasSessionRecapAcked,
} from '@/lib/festie/sessionRecapStorage';
import { persistFestieStage } from '@/lib/festie/stage';
import {
  markFestieLifeIntroSeen,
  markFestieLifeTabExitShown,
  shouldShowFestieLifeOnTabExit,
} from '@/lib/festie/intro';
import type { FestieOwner } from '@/lib/festie/types';
import { festieNpcId, festiesToCharacterDefs, isFestieNpcId } from '@/lib/festie/toCharacterDef';
import {
  getPlayerSession,
  hydratePlayerSession,
  subscribePlayerSession,
} from '@/lib/player/session';
import { preloadPurchaseSound, unlockPurchaseSound } from '@/lib/playPurchaseSound';
import { loadoutSyncKey, serializeLoadout } from '@/lib/multiplayer/loadoutSync';
import { isBuzNpc } from '@/lib/vendorShop';
import {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName as saveSessionPlayerName,
} from '@/lib/playerStorage';
import { identifyPlayer, trackCharacterCreated } from '@/lib/analytics';
import {
  trackAmbientNpcChatter,
  trackPlayerNpcChatLine,
} from '@/lib/npcChatterAnalytics';
import { installGameInputAnalytics, trackMobileControl } from '@/lib/gameInputAnalytics';
import { isChatterMuted } from '@/lib/chatterMuted';
import { isChatterDebugMode } from '@/lib/chatterDebug';
import { ierror } from '@/lib/internalDebug';
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
import { setVenueDressCode } from '@/lib/dressCode';
import { WelcomePopup } from './WelcomePopup';
import { CityNavSigns } from './CityNavSigns';
import { StagePicker } from './StagePicker';
import { SkyCreaturesLayer } from './SkyCreatures';
import { SkyLayer } from './city/SkyLayer';
import { SpaceParallaxStars } from './city/orbit';
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
import { BottomControlPanel, SignOutIcon } from './BottomControlPanel';
import { VendorShopPanel, preloadVendorShopPanel } from './VendorShopPanelLazy';
import { HelpFaqModal } from './HelpFaqModal';
import { KeyboardMoveHint } from './KeyboardMoveHint';
import { SignOutConfirmModal } from './SignOutConfirmModal';
import { FestieLifeCorner } from './FestieLifeCorner';
import { FestieLifeModal } from './FestieLifeModal';
import { FestieSessionRecapOverlay } from './FestieSessionRecapOverlay';
import { FestieSettingsModal, type FestieSettingsTab } from './FestieSettingsModal';
import { hasStickerTripActive, preloadAllLoadoutSlots, preloadCrowdLoadouts, StickerTripOverlay } from './characters/loadout';
import {
  clearNpcSyncedScreenPcts,
  runAllNpcMovementTicks,
  setNpcNetworkFollowMode,
  setNpcSyncedScreenPct,
} from '@/lib/npcMovementRegistry';
import { runAllWorldPositionTicks } from '@/lib/worldPositionTicks';
import { StageEaselsLayer, stageSlugFromVenueRoute } from './easel/StageEaselsLayer';
import { isEaselPainterReady, subscribeEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import { easelPaintingLabelForNpc } from '@/lib/easel/paintingLabel';
import { setActiveEaselCanvasBlockZone } from '@/lib/easel/canvasBlocking';
import { easelSlotWorldX } from '@/lib/easel/layout';
import { mergeEaselOwnersIntoCast, preloadEaselOwners } from '@/lib/easel/cast';
import { easelHandLoadout } from '@/lib/easel/brushLoadout';
import { easelPaintingContextForNpc } from '@/lib/easel/chatContext';
import { ensureEaselSession } from '@/lib/easel/checkpointClient';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import { activePainterNpcIds } from '@/lib/easel/session';
import { useEaselSession } from '@/lib/easel/useEaselSession';
import { useEaselHoldAdvance } from '@/lib/easel/useEaselHoldAdvance';
import { TEST_EASEL_ON_LOAD } from '@/lib/easel/test';
import { chatConnectSpreadPlayerPx } from '@/lib/chatConnectSpread';
import { Z_CHAT_CHARACTER, Z_PLAYER_CHARACTER } from '@/lib/zLayers';
import { getNpcConvoHold, hasNpcConvoHold, setNpcConvoReleaseListener } from '@/lib/npcConvoHold';
import { getNpcConvoAnchor, setNpcConvoAnchor } from '@/lib/npcConvoAnchor';
import { releaseNpcConvoSnap, snapNpcPairForConvo } from '@/lib/npcConvoSnap';
import { npcTouchDistPx } from '@/lib/npcProximity';
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

/** Equip gas mask on a cinema NPC at startup (testing). */
const TEST_NPC_MASK_ON_LOAD = false;
const TEST_NPC_MASK_ID = 'gen-cinema-vanessa';
const TEST_NPC_MASK_ITEM = 'mask-gasmask' as const;

/** Auto-connect player + first NPC on load to preview chat connect glow (testing). */
const TEST_CHAT_CONNECT_ON_LOAD = false;

/** Preview session recap modal on load with sample events (testing). */
const TEST_FESTIE_RECAP_ON_LOAD = false;

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skyPeriod  = useSkyPeriod();

  const [mobileDevice, setMobileDevice] = useState(
    () => typeof window !== 'undefined' && isMobileLoungeDevice(),
  );
  const [showCityPicker, setShowCityPicker] = useState(false);
  const showCityPickerRef = useRef(false);
  const connectNearRef = useRef<(() => void) | null>(null);

  const effectiveVenueRoute = venueRoute;
  const isDeepSpace = effectiveVenueRoute === 'deep-space';
  /** Stable per tab session — matches stage picker crowd counts. */
  const ambientSeed = useMemo(
    () => ambientSeedForRoute(effectiveVenueRoute),
    [effectiveVenueRoute],
  );
  // Generated crowd for this stage (+ local Buz). Falls back to legacy cast when
  // no generated NPCs are saved for the channel yet.
  const npcCast = useMemo(
    () => npcCastForVenue(effectiveVenueRoute, ambientSeed),
    [effectiveVenueRoute, ambientSeed],
  );
  /** Wait for equipped prop chunks before showing player/NPCs (avoids balloon-then-props flicker). */
  const [crowdVisualsReady, setCrowdVisualsReady] = useState(false);
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

  /**
   * Mobile mid-layer viewport.
   *
   * The scene SVG is 1400×900. On portrait mobile, `preserveAspectRatio="xMidYMid slice"`
   * scales by height (factor ≈ 0.938) and shows only ~416 SVG units wide — far less than
   * the widest stage (Concert, 887 SVG units). Stages are severely clipped.
   *
   * Fix (mobile only, mid/foreground layers only):
   * - ViewBox width: 900 (fits Concert at 887 SVG units, +7 margin each side)
   * - ViewBox height: 900 (square — forces scale = min(vw/900, vh/900) = vw/900 ≈ 0.433,
   *   which is width-constrained so all 900 units are shown)
   * - preserveAspectRatio = "xMidYMax meet": the 390×390 rendered scene anchors to the
   *   screen bottom, which puts SVG y=685 (ground/sidewalk) at CSS y≈751 px — exactly
   *   matching CHAR_BOTTOM=11% on an 844 px screen. Characters align with stage ground.
   * - ViewBox X offset: +250 re-centres the 900-wide window on the same world centre that
   *   the desktop 1400-wide window uses (desktop centre = midVx+700, mobile = midVx+250+450).
   */
  const MOBILE_MID_VB_W = 900;
  // The desktop scene centres at x=700 in the 1400-wide viewBox.
  // Shift the mobile viewBox so the same scene centre falls at x=450 (half of 900).
  const MOBILE_MID_VB_X_OFFSET = 700 - MOBILE_MID_VB_W / 2; // desktop centre 700, mobile centre 450 → +250
  // xMidYMax anchors the scene bottom to the screen bottom.
  // vb_h is computed per-frame so mid-layer y=660 (stage ground) lands at exactly
  // the same CSS pixel as ground-layer y=685 (sidewalk, rendered via slice at scale vh/900).
  // Formula: vb_h = STAGE_GND + (900 − GND_LAYER_Y) * vh/vw = 660 + 215 * vh/vw
  const MOBILE_MID_PAR = 'xMidYMax meet';

  /** Update scrolling SVG viewBoxes directly — zero React overhead. */
  const updateViewBoxes = (off: number) => {
    const skyVx = off * SKY_F;
    const midVx = off * MID_F;
    const gndVx = off * GND_F;
    const vb    = (x: number) => `${x} 0 1400 900`;

    skyRef.current?.setAttribute('viewBox', vb(skyVx));
    groundRef.current?.setAttribute('viewBox', vb(gndVx));
    cabanaRef.current?.setAttribute('viewBox', vb(gndVx));
    navSignsRef.current?.setAttribute('viewBox', vb(gndVx));
    cloudsRef.current?.setAttribute('viewBox', vb(skyVx));

    // On mobile portrait, zoom the stage layer out to show the full stage width.
    if (typeof window !== 'undefined' && window.innerWidth <= 767) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // stage ground (y=660) in mid-layer must match GND_Y=685 in ground layer (slice, scale=vh/900).
      const mvb_h = Math.round(660 + 215 * vh / vw);
      const mvx = midVx + MOBILE_MID_VB_X_OFFSET;
      const mvb = `${mvx} 0 ${MOBILE_MID_VB_W} ${mvb_h}`;
      midRef.current?.setAttribute('viewBox', mvb);
      midRef.current?.setAttribute('preserveAspectRatio', MOBILE_MID_PAR);
      midForegroundRef.current?.setAttribute('viewBox', mvb);
      midForegroundRef.current?.setAttribute('preserveAspectRatio', MOBILE_MID_PAR);
      midSkyLabelsRef.current?.setAttribute('viewBox', mvb);
      midSkyLabelsRef.current?.setAttribute('preserveAspectRatio', MOBILE_MID_PAR);
    } else {
      midRef.current?.setAttribute('viewBox', vb(midVx));
      midRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      midForegroundRef.current?.setAttribute('viewBox', vb(midVx));
      midForegroundRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      midSkyLabelsRef.current?.setAttribute('viewBox', vb(midVx));
      midSkyLabelsRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    }
  };

  // ── Greeting / collision ───────────────────────────────────────────────────
  // Each NPC reports its world-x each frame (same coordinate space as worldRef).
  // Infinity until each NPC's RAF loop reports a live position — avoids
  // connecting to off-screen entry coords while the sprite is still hidden.
  const npcWorldXRefs     = useRef<number[]>(npcCast.map(() => Infinity));
  const npcWorldXByIdRef  = useRef<Map<string, number>>(new Map());
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
  const festieConvoIdRef = useRef<string | null>(null);
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
  // SSR/hydration: defaults until player session hydrates from API.
  const [playerLoadout, setPlayerLoadout] = useState<CharacterLoadout>(() => ({
    ...defaultLoadout(myColor),
    ...TEST_PLAYER_LOADOUT,
  }));
  const [playerCoins, setPlayerCoins] = useState(STARTING_COINS);
  const [vendorShopManualOpen, setVendorShopManualOpen] = useState(false);
  const [vendorShopDismissed, setVendorShopDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<FestieSettingsTab>('customize');
  const [lifeModalOpen, setLifeModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [festieSignedIn, setFestieSignedIn] = useState(false);
  const [ownerFestie, setOwnerFestie] = useState<FestieOwner | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [sessionRecapOpen, setSessionRecapOpen] = useState(false);
  const [sessionRecap, setSessionRecap] = useState<FestieSessionRecap | null>(null);
  const lifeRefillFromRef = useRef<number | null>(null);
  const recapNeedsAckRef = useRef(false);
  const broadcastProfileRef = useRef<(loadout: CharacterLoadout) => void>(() => {});

  const handleVendorPurchase = useCallback(async (itemId: string): Promise<boolean> => {
    const coinsBefore = getPlayerCoins();
    const result = await purchaseVendorItemAsync(itemId, myColor);
    if (!result.ok) {
      if (result.reason === 'not_signed_in') setShowWelcome(true);
      return false;
    }
    const nextLoadout = { ...result.loadout, ...TEST_PLAYER_LOADOUT };
    setPlayerLoadout(nextLoadout);
    setPlayerCoins(result.coins);
    broadcastProfileRef.current(nextLoadout);
    return result.charged || result.coins < coinsBefore;
  }, [myColor]);

  const handleVendorUnequip = useCallback(async (itemId: string) => {
    const next = await unequipLoadoutItem(itemId, myColor);
    if (!next) return;
    const nextLoadout = { ...next, ...TEST_PLAYER_LOADOUT };
    setPlayerLoadout(nextLoadout);
    broadcastProfileRef.current(nextLoadout);
  }, [myColor]);

  const openSettings = useCallback((tab: FestieSettingsTab = 'customize') => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
    setLifeModalOpen(false);
    setVendorShopManualOpen(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen(open => {
      if (open) return false;
      setSettingsInitialTab('customize');
      setLifeModalOpen(false);
      setVendorShopManualOpen(false);
      return true;
    });
  }, []);

  const toggleLife = useCallback(() => {
    setLifeModalOpen(open => {
      const next = !open;
      if (next) {
        setSettingsOpen(false);
        setVendorShopManualOpen(false);
      }
      return next;
    });
  }, []);

  const openSignOutConfirm = useCallback(() => {
    setSettingsOpen(false);
    setLifeModalOpen(false);
    setVendorShopManualOpen(false);
    setSignOutConfirmOpen(true);
  }, []);

  const confirmSignOut = useCallback(async () => {
    setSignOutLoading(true);
    try {
      await logoutFestie();
    } catch {
      // Reload anyway — cookie may already be cleared.
    }
    window.location.assign('/');
  }, []);

  useEffect(() => {
    void hydratePlayerSession().then(profile => {
      setFestieSignedIn(profile.authenticated);
      if (profile.name) setPlayerName(profile.name);
      if (profile.festie) {
        const priorFill = festieLifeFill(profile.festie.last_seen_at, false);
        if (priorFill < 0.95) lifeRefillFromRef.current = priorFill;
        setOwnerFestie(profile.festie);
      }
      setPlayerLoadout({ ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT });
      setPlayerCoins(getPlayerCoins());
      setProfileReady(true);
    });
  }, [myColor]);

  useEffect(() => {
    return subscribePlayerSession(() => {
      const festie = getPlayerSession().festie;
      if (festie) setOwnerFestie(festie);
      if (!getPlayerSession().authenticated) return;
      const nextLoadout = { ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT };
      setPlayerLoadout(prev => {
        const prevKey = loadoutSyncKey(serializeLoadout(prev));
        const nextKey = loadoutSyncKey(serializeLoadout(nextLoadout));
        if (prevKey === nextKey) return prev;
        broadcastProfileRef.current(nextLoadout);
        return nextLoadout;
      });
    });
  }, [myColor]);

  const handleFestieCreated = useCallback(async () => {
    const festie = await fetchFestie();
    if (festie) setOwnerFestie(festie);
  }, []);

  const dismissHelpPopup = useCallback(() => {
    if (!ownerFestie || ownerFestie.help_dismissed_at) return;
    const dismissedAt = new Date().toISOString();
    setOwnerFestie({ ...ownerFestie, help_dismissed_at: dismissedAt });
    void dismissFestieHelp()
      .then(festie => {
        if (festie) setOwnerFestie(festie);
      })
      .catch(() => {
        /* optimistic dismiss — settings tab still has help */
      });
  }, [ownerFestie]);

  const showHelpPopup = Boolean(
    profileReady
    && festieSignedIn
    && ownerFestie
    && !ownerFestie.help_dismissed_at
    && !homePreview
    && !showWelcome
    && !showCityPicker
    && !sessionRecapOpen
    && !settingsOpen
    && !lifeModalOpen,
  );

  const openSessionRecap = useCallback((recap: FestieSessionRecap | null, needsAck: boolean, festieName?: string) => {
    if (!shouldShowSessionRecap(recap, festieName)) return;
    recapNeedsAckRef.current = needsAck;
    setSessionRecap(recap);
    setSessionRecapOpen(true);
  }, []);

  const checkSessionRecap = useCallback(async (
    festie: FestieOwner,
    needsAck: boolean,
  ) => {
    if (sessionRecapOpen) return;
    if (wasSessionRecapAcked(festie.id, festie.last_seen_at)) return;

    if (TEST_FESTIE_RECAP_ON_LOAD) {
      openSessionRecap(sampleSessionRecap(festie.name), false, festie.name);
      return;
    }

    const recap = await fetchSessionRecapSince(festie.last_seen_at, festie.name);
    openSessionRecap(recap, needsAck, festie.name);
  }, [sessionRecapOpen, openSessionRecap]);

  const dismissSessionRecap = useCallback(() => {
    const since = sessionRecap?.since;
    const festieId = ownerFestie?.id;
    setSessionRecapOpen(false);
    if (since && festieId) markSessionRecapAcked(festieId, since);
    if (recapNeedsAckRef.current) {
      recapNeedsAckRef.current = false;
      void acknowledgeFestieReturn()
        .then(() => fetchFestie())
        .then(festie => {
          if (festie) setOwnerFestie(festie);
        });
    }
  }, [sessionRecap, ownerFestie]);

  useEffect(() => {
    if (!profileReady || homePreview) return;
    if (showWelcome || showCityPicker) return;
    if (sessionRecapOpen) return;

    if (TEST_FESTIE_RECAP_ON_LOAD) {
      const name = ownerFestie?.name ?? playerName ?? 'Moonbeam';
      openSessionRecap(sampleSessionRecap(name), false, name);
      return;
    }

    if (!festieSignedIn || !ownerFestie) return;
    void checkSessionRecap(ownerFestie, true);
  }, [
    profileReady,
    homePreview,
    showWelcome,
    showCityPicker,
    sessionRecapOpen,
    festieSignedIn,
    ownerFestie,
    playerName,
    checkSessionRecap,
    openSessionRecap,
  ]);

  /** Tab close / return — same session cookie, no sign-out. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!festieSignedIn || !ownerFestie) return;
      if (showWelcomeRef.current || showCityPickerRef.current) return;
      if (homePreview) return;
      void checkSessionRecap(ownerFestie, true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [festieSignedIn, ownerFestie, checkSessionRecap, homePreview]);

  const toggleVendorShop = useCallback(() => {
    unlockPurchaseSound();
    setVendorShopManualOpen(open => {
      const next = !open;
      if (next) {
        setVendorShopDismissed(false);
        setSettingsOpen(false);
        setLifeModalOpen(false);
      }
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

  const userIdRef = useRef<string | null>(getPlayerSession().userId);
  useEffect(() => {
    const sync = () => { userIdRef.current = getPlayerSession().userId; };
    sync();
    return subscribePlayerSession(sync);
  }, []);

  const mp = useMultiplayer({
    profileRef,
    userIdRef,
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
  const isNpcLeaderRef = useRef(mp.isNpcLeader);
  isNpcLeaderRef.current = mp.isNpcLeader;

  useEffect(() => {
    const follow = mp.connected && !mp.isNpcLeader;
    setNpcNetworkFollowMode(follow);
    if (!follow) clearNpcSyncedScreenPcts();
  }, [mp.connected, mp.isNpcLeader]);

  const easelChannel = stageChannelForRoute(effectiveVenueRoute);
  const easelStageSlug = stageSlugFromVenueRoute(effectiveVenueRoute);
  const easelSessionEnabled = !homePreview;
  const easelUserActive = TEST_EASEL_ON_LOAD || mp.connected || (!showWelcome && !showCityPicker);
  const activeEaselSession = useEaselSession(
    easelStageSlug,
    easelSessionEnabled,
    mp.easelSession,
    { ensureOnLoad: TEST_EASEL_ON_LOAD },
  );
  const partyDrivesEasel = Boolean(mp.easelSession?.slots?.length);
  useEaselHoldAdvance(
    easelStageSlug,
    activeEaselSession,
    easelSessionEnabled && easelUserActive && !partyDrivesEasel,
  );
  const [easelCastReady, setEaselCastReady] = useState(false);

  useEffect(() => {
    if (!easelSessionEnabled || partyDrivesEasel) return;
    if (!mp.connected && !TEST_EASEL_ON_LOAD) return;
    void ensureEaselSession(easelStageSlug).then(slots => {
      if (slots.length > 0) notifyEaselUpdated();
    });
  }, [easelSessionEnabled, easelStageSlug, mp.connected, partyDrivesEasel]);

  useEffect(() => {
    if (!easelSessionEnabled) {
      setEaselCastReady(false);
      return;
    }
    let cancelled = false;
    void preloadEaselOwners(easelChannel).then(() => {
      if (!cancelled) setEaselCastReady(true);
    });
    return () => { cancelled = true; };
  }, [effectiveVenueRoute, easelChannel, easelSessionEnabled]);

  const easelsActive =
    easelSessionEnabled
    && (TEST_EASEL_ON_LOAD || (!showWelcome && !showCityPicker))
    && Boolean(activeEaselSession?.slots.length);

  useEffect(() => {
    const syncBlockZone = () => {
      const painting = activeEaselSession?.slots.find(s => s.status === 'painting');
      if (!painting || !isEaselPainterReady(painting.npc)) {
        setActiveEaselCanvasBlockZone(null);
        return;
      }
      setActiveEaselCanvasBlockZone({
        canvasWorldX: easelSlotWorldX(
          painting.slot,
          easelStageSlug,
          typeof window !== 'undefined' ? window.innerWidth : 1200,
        ),
        painterNpcId: painting.npc,
      });
    };
    syncBlockZone();
    return subscribeEaselPainterReady(syncBlockZone);
  }, [activeEaselSession, easelStageSlug]);

  const effectiveNpcCast = useMemo(() => {
    const base = [
      ...npcCast,
      ...festiesToCharacterDefs(mp.festies, effectiveVenueRoute),
    ];
    if (!easelSessionEnabled) return base;
    if (!easelCastReady && !TEST_EASEL_ON_LOAD) return base;
    return mergeEaselOwnersIntoCast(
      base,
      easelChannel,
      activePainterNpcIds(activeEaselSession),
    );
  }, [npcCast, mp.festies, effectiveVenueRoute, easelCastReady, activeEaselSession, easelSessionEnabled, easelChannel]);
  const effectiveNpcCastKey = useMemo(
    () => effectiveNpcCast.map(c => c.id).join('\0'),
    [effectiveNpcCast],
  );
  const effectiveNpcCastRef = useRef(effectiveNpcCast);
  effectiveNpcCastRef.current = effectiveNpcCast;

  const festieDimNpcIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of mp.festies) {
      if (f.tier === 'dim') ids.add(festieNpcId(f.id));
    }
    return ids;
  }, [mp.festies]);

  const ownerOnline = festieSignedIn && Boolean(mp.selfId);

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

  const ownerFestieNpcId = ownerFestie?.id ? festieNpcId(ownerFestie.id) : null;

  chatterHandlersRef.current = {
    onRoomChat: (sender, text) => {
      if (sender.startsWith('npc:')) {
        const npcId = sender.slice(4);
        if (npcId === ownerFestieNpcId) {
          const cfg = effectiveNpcCast.find(c => c.id === npcId);
          trackAmbientNpcChatter(npcId, text, 'solo', {
            stage: effectiveVenueRoute,
            npcName: cfg ? npcChatLabel(npcId, cfg.name) : undefined,
          });
        }
        return;
      }
      if (skipRoomChatEcho(sender)) return;
      roomChatter.handleRoomChat(sender, text);
    },
    onNpcConvoStart: (convoId, participants, _meta) => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const isMobile = width <= 767;
      const snapOpts = isMobile
        ? { forceMidWorldX: worldRef.current }
        : { fallbackMidWorldX: worldRef.current };
      const snapped = snapNpcPairForConvo(participants[0], participants[1], width, {
        npcCast: effectiveNpcCast,
        npcWorldXRefs,
      }, snapOpts);

      const anchor = snapped
        ?? (() => {
          const heldA = getNpcConvoHold(participants[0]);
          const heldB = getNpcConvoHold(participants[1]);
          if (heldA != null && heldB != null) return [heldA, heldB] as [number, number];
          return null;
        })();

      if (anchor) {
        setNpcConvoAnchor(convoId, anchor[0], anchor[1]);
        setConvoHoldTick(t => t + 1);
      }

      roomChatter.onNpcConvoStart(convoId, participants);
    },
    onNpcLine: (convoId, npc, text) => {
      const pair = mpRef.current?.npcConvoPairs.find(p => p.convoId === convoId);
      if (pair) {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const isMobile = width <= 767;
        if (!hasNpcConvoHold(pair.participants[0])) {
          const snapOpts = isMobile
            ? { forceMidWorldX: worldRef.current }
            : { fallbackMidWorldX: worldRef.current };
          snapNpcPairForConvo(pair.participants[0], pair.participants[1], width, {
            npcCast: effectiveNpcCast,
            npcWorldXRefs,
          }, snapOpts);
        }
        const heldA = getNpcConvoHold(pair.participants[0]);
        const heldB = getNpcConvoHold(pair.participants[1]);
        if (heldA != null && heldB != null) {
          setNpcConvoAnchor(convoId, heldA, heldB);
        }
        roomChatter.onNpcConvoStart(convoId, pair.participants);
      }
      const cfg = effectiveNpcCast.find(c => c.id === npc);
      if (npc === ownerFestieNpcId) {
        trackAmbientNpcChatter(npc, text, 'pair', {
          convoId,
          stage: effectiveVenueRoute,
          npcName: cfg ? npcChatLabel(npc, cfg.name) : undefined,
        });
      }
      roomChatter.handleNpcLine(convoId, npc, text, pair?.participants);
    },
    onNpcConvoEnd: (convoId) => {
      roomChatter.onNpcConvoEnd(convoId);
      const stillActive = mpRef.current?.npcConvoPairs.some(p => p.convoId !== convoId);
      if (!stillActive) releaseNpcConvoSnap();
    },
  };
  const { sendProfile, sendPeerTyping } = mp;

  useEffect(() => {
    broadcastProfileRef.current = (loadout: CharacterLoadout) => {
      const profile = {
        name: playerName,
        balloonColor: myColor,
        loadout: serializeLoadout(loadout),
      };
      profileRef.current = profile;
      sendProfile(profile);
    };
  }, [playerName, myColor, sendProfile]);

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
  const networkedLoadout = useMemo(
    () => serializeLoadout(playerLoadout),
    [playerLoadout],
  );
  const networkedLoadoutKey = loadoutSyncKey(networkedLoadout);

  useEffect(() => {
    sendProfile({
      name: playerName,
      balloonColor: myColor,
      loadout: networkedLoadout,
    });
  }, [playerName, myColor, networkedLoadoutKey, networkedLoadout, sendProfile]);

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
    npcWorldXRefs.current = effectiveNpcCast.map(cfg =>
      npcWorldXByIdRef.current.get(cfg.id) ?? Infinity,
    );
    npcDancingRef.current = effectiveNpcCast.map((_, i) => npcDancingRef.current[i] ?? false);
    setNpcDancing(prev => {
      const next = effectiveNpcCast.map((_, i) => prev[i] ?? false);
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) return prev;
      return next;
    });
    lastMidScrollTileRef.current = midScrollTile(spawnWorldOff);
    lastGndScrollTileRef.current = gndScrollTile(spawnWorldOff);
  // updateViewBoxes is stable (no deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnWorldOff, effectiveNpcCastKey]);

  const navigateToCity = useCallback((route: VenueRoute) => {
    setShowCityPicker(false);
    if (route === effectiveVenueRoute) return;
    router.push(`/${venueSlugForRoute(route)}`);
  }, [effectiveVenueRoute, router]);

  useEffect(() => {
    setMobileDevice(isMobileLoungeDevice());
    if (homePreview || !profileReady) return;

    const welcomeFromUrl = searchParams.get('welcome') === '1';

    if (festieSignedIn) {
      if (welcomeFromUrl) router.replace(pathname);
      const storedName = getPlayerName();
      if (storedName) {
        setPlayerName(storedName);
        identifyPlayer(storedName);
        return scheduleIdleCallback(
          () => mpRef.current?.requestConnect(),
          { timeout: 4_000 },
        );
      }
      return;
    }

    if (welcomeFromUrl) {
      setShowWelcome(true);
      return;
    }

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
  }, [festieSignedIn, homePreview, pathname, profileReady, router, searchParams]);

  useEffect(() => {
    installGameInputAnalytics();
    setPlayerDepthY(crowdDepthOffsetPx(getOrCreatePlayerId()));
  }, []);

  useEffect(() => {
    setVenueDressCode(effectiveVenueRoute);
    return () => { setVenueDressCode(null); };
  }, [effectiveVenueRoute]);

  useEffect(() => {
    setCrowdVisualsReady(false);
  }, [effectiveVenueRoute]);

  useEffect(() => {
    if (!homePreview && !profileReady) return;

    let cancelled = false;
    const dressCodeExtras = effectiveVenueRoute === 'silent-disco' ? ['hat-headphones'] : [];
    void preloadCrowdLoadouts(
      [
        playerLoadout,
        ...effectiveNpcCast.map(c => (
          TEST_NPC_MASK_ON_LOAD && c.id === TEST_NPC_MASK_ID
            ? { ...(c.loadout ?? {}), mask: TEST_NPC_MASK_ITEM }
            : c.loadout
        )),
      ],
      dressCodeExtras,
    )
      .then(() => {
        if (!cancelled) setCrowdVisualsReady(true);
      })
      .catch(() => {
        if (!cancelled) setCrowdVisualsReady(true);
      });

    return () => { cancelled = true; };
  }, [homePreview, profileReady, effectiveVenueRoute, playerLoadout, effectiveNpcCast]);

  useEffect(() => {
    if (homePreview || !festieSignedIn) return;
    persistFestieStage(effectiveVenueRoute);
  }, [homePreview, festieSignedIn, effectiveVenueRoute]);

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
    festieConvoIdRef.current = null;
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
    if (effectiveNpcCast.length === 0) return;
    testChatConnectRef.current = true;
    const npcIndex = 0;
    greetingRef.current = npcIndex;
    setGreetingNpc(npcIndex);
    setGreetNpcX(50);
    setChatMode('chat');
    mpRef.current?.requestConnect();
    const npcId = effectiveNpcCast[npcIndex]?.id;
    if (npcId) mpRef.current?.sendNpcChat(npcId, true);
  }, [homePreview, showWelcome, showCityPicker, effectiveNpcCast]);

  // AI reply when the player sends a message
  useEffect(() => {
    if (chatSendTick === 0 || greetingNpc === null) return;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const character = effectiveNpcCast[greetingNpc];
    const message = sentMessageRef.current;
    const easelPainting = easelPaintingContextForNpc(character.id, activeEaselSession);

    if (isChatterMuted()) {
      setNpcTyping(false);
      setNpcMessages(prev => appendChatLine(prev, pickFallbackReply(character)));
      setTimeout(() => chatInputRef.current?.focus(), 0);
      return;
    }

    const festieChat = isFestieNpcId(character.id);
    fetchNpcReplyWithTyping(
      {
        characterId: character.id,
        playerName: playerName ?? 'friend',
        message,
        history: chatHistoryRef.current,
        cinemaNowPlaying: cinemaNowRef.current,
        concertNowPlaying: concertNowRef.current,
        easelPainting,
        conversationId: festieChat ? festieConvoIdRef.current : undefined,
      },
      controller.signal,
      () => {
        setNpcTyping(true);
      },
      ({ reply, conversationId }) => {
        setNpcTyping(false);
        if (festieChat && conversationId) festieConvoIdRef.current = conversationId;
        trackPlayerNpcChatLine(character.id, reply, {
          npcName: npcChatLabel(character.id, character.name),
          stage: effectiveVenueRoute,
          playerName: playerName ?? undefined,
          conversationId,
        });
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
      ierror('[npc-chat] reply failed in UI', {
        npcId: character.id,
        message: message.slice(0, 80),
        err,
      });
      setNpcTyping(false);
      setNpcMessages(prev => appendChatLine(prev, pickFallbackReply(character)));
      setTimeout(() => chatInputRef.current?.focus(), 0);
    });

    return () => controller.abort();
  }, [chatSendTick, greetingNpc, playerName, activeEaselSession]);

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
    void addPlayerCoins(value).then(coins => setPlayerCoins(coins));
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
    saveSessionPlayerName(name);
    const profile = {
      name,
      balloonColor: myColor,
      loadout: serializeLoadout(playerLoadout),
    };
    profileRef.current = profile;
    setPlayerName(name);
    setShowWelcome(false);
    if (searchParams.get('welcome') === '1') {
      router.replace(pathname);
    }
    trackCharacterCreated(name);
    mpRef.current?.sendProfile(profile);
    mpRef.current?.requestConnect();
    if (route !== effectiveVenueRoute) {
      navigateToCity(route);
    }
  };

  const handleCityPickerEnter = useCallback((name: string, route: VenueRoute) => {
    if (!getPlayerName() && name) {
      saveSessionPlayerName(name);
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
      const npcId = effectiveNpcCast[i]?.id;
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
      const npcId = npcIndex !== null ? effectiveNpcCast[npcIndex]?.id : null;
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
      if (!isNpcLeaderRef.current) return;
      const now = Date.now();
      if (now - lastNpcPosSendRef.current <= 500) return;
      lastNpcPosSendRef.current = now;
      const width = window.innerWidth;
      const off = worldRef.current;
      const positions = effectiveNpcCastRef.current
        .map((cfg, i) => {
          const worldX = npcWorldXRefs.current[i]!;
          if (!Number.isFinite(worldX)) return null;
          return {
            id: cfg.id,
            worldX,
            pct: worldXToScreenPct(worldX, off, width),
          };
        })
        .filter((p): p is { id: string; worldX: number; pct: number } => p != null);
      mpRef.current?.sendNpcPositions(positions, width);
    };

    const applyNetworkNpcPositions = () => {
      if (isNpcLeaderRef.current) return;
      const sync = mpRef.current?.npcSyncRef.current;
      if (!sync || sync.size === 0) return;
      const cast = effectiveNpcCastRef.current;
      for (let i = 0; i < cast.length; i++) {
        const pct = sync.get(cast[i]!.id);
        setNpcSyncedScreenPct(i, pct != null && Number.isFinite(pct) ? pct : null);
      }
    };

    const persistNpcWorldXById = () => {
      const cast = effectiveNpcCastRef.current;
      for (let i = 0; i < cast.length; i++) {
        const wx = npcWorldXRefs.current[i];
        if (Number.isFinite(wx)) npcWorldXByIdRef.current.set(cast[i]!.id, wx!);
      }
    };

    const tickNpcs = () => {
      applyNetworkNpcPositions();
      runAllNpcMovementTicks(
        worldRef.current,
        window.innerWidth,
        npcWorldXRefs.current,
      );
      persistNpcWorldXById();
      runAllWorldPositionTicks(worldRef.current, window.innerWidth);
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
    const convo = roomChatter.npcConvo ?? (() => {
      const pair = mp.npcConvoPairs[mp.npcConvoPairs.length - 1];
      if (!pair) return null;
      return { convoId: pair.convoId, participants: pair.participants, lines: [] };
    })();
    if (!convo) return null;
    const [idA, idB] = convo.participants;
    const anchor = getNpcConvoAnchor(convo.convoId);
    const resolveWorldX = (npcId: string, fallback?: number) => {
      if (anchor) return npcId === idA ? anchor.wxA : anchor.wxB;
      const held = getNpcConvoHold(npcId);
      if (held !== undefined) return held;
      if (fallback != null && Number.isFinite(fallback)) return fallback;
      const idx = effectiveNpcCast.findIndex(c => c.id === npcId);
      if (idx < 0) return undefined;
      const wx = npcWorldXRefs.current[idx];
      return Number.isFinite(wx) ? wx : undefined;
    };
    const wxA = resolveWorldX(idA, anchor?.wxA);
    const wxB = resolveWorldX(idB, anchor?.wxB);
    if (wxA === undefined || wxB === undefined) return null;

    const cfgA = effectiveNpcCast.find(c => c.id === idA);
    const cfgB = effectiveNpcCast.find(c => c.id === idB);
    const stillGenerating = mp.npcConvoPairs.some(p => p.convoId === convo.convoId);

    return (
      <NpcPairChatOverlay
        worldXA={wxA}
        worldXB={wxB}
        lines={convo.lines}
        typingSpeakerKey={convo.lines.length === 0 && stillGenerating ? idA : null}
        speakers={[
          {
            key: idA,
            name: npcChatLabel(idA, cfgA?.name ?? idA),
            color: cfgA?.balloonColor ?? '#8ed4ff',
            worldX: wxA,
          },
          {
            key: idB,
            name: npcChatLabel(idB, cfgB?.name ?? idB),
            color: cfgB?.balloonColor ?? '#ef4023',
            worldX: wxB,
          },
        ]}
      />
    );
  }, [
    roomChatter.npcConvo,
    roomChatter.npcConvo?.lines.length,
    mp.npcConvoPairs,
    effectiveNpcCast,
    npcChatLabel,
    convoHoldTick,
  ]);

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
    if (mp.npcConvoPairs.some(p => p.participants.includes(npcId))) return true;
    if (roomChatter.isNpcInConvo(npcId)) return true;
    if (hasNpcConvoHold(npcId)) return true;
    return false;
  }, [greetingNpc, mp.remoteNpcChats, mp.npcConvoPairs, roomChatter, convoHoldTick]);
  const showMobileChatBar = mobileDevice
    && !showWelcome
    && !showCityPicker
    && (
      (chatMode === 'ambient' && !inConversation)
      || (chatMode === 'chat' && inConversation)
    );
  const showVendorShop =
    greetingNpc !== null && isBuzNpc(effectiveNpcCast[greetingNpc]?.id ?? '');
  const showVendorPanel =
    vendorShopManualOpen || (showVendorShop && !vendorShopDismissed);

  useEffect(() => {
    if (!showVendorShop) setVendorShopDismissed(false);
  }, [showVendorShop]);

  useEffect(() => {
    if (nearNpc === null) return;
    if (!isBuzNpc(effectiveNpcCast[nearNpc]?.id ?? '')) return;
    warmVendorShop();
  }, [nearNpc, warmVendorShop]);

  useEffect(() => {
    if (!showVendorPanel) return;
    warmVendorShop();
  }, [showVendorPanel, warmVendorShop]);

  const conversationPartnerName = peerChatId !== null
    ? (mp.remoteStateRef.current.get(peerChatId)?.name ?? 'Wanderer')
    : greetingNpc !== null
      ? npcChatLabel(effectiveNpcCast[greetingNpc]!.id, effectiveNpcCast[greetingNpc]!.name)
      : null;
  const conversationPartnerColor = peerChatId !== null
    ? (mp.remoteStateRef.current.get(peerChatId)?.balloonColor ?? '#ef4023')
    : greetingNpc !== null ? effectiveNpcCast[greetingNpc]?.balloonColor ?? '#ef4023' : '#ef4023';
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
        {isDeepSpace ? (
          <SpaceParallaxStars />
        ) : (
          <SkyLayer
            ref={skyRef}
            period={skyPeriod}
            initialViewBoxX={spawnWorldOff * SKY_F}
          />
        )}
        {!isDeepSpace && (
          <SkyCloudsLayer ref={cloudsRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
        )}
        {!isDeepSpace && <SkyCreaturesLayer period={skyPeriod} />}
        <MidLayer
          ref={midRef}
          foregroundRef={midForegroundRef}
          skyLabelsRef={midSkyLabelsRef}
          worldOff={midScrollWorldOff}
          deepLinkRoute={effectiveVenueRoute}
          hideTrees={mobileDevice || isDeepSpace}
          isolatedTileIndex={isolatedTile}
        />
        <GroundLayer
          ref={groundRef}
          worldOff={gndScrollWorldOff}
          hideTrees={mobileDevice || isDeepSpace}
          hideStreetDogs={effectiveVenueRoute === 'silent-disco' || isDeepSpace}
          bareGround={isDeepSpace}
          isolatedTileIndex={isolatedTile}
        />
        {!isDeepSpace && <CabanaForegroundLayer ref={cabanaRef} worldOff={gndScrollWorldOff} />}

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

        {!homePreview && (
          <StageEaselsLayer
            active={easelsActive}
            stageSlug={easelStageSlug}
            session={activeEaselSession}
          />
        )}

        {/* Autonomous NPCs */}
        {!homePreview && crowdVisualsReady && effectiveNpcCast.map((cfg, i) => {
          if (TEST_SPAWN_NPC_ID && cfg.id !== TEST_SPAWN_NPC_ID) return null;
          const testing = TEST_SPAWN_NPC_ID === cfg.id;
          const chatConnected = isNpcChatConnected(i, cfg.id);
          const npcLabel = npcChatLabel(cfg.id, cfg.name);
          const isPainting = activePainterNpcIds(activeEaselSession).has(cfg.id);
          const easelPaintingLabel = isPainting
            ? easelPaintingLabelForNpc(cfg.id, activeEaselSession)
            : null;
          const baseLoadout = TEST_NPC_MASK_ON_LOAD && cfg.id === TEST_NPC_MASK_ID
            ? { ...(cfg.loadout ?? {}), mask: TEST_NPC_MASK_ITEM }
            : cfg.loadout;
          const easelPaintingSlot = isPainting
            ? activeEaselSession?.slots.find(s => s.npc === cfg.id && s.status === 'painting')?.slot
            : undefined;
          return (
          <NPC
            key={cfg.id}
            characterId={cfg.id}
            index={i}
            {...cfg}
            loadout={easelHandLoadout(baseLoadout, isPainting)}
            stageAnchor={cfg.stageAnchor}
            easelPaintingSlot={easelPaintingSlot}
            easelStageSlug={isPainting ? easelStageSlug : undefined}
            onEaselStationed={isPainting ? () => mpRef.current?.sendEaselPainterReady(cfg.id) : undefined}
            easelPaintingLabel={easelPaintingLabel}
            startX={testing ? 55 : cfg.startX}
            entryDelay={testing ? 0 : cfg.entryDelay}
            paused={chatConnected}
            greeting={greetingNpc === i}
            chatConnected={chatConnected}
            dimmed={festieDimNpcIds.has(cfg.id)}
            greetFacing={greetNpcX < 50 ? 'right' : 'left'}
            dancing={TEST_FORCE_DANCE || npcDancing[i]}
            greetingChat={greetingNpc === i ? {
              name: npcLabel,
              npcTyping,
              messages: npcMessages,
            } : undefined}
            spaceFloat={isDeepSpace}
          />
          );
        })}

        {!homePreview && npcPairOverlay}

        {/* Remote human players (PartyKit presence) */}
        {!homePreview && crowdVisualsReady && mp.remoteIds.map(pid => (
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
            spaceFloat={isDeepSpace}
          />
        ))}

        {!homePreview && crowdVisualsReady && (TEST_PLAYER_VARIANT_GALLERY ? (
          <PlayerVariantGallery
            walking={walking}
            dancing={TEST_FORCE_DANCE || playerDancing}
          />
        ) : (
          /* Player — world scrolls, character stays centred */
          <div
            className="game-character game-player-character"
            style={{
            position: 'absolute',
            left: '50%',
            bottom: mobileDevice ? CHAR_BOTTOM : `calc(${CHAR_BOTTOM})`,
            transform: `translateX(${inConversation ? chatConnectSpreadPlayerPx(greetNpcX) : 0}px)`,
            transition: 'transform 0.25s ease',
            zIndex: inConversation ? Z_CHAT_CHARACTER : Z_PLAYER_CHARACTER,
          }}>
            <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
              <Character
                walking={walking}
                facing={facing}
                dancing={TEST_FORCE_DANCE || playerDancing}
                spaceFloat={isDeepSpace}
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
      {festieSignedIn && ownerFestie && (
        <FestieLifeCorner
          festie={ownerFestie}
          ownerOnline={ownerOnline}
          lifeOpen={lifeModalOpen}
          hidden={showWelcome || showCityPicker}
          isMobile={mobileDevice}
          onToggle={toggleLife}
        />
      )}

      {sessionRecapOpen && sessionRecap && ownerFestie && (
        <FestieSessionRecapOverlay
          festie={ownerFestie}
          festieName={ownerFestie.name ?? playerName ?? 'Your festie'}
          recap={sessionRecap}
          isMobile={mobileDevice}
          onFestieUpdated={festie => setOwnerFestie(festie)}
          onDismiss={dismissSessionRecap}
          forceShowEmailSignup={TEST_FESTIE_RECAP_ON_LOAD}
        />
      )}

      <BottomControlPanel
        worldOff={midScrollWorldOff}
        playerName={playerName}
        venueRoute={effectiveVenueRoute}
        connectName={
          !inConversation && nearNpc !== null
            ? npcChatLabel(effectiveNpcCast[nearNpc]!.id, effectiveNpcCast[nearNpc]!.name)
            : !inConversation && nearPeer !== null
              ? nearPeerName
              : null
        }
        hidden={showWelcome || showCityPicker || isChatterDebugMode()}
        onConnectTap={mobileDevice ? () => connectNearRef.current?.() : undefined}
        onOpenCityPicker={() => setShowCityPicker(true)}
        vendorShopOpen={vendorShopManualOpen}
        onToggleVendorShop={toggleVendorShop}
        onVendorShopWarm={warmVendorShop}
        settingsOpen={settingsOpen}
        onToggleSettings={festieSignedIn ? toggleSettings : undefined}
        isMobile={mobileDevice}
      />

      {showHelpPopup && (
        <HelpFaqModal onClose={dismissHelpPopup} />
      )}

      {signOutConfirmOpen && (
        <SignOutConfirmModal
          festieName={ownerFestie?.name ?? playerName}
          loading={signOutLoading}
          onConfirm={() => void confirmSignOut()}
          onCancel={() => {
            if (!signOutLoading) setSignOutConfirmOpen(false);
          }}
        />
      )}

      {lifeModalOpen && ownerFestie && (
        <FestieLifeModal
          festie={ownerFestie}
          ownerOnline={ownerOnline}
          sessionRecap={sessionRecap}
          refillFrom={lifeRefillFromRef.current}
          onClose={() => {
            setLifeModalOpen(false);
            lifeRefillFromRef.current = null;
          }}
          onOpenSettings={() => openSettings('customize')}
          onUpdated={festie => setOwnerFestie(festie)}
        />
      )}

      {settingsOpen && (
        <FestieSettingsModal
          onClose={() => setSettingsOpen(false)}
          ownerOnline={ownerOnline}
          refillFrom={lifeRefillFromRef.current}
          initialTab={settingsInitialTab}
          onUpdated={festie => setOwnerFestie(festie)}
        />
      )}

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
          initialName={playerName ?? getPlayerName() ?? undefined}
          requireAuth={!festieSignedIn}
          pickStageOnly={festieSignedIn}
          onAuthSuccess={(name, sessionRecap) => {
            openSessionRecap(sessionRecap ?? null, false, name);
            void hydratePlayerSession().then(profile => {
              setFestieSignedIn(profile.authenticated);
              if (profile.festie) setOwnerFestie(profile.festie);
              if (profile.name) setPlayerName(profile.name);
              else setPlayerName(name);
              setPlayerLoadout({ ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT });
              setPlayerCoins(getPlayerCoins());
            });
          }}
          onEnter={handleWelcomeName}
          onFestieCreated={() => void handleFestieCreated()}
        />
      )}

      {showCityPicker && (
        <StagePicker
          variant="swap"
          requireName={false}
          initialRoute={effectiveVenueRoute}
          initialName={playerName ?? undefined}
          onEnter={handleCityPickerEnter}
          onClose={() => setShowCityPicker(false)}
        />
      )}

      {!isChatterDebugMode() && (
      <div data-paraloid-ui className="hidden md:flex" style={{
        position: 'absolute', bottom: 22, right: 22,
        gap: 10, alignItems: 'center', zIndex: 40,
      }}>
        <KeyboardMoveHint />
        {!showWelcome && !showCityPicker && (
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Unmute stage audio' : 'Mute stage audio'}
            aria-label={muted ? 'Unmute stage audio' : 'Mute stage audio'}
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: muted ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.65)',
              fontSize: 14, cursor: 'pointer',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        )}
        {festieSignedIn && (
          <button
            type="button"
            onClick={openSignOutConfirm}
            title="Sign out"
            aria-label="Sign out"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,.55)',
              cursor: 'pointer',
            }}
          >
            <SignOutIcon size={16} />
          </button>
        )}
      </div>
      )}

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

      {!showWelcome && !showCityPicker && !isChatterDebugMode() && (
        <MobileGameControls
          muted={muted}
          vendorShopOpen={vendorShopManualOpen}
          onToggleVendorShop={toggleVendorShop}
          onVendorShopWarm={warmVendorShop}
          settingsOpen={settingsOpen}
          onToggleSettings={festieSignedIn ? toggleSettings : undefined}
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
