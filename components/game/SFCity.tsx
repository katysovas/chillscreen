'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Character from './Character';
import { worldXToScreenPct } from './NPC';
import { AmbientPlayerOverlay, NpcPairChatOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
import { playerBubbleSide } from './ChatBubble';
import { CHAR_BOTTOM, crowdDepthOffsetPx } from './groundLayout';
import { SKY_F, MID_F, GND_F, midScrollTile, gndScrollTile } from '@/lib/parallax';
import { scheduleIdleCallback } from '@/lib/scheduleIdleCallback';
import { setAudioMuted } from '@/lib/audioMute';
import { playChatInviteBeep } from '@/lib/playChatInviteBeep';
import { playFoundSound } from '@/lib/playFoundSound';
import { npcCastForVenue } from '@/lib/npcCast';
import { ambientSeedForRoute } from '@/lib/ambientSeed';
import SFCityCrowdLayer from './SFCityCrowdLayer';
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
  dismissFestieHelp,
  fetchFestie,
  logoutFestie,
} from '@/lib/festie/client';
import {
  getFestieControlMode,
  hydrateFestieControlMode,
  subscribeFestieControlMode,
} from '@/lib/festie/controlMode';
import { patchPlayerSessionFestie } from '@/lib/player/session';
import { persistFestieStageSlug } from '@/lib/festie/stage';
import { festiePresetById } from '@/lib/festie/presets';
import {
  markFestieLifeIntroSeen,
  markFestieLifeTabExitShown,
  shouldShowFestieLifeOnTabExit,
} from '@/lib/festie/intro';
import type { FestieOwner, FestiePublic } from '@/lib/festie/types';
import {
  applyOwnerPlayerLookToFestieDef,
  festieIdFromNpcId,
  festieNpcId,
  festiesToCharacterDefs,
  hideFestieNpcForConnectedOwner,
  isFestieNpcId,
} from '@/lib/festie/toCharacterDef';
import {
  getPlayerSession,
  hydratePlayerSession,
  subscribePlayerSession,
} from '@/lib/player/session';
import { preloadPurchaseSound, playPurchaseSound, unlockPurchaseSound } from '@/lib/playPurchaseSound';
import { loadoutSyncKey, serializeLoadout } from '@/lib/multiplayer/loadoutSync';
import { isBuzNpc } from '@/lib/vendorShop';
import { pickAutopilotVendorItem } from '@/lib/autopilot/vendorShop';
import { vendorAnchorGroundWorldX } from '@/lib/stageAnchor';
import { getAmbientIntervalMs, pickAutopilotAmbientLine } from '@/lib/npcAmbientChat';
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
import { ierror, iwarn } from '@/lib/internalDebug';
import { pickFallbackReply } from '@/lib/npcChatFallbacks';
import { NPC_TYPING_MS, type ChatTurn } from '@/lib/npcChatConstants';
import { pickPromptDrawAck, PROMPT_DRAW_ACK_HOLD_MS } from '@/lib/easel/promptDrawAck';
import { fetchNpcReplyWithTyping } from '@/lib/npcChatClient';
import { getCinemaNowPlaying, subscribeCinemaNowPlaying } from '@/lib/cinemaNow';
import { getConcertNowPlaying, subscribeConcertNowPlaying } from '@/lib/concertNowPlaying';
import { gameWorldOffRef, playerWorldXRef } from '@/lib/gameWorldRef';
import { sessionSpawnJitterPx } from '@/lib/playerSpawn';
import {
  moveBroadcastFrameInterval,
  moveBroadcastWorldEpsilon,
} from '@/lib/presenceBroadcast';
import { isNearStage } from '@/lib/concertDance';
import { isCuratedChannel } from '@/lib/stageVideos';
import {
  cityTileForRoute,
  cityWorldOffBounds,
  partyRoomIdForRoute,
  stageChannelForRoute,
  stageWorldOffForRoute,
  staticCityPlayerWorldBounds,
} from '@/lib/isolatedCity';
import { partyRoomIdForStageSlug, stagePathForSlug, venueRouteForUserStage } from '@/lib/stages/runtime';
import {
  currentStagePickerTarget,
  pathForStageTarget,
  stageTargetsEqual,
  type StagePickerTarget,
} from '@/lib/stagePickerOptions';
import { setLastUsedStage } from '@/lib/lastUsedStage';
import { stageBackdropDisplayUrl } from '@/lib/stages/wallpapers';
import { useCreatorStageRemoteSync } from '@/lib/stages/useCreatorStageRemoteSync';
import {
  useOptionalCreatorStage,
  useIsCreatorStageOwner,
  useCanManageStageLineup,
  useCreatorStagePresence,
} from '@/lib/stages/CreatorStageContext';
import { fetchMyStage } from '@/lib/stages/client';
import type { UserStagePublic } from '@/lib/stages/types';
import { setVenueDressCode } from '@/lib/dressCode';
import { WelcomePopup } from './WelcomePopup';
import { StagePicker } from './StagePicker';
import { SkyCreaturesLayer } from './SkyCreatures';
import { SkyLayer } from './city/SkyLayer';
import { SpaceParallaxStars } from './city/orbit';
import { SkyCloudsLayer } from './city/SkyCloudsLayer';
import { MidLayer } from './city/MidLayer';
import { GroundLayer } from './city/GroundLayer';
import { CityNavSigns } from './CityNavSigns';
import { CabanaForegroundLayer } from './city/CabanaForegroundLayer';
import { PlayerVariantGallery } from './PlayerVariantGallery';
import { useSkyPeriod } from './hooks/useSkyPeriod';
import { AMBIENT_CHAT_ENABLED } from '@/lib/ambientChatEnabled';
import { useRoomChatter } from './hooks/useRoomChatter';
import { shouldExcludeFromStageChatter } from '@/lib/stageChatter/types';
import { isNpcStageChatterSender } from '@/lib/stageChatter/preferences';
import { purgeChatterSenderInRoom } from '@/lib/moderation/client';
import { isSuperAdminFestieName } from '@/lib/superAdmin';
import { useStageChatter } from './hooks/useStageChatter';
import { StageChatterPanel, type StageSidePanelTab } from './StageChatterPanel';
import { npcChatLabelForId } from '@/lib/npcRoster';
import { applyNpcDancing } from '@/lib/npcDancingRegistry';
import { MobileGameControls } from './MobileGameControls';
import { MobileChatInputBar } from './MobileChatInputBar';
import { venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { venueSeoForRoute } from '@/lib/venueSeo';
import { CITY_BACKDROP_FILL } from './city/cinema/constants';
import { FOREST_BACKDROP_FILL } from './city/forest/constants';
import { VEGAS_BACKDROP_FILL } from './city/lasvegas/constants';
import { SF_BACKDROP_FILL } from './city/sf/constants';
import { SEATTLE_BACKDROP_FILL } from './city/seattle/constants';
import { TENTAROO_BACKDROP_FILL } from './city/tentaroo/constants';
import { SILENT_DISCO_BACKDROP_FILL } from './city/silent-disco/constants';
import { isMobileLoungeDevice } from '@/lib/mobileLounge';
import { BottomControlPanel } from './BottomControlPanel';
import { RightControlPanel } from './RightControlPanel';
import { preloadVendorShopPanel } from './VendorShopPanelLazy';
import { HelpFaqModal } from './HelpFaqModal';
import { AutopilotMoveHintModal } from './AutopilotMoveHintModal';
import { SignOutConfirmModal } from './SignOutConfirmModal';
import { FestieLifeCorner } from './FestieLifeCorner';
import { FestieLifeModal } from './FestieLifeModal';
import { FestieSettingsModal, type FestieSettingsTab } from './FestieSettingsModal';
import { CreatorStageLineupModal } from '@/components/create/CreatorStageSettingsModal';
import { hasStickerTripActive, preloadAllLoadoutSlots, preloadCrowdLoadouts, StickerTripOverlay } from './characters/loadout';
import {
  clearNpcSyncedWorldX,
  runAllNpcMovementTicks,
  setNpcNetworkFollowMode,
  setNpcSyncedWorldX,
} from '@/lib/npcMovementRegistry';
import { runAllWorldPositionTicks } from '@/lib/worldPositionTicks';
import { StageEaselsLayer, stageSlugFromVenueRoute } from './easel/StageEaselsLayer';
import { isEaselPainterReady, subscribeEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import { setActiveEaselCanvasBlockZones } from '@/lib/easel/canvasBlocking';
import { easelSlotWorldX } from '@/lib/easel/layout';
import { mergeEaselOwnersIntoCast, preloadEaselOwners } from '@/lib/easel/cast';
import { easelPaintingContextForNpc } from '@/lib/easel/chatContext';
import { ensureEaselSession } from '@/lib/easel/checkpointClient';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import { activePainterNpcIds } from '@/lib/easel/session';
import { useEaselSession } from '@/lib/easel/useEaselSession';
import { useEaselHoldAdvance } from '@/lib/easel/useEaselHoldAdvance';
import { useEaselMaxVisible } from '@/lib/easel/useEaselMaxVisible';
import { TEST_EASEL_ON_LOAD, TEST_DRAW_MODEL_COMPARE } from '@/lib/easel/test';
import { drawModelCompareCast, runDrawModelCompare, buildCompareDrawPins, type CompareDrawPin } from '@/lib/easel/runDrawModelCompare';
import { drawModelCompareConfigKey, TEST_DRAW_MODEL_COMPARE_CONFIG } from '@/lib/easel/drawingModel';
import { parseDrawPrompt } from '@/lib/easel/parseDrawPrompt';
import {
  activeChatDrawingForNpc,
  fetchPromptDraw,
  markChatDrawingComplete,
  pruneExpiredChatDrawings,
} from '@/lib/easel/chatNpcDrawings';
import type { ChatNpcDrawingSession } from '@/lib/easel/types';
import { NpcPromptCanvasLayer } from './easel/NpcPromptCanvasLayer';
import { chatConnectSpreadPlayerPx } from '@/lib/chatConnectSpread';
import { Z_CHAT_CHARACTER, Z_PLAYER_CHARACTER } from '@/lib/zLayers';
import { bumpPublicChatBubbleLayer, usePublicChatBubbleZ } from '@/lib/publicChatBubbleLayer';
import { clearNpcConvoHold, getNpcConvoHold, hasNpcConvoHold, setNpcConvoHold, setNpcConvoReleaseListener } from '@/lib/npcConvoHold';
import { getNpcConvoAnchor, setNpcConvoAnchor } from '@/lib/npcConvoAnchor';
import { releaseNpcConvoSnap, snapNpcPairForConvo } from '@/lib/npcConvoSnap';
import { npcTouchDistPx } from '@/lib/npcProximity';
import { appendChatLine, type ChatLine } from '@/lib/chatLines';
import type { CharacterDef } from './characters';
import type { CharacterLoadout } from './characters/loadout';
import { defaultLoadout } from './characters/loadout';

/** Force all characters into dance mode regardless of stage proximity (testing). */
const TEST_FORCE_DANCE = false;

/** Show all four player variant skins side-by-side (testing). */
const TEST_PLAYER_VARIANT_GALLERY = false;

/** Equip loadout items on the player at startup (testing). */
const TEST_PLAYER_LOADOUT = {} as const;

/** Auto-connect player + first NPC on load to preview chat connect glow (testing). */
const TEST_CHAT_CONNECT_ON_LOAD = false;

/** Creator venue sky fills — keep in sync with lib/creatorVenueBackdrop.ts */
const CHILL_FOREST_BG = '#D1EBD4';

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
  const autoSkyPeriod = useSkyPeriod();
  const creatorStage = useOptionalCreatorStage();
  const isCreatorStageOwner = useIsCreatorStageOwner();
  const canManageCreatorLineup = useCanManageStageLineup();
  const skyPeriod = creatorStage?.sky ?? autoSkyPeriod;
  useCreatorStagePresence(creatorStage?.slug ?? null);

  const [mobileDevice, setMobileDevice] = useState(
    () => typeof window !== 'undefined' && isMobileLoungeDevice(),
  );
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [stageLineupOpen, setStageLineupOpen] = useState(false);
  const showCityPickerRef = useRef(false);
  const connectNearRef = useRef<(() => void) | null>(null);

  const effectiveVenueRoute = creatorStage
    ? venueRouteForUserStage(creatorStage)
    : venueRoute;
  const curatedStageChannel = useMemo(() => {
    if (creatorStage) return null;
    const channel = stageChannelForRoute(effectiveVenueRoute);
    return isCuratedChannel(channel) ? channel : null;
  }, [creatorStage, effectiveVenueRoute]);
  const stagePlaybackChannel = useMemo(() => {
    if (creatorStage) return null;
    return stageChannelForRoute(effectiveVenueRoute);
  }, [creatorStage, effectiveVenueRoute]);
  const stageChatterWelcome = useMemo(() => {
    if (creatorStage) {
      return {
        stageName: creatorStage.displayName,
        stageDescription: creatorStage.description ?? null,
      };
    }
    const seo = venueSeoForRoute(effectiveVenueRoute);
    return {
      stageName: seo.title,
      stageDescription: seo.description,
    };
  }, [creatorStage, effectiveVenueRoute]);
  const isDeepSpace = effectiveVenueRoute === 'deep-space';
  const isCreatorChill = effectiveVenueRoute === 'creator-chill';
  const isCreatorCinema = effectiveVenueRoute === 'creator-cinema' || effectiveVenueRoute === 'hula';
  const isSilentDisco = effectiveVenueRoute === 'silent-disco';
  const isForest = effectiveVenueRoute === 'forest';
  const isTentaroo = effectiveVenueRoute === 'tentaroo';
  const isSanFrancisco = effectiveVenueRoute === 'outside-hands';
  const isChillCinema = effectiveVenueRoute === 'cinema';
  const isLasVegas = effectiveVenueRoute === 'edc';
  const isSeattle = effectiveVenueRoute === 'seattle-concerts';
  const isCreatorCustomSky = isCreatorChill || isCreatorCinema || isSilentDisco || isForest || isTentaroo || isSanFrancisco || isChillCinema || isLasVegas || isSeattle;
  const staticStageBackdropUrl = effectiveVenueRoute === 'hula' ? '/images/stages/hula.webp' : null;
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
  const spawnJitterPx = sessionSpawnJitterPx();
  const initialPlayerWorldX = Math.max(
    cityBounds.min,
    Math.min(cityBounds.max, spawnWorldOff + spawnJitterPx),
  );
  const worldRef        = useRef(spawnWorldOff);
  const playerCharRef   = useRef<HTMLDivElement>(null);
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
  /** Static city — skip redundant viewBox DOM writes when camera + viewport are unchanged. */
  const lastStaticViewBoxKeyRef = useRef<string | null>(null);

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
  const staticViewBoxKey = (off: number) => {
    if (typeof window === 'undefined') return String(off);
    if (window.innerWidth <= 767) {
      return `${off}|${window.innerWidth}|${window.innerHeight}`;
    }
    return String(off);
  };

  /** Update scrolling SVG viewBoxes directly — zero React overhead. */
  const updateViewBoxes = (off: number, opts?: { force?: boolean }) => {
    const key = staticViewBoxKey(off);
    if (!opts?.force && lastStaticViewBoxKeyRef.current === key) return;
    lastStaticViewBoxKeyRef.current = key;
    const skyVx = off * SKY_F;
    const midVx = off * MID_F;
    const gndVx = off * GND_F;
    const vb    = (x: number) => `${x} 0 1400 900`;

    skyRef.current?.setAttribute('viewBox', vb(skyVx));
    groundRef.current?.setAttribute('viewBox', vb(gndVx));
    cabanaRef.current?.setAttribute('viewBox', vb(gndVx));
    navSignsRef.current?.setAttribute('viewBox', vb(gndVx));
    cloudsRef.current?.setAttribute('viewBox', vb(skyVx));
    midRef.current?.setAttribute('viewBox', vb(midVx));
    midRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    midForegroundRef.current?.setAttribute('viewBox', vb(midVx));
    midForegroundRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    midSkyLabelsRef.current?.setAttribute('viewBox', vb(midVx));
    midSkyLabelsRef.current?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
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
  const [activePairChatNpcIds, setActivePairChatNpcIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const pairParticipantsRef = useRef(new Map<string, [string, string]>());
  const [chatHistory,   setChatHistory]   = useState<ChatTurn[]>([]);
  const [chatSendTick,  setChatSendTick]  = useState(0);
  const [chatNpcDrawings, setChatNpcDrawings] = useState<ChatNpcDrawingSession[]>([]);
  const [compareDrawPins, setCompareDrawPins] = useState<CompareDrawPin[]>([]);
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
  const testDrawCompareKeyRef = useRef('');
  const festieConvoIdRef = useRef<string | null>(null);
  const promptDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [stageSidePanelTab, setStageSidePanelTab] = useState<StageSidePanelTab>('lineup');
  const [vendorShopDismissed, setVendorShopDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<FestieSettingsTab>('customize');
  const [lifeModalOpen, setLifeModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [autopilotMoveHintOpen, setAutopilotMoveHintOpen] = useState(false);
  const autopilotMoveHintOpenRef = useRef(false);
  const autopilotMoveHintCooldownRef = useRef(0);
  const [festieSignedIn, setFestieSignedIn] = useState(false);
  const [ownerFestie, setOwnerFestie] = useState<FestieOwner | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  /** undefined = not checked yet; null = signed in with no owned stage. */
  const [ownedStage, setOwnedStage] = useState<UserStagePublic | null | undefined>(undefined);
  const lifeRefillFromRef = useRef<number | null>(null);
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
    setStageSidePanelTab('chat');
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen(open => {
      if (open) return false;
      setSettingsInitialTab('customize');
      setLifeModalOpen(false);
      setStageSidePanelTab('chat');
      return true;
    });
  }, []);

  const toggleLife = useCallback(() => {
    setLifeModalOpen(open => {
      const next = !open;
      if (next) {
        setSettingsOpen(false);
        setStageSidePanelTab('chat');
      }
      return next;
    });
  }, []);

  const openSignOutConfirm = useCallback(() => {
    setSettingsOpen(false);
    setLifeModalOpen(false);
    setStageSidePanelTab('chat');
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
    if (!festieSignedIn || !profileReady) {
      setOwnedStage(undefined);
      return;
    }
    if (isCreatorStageOwner && creatorStage) {
      setOwnedStage(creatorStage);
      return;
    }
    let cancelled = false;
    void fetchMyStage()
      .then(stage => {
        if (!cancelled) setOwnedStage(stage);
      })
      .catch(() => {
        if (!cancelled) setOwnedStage(null);
      });
    return () => { cancelled = true; };
  }, [festieSignedIn, profileReady, isCreatorStageOwner, creatorStage?.slug]);

  const showCreateStageButton = festieSignedIn && profileReady;
  const isSuperAdmin = festieSignedIn && profileReady && isSuperAdminFestieName(ownerFestie?.name);
  const chatterRoomId = useMemo(
    () => (
      creatorStage
        ? partyRoomIdForStageSlug(creatorStage.slug)
        : partyRoomIdForRoute(effectiveVenueRoute)
    ),
    [creatorStage, effectiveVenueRoute],
  );
  const handlePurgeChatterSender = useCallback(async (sender: string) => {
    try {
      await purgeChatterSenderInRoom(chatterRoomId, sender);
    } catch (err) {
      console.error('[super-admin] purge chatter failed', err);
    }
  }, [chatterRoomId]);

  useEffect(() => {
    return subscribePlayerSession(() => {
      const festie = getPlayerSession().festie;
      if (festie) {
        setOwnerFestie(prev => {
          if (!prev) return festie;
          if (prev.help_dismissed_at && !festie.help_dismissed_at) {
            return { ...festie, help_dismissed_at: prev.help_dismissed_at };
          }
          return festie;
        });
      }
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
    const dismissed = { ...ownerFestie, help_dismissed_at: dismissedAt };
    setOwnerFestie(dismissed);
    patchPlayerSessionFestie({ help_dismissed_at: dismissedAt });
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
    && !settingsOpen
    && !lifeModalOpen,
  );

  const toggleVendorShop = useCallback(() => {
    unlockPurchaseSound();
    setStageSidePanelTab(tab => {
      if (tab === 'shop') {
        setVendorShopDismissed(true);
        return 'chat';
      }
      setVendorShopDismissed(false);
      setSettingsOpen(false);
      setLifeModalOpen(false);
      return 'shop';
    });
  }, []);

  const closeVendorShop = useCallback(() => {
    setStageSidePanelTab('chat');
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
  const autopilotShopCooldownRef = useRef(0);
  const autopilotAmbientAtRef = useRef(0);

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
    onRoomChat: (_sender: string, _text: string, _ts?: number) => {},
    onRoomTyping: (_sender: string, _typing: boolean) => {},
    onStageChatterHistory: (_messages: import('@/lib/stageChatter/types').StageChatterMessage[]) => {},
    onNpcConvoStart: (_convoId: string, _participants: [string, string], _meta?: NpcConvoMeta) => {},
    onNpcLine: (_convoId: string, _npc: string, _text: string, _ts?: number) => {},
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
    roomId: creatorStage
      ? partyRoomIdForStageSlug(creatorStage.slug)
      : partyRoomIdForRoute(effectiveVenueRoute),
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
    onRoomChat: (sender, text, ts) => chatterHandlersRef.current.onRoomChat(sender, text, ts),
    onRoomTyping: (sender, typing) => chatterHandlersRef.current.onRoomTyping(sender, typing),
    onStageChatterHistory: messages =>
      chatterHandlersRef.current.onStageChatterHistory(messages),
    onNpcConvoStart: (convoId, participants, meta) =>
      chatterHandlersRef.current.onNpcConvoStart(convoId, participants, meta),
    onNpcLine: (convoId, npc, text, ts) =>
      chatterHandlersRef.current.onNpcLine(convoId, npc, text, ts),
    onNpcConvoEnd: convoId => chatterHandlersRef.current.onNpcConvoEnd(convoId),
  });
  const mpRef = useRef(mp);
  mpRef.current = mp;
  const isNpcLeaderRef = useRef(mp.isNpcLeader);
  isNpcLeaderRef.current = mp.isNpcLeader;

  useEffect(() => {
    const follow = mp.connected && mp.selfId != null && !mp.isNpcLeader;
    setNpcNetworkFollowMode(follow);
    if (!follow) clearNpcSyncedWorldX();
  }, [mp.connected, mp.selfId, mp.isNpcLeader]);

  useEffect(() => {
    if (mp.isNpcLeader && mp.connected && mp.selfId) {
      lastNpcPosSendRef.current = 0;
    }
  }, [mp.isNpcLeader, mp.connected, mp.selfId]);

  useCreatorStageRemoteSync(creatorStage?.slug, canManageCreatorLineup, mp);

  const easelChannel = stageChannelForRoute(effectiveVenueRoute);
  const easelStageSlug = creatorStage?.slug ?? stageSlugFromVenueRoute(effectiveVenueRoute);
  const easelLayoutRoute = effectiveVenueRoute;
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
  useEaselMaxVisible(
    easelStageSlug,
    activeEaselSession,
    easelSessionEnabled && easelUserActive && !partyDrivesEasel,
  );
  const [easelCastReady, setEaselCastReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setChatNpcDrawings(prev => pruneExpiredChatDrawings(prev));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleChatDrawingComplete = useCallback((sessionId: string) => {
    setChatNpcDrawings(prev => prev.map(session =>
      session.id === sessionId ? markChatDrawingComplete(session) : session,
    ));
  }, []);

  useEffect(() => {
    if (!TEST_DRAW_MODEL_COMPARE || homePreview) return;
    if (!crowdVisualsReady) return;

    const configKey = drawModelCompareConfigKey();
    if (testDrawCompareKeyRef.current === configKey) return;
    testDrawCompareKeyRef.current = configKey;

    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const worldOff = worldRef.current;
    setCompareDrawPins(buildCompareDrawPins(worldOff, width));
    setChatNpcDrawings([]);

    void runDrawModelCompare(worldOff, width, session => {
      setChatNpcDrawings(prev => [
        ...prev.filter(s => s.npcId !== session.npcId),
        session,
      ]);
    }).then(sessions => {
      if (sessions.length === 0) {
        iwarn('[draw-compare] no sessions returned — check OPENROUTER_API_KEY');
      }
    });
  }, [homePreview, crowdVisualsReady]);

  useEffect(() => {
    if (!easelSessionEnabled || partyDrivesEasel || TEST_DRAW_MODEL_COMPARE) return;
    if (!easelUserActive) return;
    void ensureEaselSession(easelStageSlug).then(slots => {
      if (slots.length > 0) notifyEaselUpdated();
    });
  }, [easelSessionEnabled, easelStageSlug, easelUserActive, partyDrivesEasel]);

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
    && !TEST_DRAW_MODEL_COMPARE
    && (TEST_EASEL_ON_LOAD || (!showWelcome && !showCityPicker))
    && Boolean(activeEaselSession?.slots.length);

  useEffect(() => {
    const syncBlockZones = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const cameraOff = gameWorldOffRef.current;
      const zones: { canvasWorldX: number; painterNpcId: string }[] = [];

      for (const slot of activeEaselSession?.slots ?? []) {
        if (slot.status !== 'painting' || !isEaselPainterReady(slot.npc)) continue;
        zones.push({
          canvasWorldX: easelSlotWorldX(slot.slot, easelStageSlug, width, easelLayoutRoute, cameraOff),
          painterNpcId: slot.npc,
        });
      }

      for (const drawing of chatNpcDrawings) {
        if (drawing.status !== 'painting') continue;
        zones.push({
          canvasWorldX: drawing.canvasWorldX,
          painterNpcId: drawing.npcId,
        });
      }

      setActiveEaselCanvasBlockZones(zones);
    };
    syncBlockZones();
    return subscribeEaselPainterReady(syncBlockZones);
  }, [activeEaselSession, easelStageSlug, easelLayoutRoute, chatNpcDrawings]);

  const controlMode = useSyncExternalStore(
    subscribeFestieControlMode,
    getFestieControlMode,
    () => 'human' as const,
  );
  const autopilotOn = festieSignedIn && Boolean(ownerFestie) && controlMode === 'ai';
  const autopilotOnRef = useRef(autopilotOn);
  autopilotOnRef.current = autopilotOn;
  autopilotMoveHintOpenRef.current = autopilotMoveHintOpen;
  const ownerFestieNpcId = ownerFestie?.id ? festieNpcId(ownerFestie.id) : null;
  const ownerFestieNpcIdRef = useRef(ownerFestieNpcId);
  ownerFestieNpcIdRef.current = ownerFestieNpcId;
  const ownerFestieNpcIndexRef = useRef(-1);
  const ownerFestieSpawnWx = useMemo(() => {
    if (!autopilotOn) return null;
    return playerWorldXRef.current;
  }, [autopilotOn]);

  const syncedStageFesties = useMemo((): FestiePublic[] => {
    const list = [...mp.festies];
    const online = festieSignedIn && Boolean(mp.selfId);
    if (!online || !ownerFestie) return list;
    const enriched: FestiePublic = {
      ...ownerFestie,
      owner_on_stage: !autopilotOn,
      control_mode: autopilotOn ? 'ai' : 'human',
    };
    const idx = list.findIndex(f => f.id === ownerFestie.id);
    if (idx >= 0) {
      list[idx] = enriched;
      return list;
    }
    return [...list, enriched];
  }, [mp.festies, mp.selfId, festieSignedIn, ownerFestie, autopilotOn]);

  const effectiveNpcCast = useMemo(() => {
    const compareCast = drawModelCompareCast();
    if (compareCast) return compareCast;

    const connectedOwnerIds = new Set(mp.connectedUserIds);
    let festieDefs = festiesToCharacterDefs(syncedStageFesties, effectiveVenueRoute)
      .filter(cfg => {
        const festieId = festieIdFromNpcId(cfg.id);
        if (!festieId) return true;
        const festie = syncedStageFesties.find(f => f.id === festieId);
        if (!festie) return true;
        return !hideFestieNpcForConnectedOwner(
          festie,
          connectedOwnerIds,
          userIdRef.current,
          autopilotOn,
        );
      });
    if (ownerFestieNpcId) {
      festieDefs = festieDefs.map(cfg => {
        const extras: Partial<CharacterDef> = { entryDelay: 0 };
        if (autopilotOn && ownerFestieSpawnWx != null) {
          extras.spawnWorldX = ownerFestieSpawnWx;
        }
        return applyOwnerPlayerLookToFestieDef(
          cfg,
          ownerFestieNpcId,
          myColor,
          playerLoadout,
          extras,
        );
      });
    }

    const base = [
      ...npcCast,
      ...festieDefs,
    ];
    if (!easelSessionEnabled) return base;
    if (!easelCastReady && !TEST_EASEL_ON_LOAD) return base;
    return mergeEaselOwnersIntoCast(
      base,
      easelChannel,
      activePainterNpcIds(activeEaselSession),
    );
  }, [npcCast, syncedStageFesties, effectiveVenueRoute, easelCastReady, activeEaselSession, easelSessionEnabled, easelChannel, autopilotOn, ownerFestieNpcId, ownerFestieSpawnWx, myColor, playerLoadout, mp.connectedUserIds]);

  const ownerFestieVendorAttractWx = useMemo(() => {
    if (!autopilotOn) return undefined;
    const buz = effectiveNpcCast.find(c => isBuzNpc(c.id) && c.stageAnchor);
    if (!buz?.stageAnchor) return undefined;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return vendorAnchorGroundWorldX(buz.stageAnchor, gndScrollWorldOff, width) ?? undefined;
  }, [autopilotOn, effectiveNpcCast, gndScrollWorldOff]);

  const effectiveNpcCastKey = useMemo(
    () => effectiveNpcCast.map(c => c.id).join('\0'),
    [effectiveNpcCast],
  );
  const effectiveNpcCastRef = useRef(effectiveNpcCast);
  effectiveNpcCastRef.current = effectiveNpcCast;
  const ownerFestieRef = useRef(ownerFestie);
  ownerFestieRef.current = ownerFestie;

  // Sync DB control_mode into local store once when festie loads — not on every
  // ownerFestie patch (session emits can briefly carry stale control_mode).
  useEffect(() => {
    if (!ownerFestie?.id) return;
    hydrateFestieControlMode(ownerFestie.control_mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity load only
  }, [ownerFestie?.id]);

  useEffect(() => {
    ownerFestieNpcIndexRef.current = ownerFestieNpcId
      ? effectiveNpcCast.findIndex(c => c.id === ownerFestieNpcId)
      : -1;
  }, [effectiveNpcCast, ownerFestieNpcId]);

  useEffect(() => {
    if (!autopilotOn) return;
    if (ownerFestieNpcId) clearNpcConvoHold(ownerFestieNpcId);
    autopilotAmbientAtRef.current = Date.now() + 3_000 + Math.random() * 4_000;
    keysRef.current.left = false;
    keysRef.current.right = false;
    walkingRef.current = false;
    setWalking(false);
    if (greetingRef.current !== null) {
      const npcId = effectiveNpcCastRef.current[greetingRef.current]?.id;
      greetingRef.current = null;
      setGreetingNpc(null);
      if (npcId) mpRef.current?.sendNpcChat(npcId, false);
    }
    if (peerChatRef.current !== null) {
      endPeerChatRef.current?.(true);
    }
    setChatMode(null);
    setChatDraft('');
    setPlayerMessages([]);
    setNearNpc(null);
    nearNpcRef.current = null;
    setNearPeer(null);
    nearPeerRef.current = null;
  }, [autopilotOn, ownerFestieNpcId]);

  const resolveFestieNpcName = useCallback((npcId: string): string | null => {
    if (!isFestieNpcId(npcId)) return null;
    const festieId = festieIdFromNpcId(npcId);
    if (!festieId) return null;
    const owner = ownerFestieRef.current;
    if (owner?.id === festieId) {
      const name = owner.name?.trim();
      if (name) return name;
    }
    const festie = mpRef.current?.festies.find(f => f.id === festieId);
    return festie?.name?.trim() ?? null;
  }, []);

  const resolveStageChatterName = useCallback((sender: string) => {
    if (sender.startsWith('user:')) return sender.slice(5);
    if (sender.startsWith('npc:')) {
      const npcId = sender.slice(4);
      const cfg = effectiveNpcCastRef.current.find(c => c.id === npcId);
      const festieName = resolveFestieNpcName(npcId);
      if (festieName) return npcChatLabelForId(npcId, festieName);
      if (cfg?.name) return npcChatLabelForId(npcId, cfg.name);
      return npcChatLabelForId(npcId, 'Wanderer');
    }
    return sender;
  }, [resolveFestieNpcName]);

  const resolveStageChatterGlow = useCallback((sender: string) => {
    if (sender.startsWith('npc:')) {
      const npcId = sender.slice(4);
      const cfg = effectiveNpcCastRef.current.find(c => c.id === npcId);
      if (cfg?.balloonColor) return cfg.balloonColor;
      if (isFestieNpcId(npcId)) {
        const festieId = festieIdFromNpcId(npcId);
        if (festieId) {
          const festie = mpRef.current?.festies.find(f => f.id === festieId);
          if (festie) {
            const preset = festiePresetById(festie.preset);
            return preset.balloonColor;
          }
          const owner = ownerFestieRef.current;
          if (owner?.id === festieId) {
            const preset = festiePresetById(owner.preset);
            return preset.balloonColor;
          }
        }
      }
    }
    if (sender.startsWith('user:')) {
      const label = sender.slice(5);
      const selfName = profileRef.current.name?.trim();
      if (selfName && label === selfName) return profileRef.current.balloonColor;
      const m = mpRef.current;
      if (m?.selfId && (label === m.selfId || m.selfId.startsWith(label))) {
        return profileRef.current.balloonColor;
      }
      for (const [, st] of m?.remoteStateRef.current ?? []) {
        const n = st.name?.trim();
        if (n && n === label) return st.balloonColor;
      }
    }
    return undefined;
  }, []);

  const festieDimNpcIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of mp.festies) {
      if (f.tier === 'dim') ids.add(festieNpcId(f.id));
    }
    return ids;
  }, [mp.festies]);

  const ownerOnline = festieSignedIn && Boolean(mp.selfId);

  const roomChatter = useRoomChatter(resolvePlayerId);
  const stageChatter = useStageChatter();
  const roomChatterRef = useRef(roomChatter);
  roomChatterRef.current = roomChatter;
  const handleVendorPurchaseRef = useRef(handleVendorPurchase);
  handleVendorPurchaseRef.current = handleVendorPurchase;
  const playerCoinsRef = useRef(playerCoins);
  playerCoinsRef.current = playerCoins;
  const playerLoadoutRef = useRef(playerLoadout);
  playerLoadoutRef.current = playerLoadout;

  useEffect(() => {
    if (!festieSignedIn || !mp.connected) return;
    mpRef.current?.requestFestiesSync();
  }, [autopilotOn, festieSignedIn, mp.connected]);

  useEffect(() => {
    if (!autopilotOn || !ownerFestieNpcId) return;
    const t = setTimeout(() => {
      roomChatter.handleNpcShout(ownerFestieNpcId, "let's party!");
    }, 32);
    return () => clearTimeout(t);
  }, [autopilotOn, ownerFestieNpcId, roomChatter.handleNpcShout]);

  useEffect(() => {
    if (mp.npcConvoPairs.length === 0) return;
    setActivePairChatNpcIds(prev => {
      const next = new Set(prev);
      for (const pair of mp.npcConvoPairs) {
        pairParticipantsRef.current.set(pair.convoId, pair.participants);
        for (const id of pair.participants) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [mp.npcConvoPairs]);

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
    onStageChatterHistory: messages => stageChatter.loadHistory(messages),
    onRoomTyping: (sender, typing) => {
      if (!isNpcStageChatterSender(sender)) {
        stageChatter.setTyping(sender, typing);
      }
    },
    onRoomChat: (sender, text, ts) => {
      if (sender.startsWith('npc:')) {
        const npcId = sender.slice(4);
        roomChatter.handleNpcShout(npcId, text);
        if (npcId === ownerFestieNpcId) {
          const cfg = effectiveNpcCast.find(c => c.id === npcId);
          trackAmbientNpcChatter(npcId, text, 'solo', {
            stage: effectiveVenueRoute,
            npcName: cfg ? npcChatLabel(npcId, cfg.name) : undefined,
          });
        }
        return;
      }
      if (!shouldExcludeFromStageChatter(sender, text)) {
        stageChatter.appendMessage(sender, text, ts);
      }
      if (skipRoomChatEcho(sender)) return;
      roomChatter.handleRoomChat(sender, text);
    },
    onNpcConvoStart: (convoId, participants, _meta) => {
      pairParticipantsRef.current.set(convoId, participants);
      setActivePairChatNpcIds(prev => {
        const next = new Set(prev);
        for (const id of participants) next.add(id);
        return next;
      });
      for (const npcId of participants) {
        stageChatter.setTyping(`npc:${npcId}`, true);
      }
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
    onNpcLine: (convoId, npc, text, ts) => {
      stageChatter.appendMessage(`npc:${npc}`, text, ts);
      stageChatter.setTyping(`npc:${npc}`, false);
      const pair = mpRef.current?.npcConvoPairs.find(p => p.convoId === convoId);
      if (pair) {
        const otherNpc = pair.participants.find(id => id !== npc);
        if (otherNpc) stageChatter.setTyping(`npc:${otherNpc}`, true);
      }
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
      const participants = pairParticipantsRef.current.get(convoId)
        ?? mpRef.current?.npcConvoPairs.find(p => p.convoId === convoId)?.participants;
      pairParticipantsRef.current.delete(convoId);
      if (participants) {
        setActivePairChatNpcIds(prev => {
          const next = new Set(prev);
          for (const id of participants) next.delete(id);
          return next;
        });
      }
      for (const npcId of participants ?? []) {
        stageChatter.setTyping(`npc:${npcId}`, false);
      }
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

  const disconnectFromNpcChatRef = useRef<() => void>(() => {});
  const disconnectFromNpcChat = useCallback(() => {
    if (promptDrawTimerRef.current) {
      clearTimeout(promptDrawTimerRef.current);
      promptDrawTimerRef.current = null;
    }
    if (peerChatRef.current !== null) {
      endPeerChatRef.current?.(true);
      return;
    }
    const npcIndex = greetingRef.current;
    const npcId = npcIndex !== null ? effectiveNpcCastRef.current[npcIndex]?.id : null;
    chatAbortRef.current?.abort();
    greetingRef.current = null;
    setGreetingNpc(null);
    if (npcId) mpRef.current?.sendNpcChat(npcId, false);
    disconnectUntil.current = Date.now() + 2000;
    setChatMode(null);
    setChatDraft('');
    setPlayerMessages([]);
    setNpcMessages([]);
    setNpcTyping(false);
    setChatHistory([]);
    setChatSendTick(0);
    sentMessageRef.current = '';
  }, []);
  disconnectFromNpcChatRef.current = disconnectFromNpcChat;

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
    const cameraX = spawnWorldOff;
    worldRef.current = cameraX;
    playerWorldXRef.current = initialPlayerWorldX;
    setMidScrollWorldOff(cameraX);
    setGndScrollWorldOff(cameraX);
    gameWorldOffRef.current = cameraX;
    lastStaticViewBoxKeyRef.current = null;
    updateViewBoxes(cameraX, { force: true });
    lastMidScrollTileRef.current = midScrollTile(cameraX);
    lastGndScrollTileRef.current = gndScrollTile(cameraX);
    if (playerCharRef.current) {
      playerCharRef.current.style.left = '50%';
    }
  // updateViewBoxes is stable (no deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnWorldOff]);

  useLayoutEffect(() => {
    if (!ownerFestieNpcId || autopilotOn) return;
    const wx = playerWorldXRef.current;
    setNpcConvoHold(ownerFestieNpcId, wx);
    npcWorldXByIdRef.current.set(ownerFestieNpcId, wx);
  }, [ownerFestieNpcId, autopilotOn, effectiveNpcCastKey]);

  useLayoutEffect(() => {
    if (autopilotOn && ownerFestieNpcId && ownerFestieSpawnWx != null) {
      npcWorldXByIdRef.current.set(ownerFestieNpcId, ownerFestieSpawnWx);
    }
    npcWorldXRefs.current = effectiveNpcCast.map(cfg =>
      npcWorldXByIdRef.current.get(cfg.id) ?? Infinity,
    );
    npcDancingRef.current = effectiveNpcCast.map((_, i) => npcDancingRef.current[i] ?? false);
  }, [effectiveNpcCastKey, autopilotOn, ownerFestieNpcId, ownerFestieSpawnWx]);

  const navigateToStageTarget = useCallback((target: StagePickerTarget) => {
    setShowCityPicker(false);
    setLastUsedStage(target);
    if (target.kind === 'creator') {
      const slug = target.slug.toLowerCase();
      if (creatorStage?.slug === slug) return;
      router.push(stagePathForSlug(slug));
      return;
    }
    if (!creatorStage && target.route === effectiveVenueRoute) return;
    router.push(`/${venueSlugForRoute(target.route)}`);
  }, [creatorStage, effectiveVenueRoute, router]);

  const navigateToCity = useCallback((route: VenueRoute) => {
    navigateToStageTarget({ kind: 'venue', route });
  }, [navigateToStageTarget]);

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
      if (TEST_DRAW_MODEL_COMPARE) return;
      return;
    }

    if (TEST_DRAW_MODEL_COMPARE) return;

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
        ...effectiveNpcCast.map(c => c.loadout),
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
    if (homePreview) return;
    if (creatorStage) {
      setLastUsedStage({ kind: 'creator', slug: creatorStage.slug });
      return;
    }
    setLastUsedStage({ kind: 'venue', route: effectiveVenueRoute });
  }, [homePreview, creatorStage, effectiveVenueRoute]);

  useEffect(() => {
    if (homePreview || !festieSignedIn) return;
    if (creatorStage) {
      persistFestieStageSlug(creatorStage.slug);
      return;
    }
    persistFestieStageSlug(venueSlugForRoute(effectiveVenueRoute));
  }, [homePreview, festieSignedIn, creatorStage, effectiveVenueRoute]);

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
    const selfId = mpRef.current?.selfId;
    if (selfId) bumpPublicChatBubbleLayer(`player:${selfId}`);
    setPlayerAmbientMessages(prev => appendChatLine(prev, text));
    ambientHideRef.current = setTimeout(() => {
      setPlayerAmbientMessages([]);
      ambientHideRef.current = null;
    }, PLAYER_AMBIENT_VISIBLE_MS);
  }, [clearAmbientHide]);

  useEffect(() => () => {
    if (promptDrawTimerRef.current) clearTimeout(promptDrawTimerRef.current);
  }, []);

  useEffect(() => () => { clearAmbientHide(); }, [clearAmbientHide]);

  // ── Ground Score — sidewalk coin pickups ───────────────────────────────────
  const handleGroundScore = useCallback((value: number) => {
    void addPlayerCoins(value).then(coins => setPlayerCoins(coins));
    const message = `ground score! ${value} coins!`;
    showPlayerAmbient(message);
    mpRef.current?.sendAmbientMessage(message);
    playFoundSound();
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
    setChatDraft('');
    if (peerChatRef.current !== null) {
      setPlayerMessages(prev => appendChatLine(prev, safe));
      mpRef.current?.sendPeerMessage(peerChatRef.current, safe);
      mpRef.current?.sendPeerTyping(peerChatRef.current, false);
      return;
    }

    const drawSubject = greetingNpc !== null ? parseDrawPrompt(safe) : null;
    if (drawSubject && greetingNpc !== null) {
      const idx = greetingNpc;
      const npc = effectiveNpcCastRef.current[idx];
      const wx = npcWorldXRefs.current[idx];
      setPlayerMessages(prev => appendChatLine(prev, safe));

      if (promptDrawTimerRef.current) clearTimeout(promptDrawTimerRef.current);
      setNpcTyping(true);
      promptDrawTimerRef.current = setTimeout(() => {
        promptDrawTimerRef.current = null;
        setNpcTyping(false);
        if (!npc) return;
        setNpcMessages(prev => appendChatLine(prev, pickPromptDrawAck(npc, drawSubject)));
        promptDrawTimerRef.current = setTimeout(() => {
          promptDrawTimerRef.current = null;
          disconnectFromNpcChatRef.current();
          if (Number.isFinite(wx)) {
            void fetchPromptDraw({
              npcId: npc.id,
              prompt: drawSubject,
              npcWorldX: wx,
            }).then(hit => {
              if (!hit) return;
              setChatNpcDrawings(prev => [
                ...prev.filter(s => s.npcId !== hit.npcId),
                { ...hit, status: 'painting' },
              ]);
            });
          }
        }, PROMPT_DRAW_ACK_HOLD_MS);
      }, NPC_TYPING_MS);
      return;
    }

    setPlayerMessages(prev => appendChatLine(prev, safe));
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

  const handleStageChatterSend = useCallback((text: string) => {
    const filtered = filterChatMessage(text);
    if (!filtered.ok) return;
    const label = playerName?.trim() || mpRef.current?.selfId?.slice(0, 8) || 'festie';
    const sender = `user:${label}`;
    stageChatter.setTyping(sender, false);
    roomChatter.handleRoomChat(sender, filtered.text);
    mpRef.current?.sendRoomChat(filtered.text);
  }, [playerName, roomChatter, stageChatter.setTyping]);

  const handleStageChatterTyping = useCallback((typing: boolean) => {
    const label = playerName?.trim() || mpRef.current?.selfId?.slice(0, 8) || 'festie';
    const sender = `user:${label}`;
    stageChatter.setTyping(sender, typing);
    mpRef.current?.sendRoomTyping(typing);
  }, [playerName, stageChatter.setTyping]);

  const handleStageChatterHumansOnly = useCallback((enabled: boolean) => {
    mpRef.current?.sendHumansOnlyChatter(enabled);
  }, []);

  const handleWelcomeEnter = (name: string, target: StagePickerTarget) => {
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

    const current = currentStagePickerTarget(
      effectiveVenueRoute,
      creatorStage?.slug ?? null,
    );
    if (current && stageTargetsEqual(current, target)) return;

    if (target.kind === 'creator') {
      router.push(pathForStageTarget(target));
      return;
    }
    navigateToCity(target.route);
  };

  const handleCityPickerEnter = useCallback((name: string, target: StagePickerTarget) => {
    if (!getPlayerName() && name) {
      saveSessionPlayerName(name);
      identifyPlayer(name);
      setPlayerName(name);
    }
    closeVendorShop();
    navigateToStageTarget(target);
  }, [closeVendorShop, navigateToStageTarget]);

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
    const cameraOff = () => worldRef.current;
    const playerWorldX = () => playerWorldXRef.current;

    const syncPlayerScreenX = (width: number) => {
      if (!playerCharRef.current) return;
      const pct = worldXToScreenPct(playerWorldXRef.current, cameraOff(), width);
      playerCharRef.current.style.left = `${pct}%`;
    };

    const clampPlayerWorldX = (width: number) => {
      const { min, max } = staticCityPlayerWorldBounds(cameraOff(), width);
      playerWorldXRef.current = Math.max(min, Math.min(max, playerWorldXRef.current));
      syncPlayerScreenX(width);
    };

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
      const navKeys = new Set([
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'a', 'A', 'd', 'D', 'w', 'W', ' ',
      ]);

      if (e.key === 'Escape' && autopilotMoveHintOpenRef.current) {
        e.preventDefault();
        setAutopilotMoveHintOpen(false);
        autopilotMoveHintCooldownRef.current = Date.now() + 8_000;
        return;
      }

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

      if (autopilotOnRef.current && navKeys.has(e.key)) {
        e.preventDefault();
        const now = Date.now();
        if (!autopilotMoveHintOpenRef.current && now >= autopilotMoveHintCooldownRef.current) {
          setAutopilotMoveHintOpen(true);
          autopilotMoveHintCooldownRef.current = now + 8_000;
        }
        return;
      }

      if (!autopilotOnRef.current) {
        if (['ArrowLeft',  'a', 'A'].includes(e.key)) { keysRef.current.left  = true;  e.preventDefault(); }
        if (['ArrowRight', 'd', 'D'].includes(e.key)) { keysRef.current.right = true;  e.preventDefault(); }
      }
      if (
        !autopilotOnRef.current
        && !showWelcomeRef.current
        && !showCityPickerRef.current
        && ['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)
      ) {
        mpRef.current?.requestConnect();
      }
      if (!autopilotOnRef.current && ['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
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
        if (autopilotOnRef.current) return;
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
      if (autopilotOnRef.current) return;
      if (['ArrowLeft',  'a', 'A'].includes(e.key)) keysRef.current.left  = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = false;
    };
    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup',   onUp);

    const updateDanceState = (off: number) => {
      const width = window.innerWidth;
      const greeting = greetingRef.current;
      const playerWx = playerWorldX();

      const playerNear = greeting === null && isNearStage(playerWx, off, width);
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
        next.forEach((d, i) => applyNpcDancing(i, d));
      }
    };

    // Stream local position to PartyKit — ~15 Hz desktop, ~7.5 Hz mobile, only on change.
    const broadcastMove = () => {
      if (showWelcomeRef.current || showCityPickerRef.current) return;
      const last = lastSentRef.current;
      let wx = playerWorldX();
      if (autopilotOnRef.current) {
        const idx = ownerFestieNpcIndexRef.current;
        if (idx >= 0) {
          const npcWx = npcWorldXRefs.current[idx];
          if (Number.isFinite(npcWx)) wx = npcWx;
        }
      }
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
      if (!isNpcLeaderRef.current || !mpRef.current?.connected || !mpRef.current?.selfId) return;
      const now = Date.now();
      if (now - lastNpcPosSendRef.current <= 66) return;
      lastNpcPosSendRef.current = now;
      const width = window.innerWidth;
      const off = cameraOff();
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
      const ownerId = ownerFestieNpcIdRef.current;
      for (let i = 0; i < cast.length; i++) {
        if (autopilotOnRef.current && ownerId && cast[i]!.id === ownerId) continue;
        const worldX = sync.get(cast[i]!.id);
        setNpcSyncedWorldX(i, worldX != null && Number.isFinite(worldX) ? worldX : null);
      }
    };

    const runAutopilotAmbient = () => {
      const ownerId = ownerFestieNpcIdRef.current;
      if (!autopilotOnRef.current || !ownerId) return;
      const now = Date.now();
      if (now < autopilotAmbientAtRef.current) return;
      const cfg = effectiveNpcCastRef.current.find(c => c.id === ownerId);
      if (!cfg) return;
      const { minMs, maxMs } = getAmbientIntervalMs(ownerId);
      autopilotAmbientAtRef.current = now + minMs + Math.random() * (maxMs - minMs);
      if (roomChatterRef.current.isNpcInConvo(ownerId)) return;
      roomChatterRef.current.handleNpcShout(ownerId, pickAutopilotAmbientLine(cfg));
    };

    const runAutopilotVendor = () => {
      const ownerId = ownerFestieNpcIdRef.current;
      if (!autopilotOnRef.current || !ownerId) return;
      const now = Date.now();
      if (now < autopilotShopCooldownRef.current) return;
      if (peerChatRef.current !== null) return;

      const cast = effectiveNpcCastRef.current;
      const buzIdx = cast.findIndex(c => isBuzNpc(c.id));
      const festieIdx = ownerFestieNpcIndexRef.current;
      if (buzIdx < 0 || festieIdx < 0) return;
      if (greetingRef.current !== null && greetingRef.current !== buzIdx) return;

      const festieWx = npcWorldXRefs.current[festieIdx];
      const buzWx = npcWorldXRefs.current[buzIdx];
      if (!Number.isFinite(festieWx) || !Number.isFinite(buzWx)) return;

      const width = window.innerWidth;
      if (Math.abs(festieWx! - buzWx!) > npcTouchDistPx(width) * 2.5) return;

      const itemId = pickAutopilotVendorItem(playerCoinsRef.current, playerLoadoutRef.current);
      if (!itemId) return;

      autopilotShopCooldownRef.current = now + 45_000;

      if (greetingRef.current !== buzIdx) {
        const screenPct = worldXToScreenPct(buzWx!, worldRef.current, width);
        connectToNpc(buzIdx, screenPct);
      }

      void handleVendorPurchaseRef.current(itemId).then(ok => {
        if (ok) {
          unlockPurchaseSound();
          playPurchaseSound();
        }
        window.setTimeout(() => {
          if (greetingRef.current === buzIdx) disconnect();
        }, 1_200);
      });
    };

    const persistNpcWorldXById = () => {
      const cast = effectiveNpcCastRef.current;
      for (let i = 0; i < cast.length; i++) {
        const wx = npcWorldXRefs.current[i];
        if (Number.isFinite(wx)) npcWorldXByIdRef.current.set(cast[i]!.id, wx!);
      }
    };

    const tickNpcs = () => {
      if (!autopilotOnRef.current && ownerFestieNpcIdRef.current) {
        const wx = playerWorldXRef.current;
        setNpcConvoHold(ownerFestieNpcIdRef.current, wx);
        const idx = ownerFestieNpcIndexRef.current;
        if (idx >= 0) npcWorldXRefs.current[idx] = wx;
      }
      applyNetworkNpcPositions();
      runAllNpcMovementTicks(
        cameraOff(),
        window.innerWidth,
        npcWorldXRefs.current,
      );
      persistNpcWorldXById();
      runAllWorldPositionTicks(worldRef.current, window.innerWidth);
    };

    connectNearRef.current = () => {
      if (autopilotOnRef.current) return;
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
      const noWalk = inChatFreeze || autopilotOnRef.current;

      if (noWalk) {
        keysRef.current.left = false;
        keysRef.current.right = false;
        if (walkingRef.current) { walkingRef.current = false; setWalking(false); }
      }

      // While in any conversation (NPC or peer), skip movement only
      if (inChatFreeze) {
        frameCountRef.current++;
        tickNpcs();
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
          playerWorldXRef.current -= SPEED;
          if (facingRef.current !== 'left') { facingRef.current = 'left'; setFacing('left'); }
          isWalking = true;
        } else if (right && !left) {
          playerWorldXRef.current += SPEED;
          if (facingRef.current !== 'right') { facingRef.current = 'right'; setFacing('right'); }
          isWalking = true;
        }
        clampPlayerWorldX(window.innerWidth);
      }

      if (isWalking !== walkingRef.current) {
        walkingRef.current = isWalking;
        setWalking(isWalking);
      }

      tickNpcs();

      // Throttle proximity + dance checks to every 4 frames (~15 Hz).
      // These don't need 60 Hz precision — 15 Hz is imperceptibly snappy.
      frameCountRef.current++;
      if (frameCountRef.current % 4 === 0) {
        // Proximity check only — connection requires Enter. Picks the single
        // closest interactable (NPC or real player) within touch range.
        if (greetingRef.current === null && peerChatRef.current === null && !autopilotOnRef.current) {
          const width = window.innerWidth;
          const greetDistPx = npcTouchDistPx(width);
          let nextNpc: number | null = null;
          let nextPeer: string | null = null;
          let bestDist = Infinity;
          if (Date.now() > disconnectUntil.current) {
            const playerWx = playerWorldX();
            const off = cameraOff();
            for (let i = 0; i < npcWorldXRefs.current.length; i++) {
              const npcId = effectiveNpcCastRef.current[i]?.id;
              if (npcId && npcId === ownerFestieNpcIdRef.current) continue;
              const wx = npcWorldXRefs.current[i];
              if (!Number.isFinite(wx)) continue;
              const screenPct = worldXToScreenPct(wx, off, width);
              const distPx    = Math.abs(wx - playerWx);
              if (screenPct >= 5 && screenPct <= 95 && distPx < greetDistPx && distPx < bestDist) {
                bestDist = distPx; nextNpc = i; nextPeer = null;
              }
            }
            const roster = mpRef.current?.remoteStateRef.current;
            if (roster) {
              for (const [pid, st] of roster) {
                const screenPct = worldXToScreenPct(st.worldX, off, width);
                const distPx    = Math.abs(st.worldX - playerWx);
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
        if (autopilotOnRef.current) {
          runAutopilotAmbient();
          runAutopilotVendor();
        }
      }

      if (shouldBroadcastMove()) broadcastMove();

      gameWorldOffRef.current = worldRef.current;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onResize = () => {
      updateViewBoxes(worldRef.current, { force: true });
      clampPlayerWorldX(window.innerWidth);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current)     cancelAnimationFrame(rafRef.current);
      if (jumpTimerRef.current) { clearTimeout(jumpTimerRef.current); jumpTimerRef.current = null; }
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup',   onUp);
      window.removeEventListener('resize', onResize);
    };
  }, [homePreview]);

  // Home backdrop — keep stage video in sync without gameplay loop.
  useEffect(() => {
    if (!homePreview) return;

    const loop = () => {
      updateViewBoxes(worldRef.current);
      gameWorldOffRef.current = worldRef.current;
      playerWorldXRef.current = worldRef.current;
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
        convoId={convo.convoId}
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
  const playerChatKey = mp.selfId ? `player:${mp.selfId}` : '';
  const boostedPlayerZ = usePublicChatBubbleZ(
    playerChatKey,
    inConversation ? Z_CHAT_CHARACTER : Z_PLAYER_CHARACTER,
  );
  const hasPlayerAmbientBubble = !inConversation && playerAmbientMessages.length > 0;
  const playerZIndex = hasPlayerAmbientBubble
    ? boostedPlayerZ
    : inConversation
      ? Z_CHAT_CHARACTER
      : Z_PLAYER_CHARACTER;

  const isPlayerChatConnected = useCallback((playerId: string) => {
    if (mp.selfId === playerId && inConversation) return true;
    if (peerChatId === playerId) return true;
    if (mp.chatPairs.some(p => p.a === playerId || p.b === playerId)) return true;
    return mp.remoteNpcChats.some(c => c.playerId === playerId);
  }, [mp.selfId, mp.chatPairs, mp.remoteNpcChats, inConversation, peerChatId]);

  const isNpcInPairConvo = useCallback((npcId: string) => {
    return activePairChatNpcIds.has(npcId);
  }, [activePairChatNpcIds]);

  const isNpcChatConnected = useCallback((npcIndex: number, npcId: string) => {
    if (activeChatDrawingForNpc(chatNpcDrawings, npcId)) return false;
    if (greetingNpc === npcIndex) return true;
    if (mp.remoteNpcChats.some(c => c.npcId === npcId)) return true;
    if (mp.npcConvoPairs.some(p => p.participants.includes(npcId))) return true;
    if (roomChatter.isNpcInConvo(npcId)) return true;
    if (hasNpcConvoHold(npcId)) return true;
    return false;
  }, [chatNpcDrawings, greetingNpc, mp.remoteNpcChats, mp.npcConvoPairs, roomChatter, convoHoldTick]);

  const handleEaselStationed = useCallback((npcId: string) => {
    mpRef.current?.sendEaselPainterReady(npcId);
  }, []);

  const showMobileChatBar = mobileDevice
    && !showWelcome
    && !showCityPicker
    && (
      (chatMode === 'ambient' && !inConversation)
      || (chatMode === 'chat' && inConversation)
    );
  const showVendorShop =
    greetingNpc !== null && isBuzNpc(effectiveNpcCast[greetingNpc]?.id ?? '');
  const vendorShopOpen = stageSidePanelTab === 'shop';
  const showStageChatterPanel =
    !homePreview
    && !showWelcome
    && !showCityPicker
    && !stageLineupOpen
    && !isChatterDebugMode();

  const handleStageSidePanelTabChange = useCallback((tab: StageSidePanelTab) => {
    setStageSidePanelTab(prev => {
      if (tab === 'shop') {
        setVendorShopDismissed(false);
        warmVendorShop();
      } else if (prev === 'shop') {
        setVendorShopDismissed(true);
      }
      return tab;
    });
  }, [warmVendorShop]);

  useEffect(() => {
    if (!showVendorShop) setVendorShopDismissed(false);
  }, [showVendorShop]);

  useEffect(() => {
    if (!curatedStageChannel && stageSidePanelTab === 'lineup') {
      setStageSidePanelTab('chat');
    }
  }, [curatedStageChannel, stageSidePanelTab]);

  useEffect(() => {
    if (showVendorShop && !vendorShopDismissed) {
      setStageSidePanelTab('shop');
      warmVendorShop();
    }
  }, [showVendorShop, vendorShopDismissed, warmVendorShop]);

  useEffect(() => {
    if (nearNpc === null) return;
    if (!isBuzNpc(effectiveNpcCast[nearNpc]?.id ?? '')) return;
    warmVendorShop();
  }, [nearNpc, warmVendorShop]);

  useEffect(() => {
    if (stageSidePanelTab !== 'shop') return;
    warmVendorShop();
  }, [stageSidePanelTab, warmVendorShop]);

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
        {isCreatorChill ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: CHILL_FOREST_BG,
            }}
          />
        ) : isCreatorCinema ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: CITY_BACKDROP_FILL,
            }}
          />
        ) : isSeattle ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: SEATTLE_BACKDROP_FILL,
            }}
          />
        ) : isSanFrancisco || isChillCinema ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: SF_BACKDROP_FILL,
            }}
          />
        ) : isLasVegas ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: VEGAS_BACKDROP_FILL,
            }}
          />
        ) : isTentaroo ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: TENTAROO_BACKDROP_FILL,
            }}
          />
        ) : isForest ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: FOREST_BACKDROP_FILL,
            }}
          />
        ) : isSilentDisco ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: SILENT_DISCO_BACKDROP_FILL,
            }}
          />
        ) : isDeepSpace ? (
          <SpaceParallaxStars />
        ) : (
          <SkyLayer
            ref={skyRef}
            period={skyPeriod}
            initialViewBoxX={spawnWorldOff * SKY_F}
          />
        )}
        {!isDeepSpace && !isCreatorCustomSky && (
          <SkyCloudsLayer ref={cloudsRef} period={skyPeriod} initialViewBoxX={spawnWorldOff * SKY_F} />
        )}
        {!isDeepSpace && !isCreatorCustomSky && <SkyCreaturesLayer period={skyPeriod} />}
        <MidLayer
          ref={midRef}
          foregroundRef={midForegroundRef}
          skyLabelsRef={midSkyLabelsRef}
          worldOff={midScrollWorldOff}
          deepLinkRoute={effectiveVenueRoute}
          hideTrees={mobileDevice || isDeepSpace || isLasVegas}
          isolatedTileIndex={isolatedTile}
          creatorBackdropUrl={staticStageBackdropUrl ?? stageBackdropDisplayUrl(creatorStage?.backdropUrl) ?? null}
        />
        <GroundLayer
          ref={groundRef}
          worldOff={gndScrollWorldOff}
          hideTrees={mobileDevice || isDeepSpace || isLasVegas}
          hideStreetDogs={effectiveVenueRoute === 'silent-disco' || effectiveVenueRoute === 'forest' || effectiveVenueRoute === 'tentaroo' || effectiveVenueRoute === 'outside-hands' || effectiveVenueRoute === 'cinema' || effectiveVenueRoute === 'hula' || effectiveVenueRoute === 'edc' || effectiveVenueRoute === 'seattle-concerts' || isDeepSpace}
          bareGround={isDeepSpace}
          isolatedTileIndex={isolatedTile}
          deepLinkRoute={effectiveVenueRoute}
        />
        {!isDeepSpace && effectiveVenueRoute !== 'tentaroo' && (
          <CabanaForegroundLayer
            ref={cabanaRef}
            worldOff={gndScrollWorldOff}
            venueRoute={effectiveVenueRoute}
          />
        )}

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
            layoutRoute={easelLayoutRoute}
            session={activeEaselSession}
          />
        )}

        {!homePreview && (
          <NpcPromptCanvasLayer
            sessions={chatNpcDrawings}
            onSessionComplete={handleChatDrawingComplete}
          />
        )}

        {!homePreview && crowdVisualsReady && (
          <SFCityCrowdLayer
            cast={effectiveNpcCast}
            greetingNpc={greetingNpc}
            greetNpcX={greetNpcX}
            npcTyping={npcTyping}
            npcMessages={npcMessages}
            npcChatLabel={npcChatLabel}
            isNpcChatConnected={isNpcChatConnected}
            isNpcInPairConvo={isNpcInPairConvo}
            activeEaselSession={activeEaselSession}
            easelStageSlug={easelStageSlug}
            easelLayoutRoute={easelLayoutRoute}
            chatNpcDrawings={chatNpcDrawings}
            compareDrawPins={compareDrawPins}
            festieDimNpcIds={festieDimNpcIds}
            spaceFloat={isDeepSpace}
            onEaselStationed={handleEaselStationed}
            remoteIds={mp.remoteIds}
            remoteStateRef={mp.remoteStateRef}
            ambientRef={mp.ambientRef}
            peerChatId={peerChatId}
            peerTyping={peerTyping}
            peerMessages={peerMessages}
            isPlayerChatConnected={isPlayerChatConnected}
            playerMessages={roomChatter.playerMessages}
            npcPublicMessages={roomChatter.npcMessages}
            ownerFestieNpcId={ownerFestieNpcId}
            autopilotOn={autopilotOn}
            ownerFestieVendorAttractWx={ownerFestieVendorAttractWx}
          />
        )}

        {!homePreview && mobileDevice && npcPairOverlay}

        {!homePreview && crowdVisualsReady && (TEST_PLAYER_VARIANT_GALLERY ? (
          <PlayerVariantGallery
            walking={walking}
            dancing={TEST_FORCE_DANCE || playerDancing}
          />
        ) : !autopilotOn && (
          /* Player — scrolls with world in normal cities; walks across screen in static city */
          <div
            ref={playerCharRef}
            className="game-character game-player-character"
            style={{
            position: 'absolute',
            left: '50%',
            bottom: mobileDevice ? CHAR_BOTTOM : `calc(${CHAR_BOTTOM})`,
            transform: `translateX(${inConversation ? chatConnectSpreadPlayerPx(greetNpcX) : 0}px)`,
            transition: 'transform 0.25s ease',
            zIndex: playerZIndex,
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
                connectGlow={false}
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
          settingsOpen={settingsOpen}
          stageLineupOpen={stageLineupOpen}
          showStageSettings={canManageCreatorLineup}
          onOpenStageSettings={
            canManageCreatorLineup ? () => setStageLineupOpen(true) : undefined
          }
          hidden={showWelcome || showCityPicker}
          isMobile={mobileDevice}
          onOpenSettings={toggleSettings}
          onControlModeChange={mode => {
            setOwnerFestie(prev => (prev ? { ...prev, control_mode: mode } : prev));
          }}
        />
      )}

      <BottomControlPanel
        hidden={showWelcome || showCityPicker || stageLineupOpen || isChatterDebugMode()}
        onOpenCityPicker={() => setShowCityPicker(true)}
        isMobile={mobileDevice}
      />

      <RightControlPanel
        worldOff={midScrollWorldOff}
        playerName={playerName}
        venueRoute={effectiveVenueRoute}
        creatorStageSlug={creatorStage?.slug ?? null}
        hidden={showWelcome || showCityPicker || stageLineupOpen || isChatterDebugMode()}
        showCreateStage={showCreateStageButton}
        showSignOut={festieSignedIn}
        onSignOut={openSignOutConfirm}
      />

      {stageLineupOpen && canManageCreatorLineup && (
        <CreatorStageLineupModal onClose={() => setStageLineupOpen(false)} />
      )}

      {showHelpPopup && (
        <HelpFaqModal onClose={dismissHelpPopup} />
      )}

      {autopilotMoveHintOpen && (
        <AutopilotMoveHintModal
          onClose={() => {
            setAutopilotMoveHintOpen(false);
            autopilotMoveHintCooldownRef.current = Date.now() + 8_000;
          }}
        />
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
          refillFrom={lifeRefillFromRef.current}
          onClose={() => {
            setLifeModalOpen(false);
            lifeRefillFromRef.current = null;
          }}
          onUpdated={festie => {
            setOwnerFestie(festie);
            mpRef.current?.requestFestiesSync();
          }}
        />
      )}

      {settingsOpen && (
        <FestieSettingsModal
          onClose={() => setSettingsOpen(false)}
          ownerOnline={ownerOnline}
          refillFrom={lifeRefillFromRef.current}
          initialTab={settingsInitialTab}
          onUpdated={festie => {
            setOwnerFestie(festie);
            mpRef.current?.requestFestiesSync();
          }}
          ownedStage={ownedStage ?? null}
        />
      )}

      {showStageChatterPanel && (
        <StageChatterPanel
          messages={stageChatter.messages}
          typingSenders={stageChatter.typingSenders}
          resolveName={resolveStageChatterName}
          resolveGlow={resolveStageChatterGlow}
          onSend={handleStageChatterSend}
          onTypingChange={handleStageChatterTyping}
          onHumansOnlyChange={handleStageChatterHumansOnly}
          stageName={stageChatterWelcome.stageName}
          stageDescription={stageChatterWelcome.stageDescription}
          isStageOwner={isCreatorStageOwner}
          isSuperAdmin={isSuperAdmin}
          onPurgeChatterSender={isSuperAdmin ? handlePurgeChatterSender : undefined}
          activeTab={stageSidePanelTab}
          onTabChange={handleStageSidePanelTabChange}
          shopLoadout={playerLoadout}
          shopCoins={playerCoins}
          onShopPurchase={handleVendorPurchase}
          onShopUnequip={handleVendorUnequip}
          stageChannel={curatedStageChannel}
          playbackChannel={stagePlaybackChannel}
          lineupMultiplayer={mp}
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
          initialCreatorSlug={creatorStage?.slug ?? null}
          initialName={playerName ?? getPlayerName() ?? undefined}
          requireAuth={!festieSignedIn}
          pickStageOnly={festieSignedIn}
          signInFrom={{
            source: 'stage',
            stage: currentStagePickerTarget(
              effectiveVenueRoute,
              creatorStage?.slug ?? null,
            ) ?? { kind: 'venue', route: effectiveVenueRoute },
          }}
          onAuthSuccess={name => {
            void hydratePlayerSession().then(profile => {
              setFestieSignedIn(profile.authenticated);
              if (profile.festie) setOwnerFestie(profile.festie);
              if (profile.name) setPlayerName(profile.name);
              else setPlayerName(name);
              setPlayerLoadout({ ...getPlayerLoadout(myColor), ...TEST_PLAYER_LOADOUT });
              setPlayerCoins(getPlayerCoins());
            });
          }}
          onEnter={handleWelcomeEnter}
          onFestieCreated={() => void handleFestieCreated()}
        />
      )}

      {showCityPicker && (
        <StagePicker
          variant="swap"
          requireName={false}
          initialRoute={effectiveVenueRoute}
          creatorSlug={creatorStage?.slug ?? null}
          initialName={playerName ?? undefined}
          onEnter={handleCityPickerEnter}
          onClose={() => setShowCityPicker(false)}
        />
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

      {!showWelcome && !showCityPicker && !stageLineupOpen && !isChatterDebugMode() && (
        <MobileGameControls
          muted={muted}
          vendorShopOpen={vendorShopOpen}
          onToggleVendorShop={toggleVendorShop}
          onVendorShopWarm={warmVendorShop}
          onOpenStageSwap={() => setShowCityPicker(true)}
          onOpenAmbientChat={mobileDevice && AMBIENT_CHAT_ENABLED ? handleOpenAmbientChat : undefined}
          ambientChatOpen={AMBIENT_CHAT_ENABLED && chatMode === 'ambient'}
          onToggleMute={() => setMuted(m => !m)}
          showMute={false}
          showCreateStage={showCreateStageButton}
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
