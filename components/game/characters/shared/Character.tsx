'use client';
import { forwardRef, memo, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { BubbleSide } from '../../ChatBubble';
import { clampChatAnchorHorizontally, screenXToBubbleSide } from '@/lib/chatBubbleViewport';
import {
  areLoadoutItemsReady,
  equippedLoadoutItemIds,
  getLoadoutRegistryVersion,
  isLoadoutHandMounted,
  GlowstickAmbient,
  GLOWSTICK_AMBIENT_TWEAK,
  ConfettiAmbient,
  CONFETTI_AMBIENT_TWEAK,
  FireworksOverlay,
  hasGlowsticksEquipped,
  hasConfettiEquipped,
  hasFireworksEquipped,
  hasGuitarEquipped,
  hasDrumsEquipped,
  loadoutHoldSide,
  preloadLoadoutItems,
  renderLoadoutBottom,
  renderLoadoutFloat,
  renderLoadoutHand,
  renderLoadoutHat,
  renderLoadoutMask,
  renderLoadoutNecklace,
  renderLoadoutSlot,
  renderLoadoutSunglasses,
  renderLoadoutTop,
  resolveLoadout,
  subscribeLoadoutRegistry,
} from '../loadout';
import type { CharacterLoadout } from '../loadout';
import { isPaintingBrushLoadout } from '@/lib/easel/brushLoadout';
import { getForcedHatId, subscribeDressCode } from '@/lib/dressCode';
import {
  accessoryHoldSide,
  renderAccessorySlot,
} from '../render';
import type { CharacterAccessory } from '../types';
import { ChatConnectGlow } from '../../ChatConnectGlow';

export type CharacterProps = {
  walking: boolean;
  facing: 'left' | 'right';
  balloonColor?: string;
  /** Layered outfit props — preferred over legacy `accessory` when set. */
  loadout?: CharacterLoadout;
  accessory?: CharacterAccessory;
  scale?: number;
  /** Outfit skin — adds `ch-outfit-{name}` on the wrapper (tie-dye, neon tank, …). */
  outfit?: string;
  dancing?: boolean;
  /** Which side of the character the chat stack sits on (screen position). */
  bubbleSide?: BubbleSide;
  /** Chat UI — pinned above the head on `bubbleSide`. */
  chatOverlay?: ReactNode;
  /** Soft pulsing connect aura — `'subtle'` for local player ID; `true` for chat connect. */
  connectGlow?: boolean | 'subtle';
  /** Easel painter — bubble sits left of the festie, away from the canvas. */
  easelChatAnchor?: boolean;
  /** Deep Space — zero-G float visuals (bob + drift legs) instead of walk cycle. */
  spaceFloat?: boolean;
};

/** Imperative handle for the direct-DOM updates used by the NPC RAF loop. */
export type CharacterHandle = {
  /** Flip direction — updates style.transform directly, zero React re-render. */
  setFacing: (f: 'left' | 'right') => void;
  /** Toggle walk animation — updates classList directly, zero React re-render. */
  setWalking: (w: boolean) => void;
  /** Toggle dance animation — updates classList directly, zero React re-render. */
  setDancing: (d: boolean) => void;
  /** Flip chat bubble side from live screen % — used while ambient chatter is visible. */
  setChatScreenPct: (pct: number) => void;
};

/** Artboard coords (500×240) — above the head, aligned to the sprite body. */
const CHAT_ANCHOR = {
  /** Body left edge ~165px; anchor near top-left of head. */
  left: 172,
  /** Balloons extend right — keep existing offset (looks correct). */
  right: 48,
  top: -68,
};

/** Painter at easel — same anchor as the standard left bubble (left of the festie). */
const EASEL_CHAT_ANCHOR = {
  left: CHAT_ANCHOR.left,
  top: CHAT_ANCHOR.top,
};

const CHAT_BUBBLE_OVERFLOW: CSSProperties = {
  overflow: 'visible',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'normal',
};

function chatAnchorStyle(
  side: BubbleSide,
  scale: number,
  mirrored: boolean,
  easelChatAnchor = false,
) {
  const counterScale = `scale(${1 / scale}) scaleX(${mirrored ? -1 : 1})`;
  const shared = {
    position: 'absolute' as const,
    zIndex: 40,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    pointerEvents: 'auto' as const,
    ...CHAT_BUBBLE_OVERFLOW,
  };

  if (easelChatAnchor) {
    // Same as standard left bubble — bubble to the left of the NPC, tail points right at head.
    return {
      ...shared,
      top: EASEL_CHAT_ANCHOR.top,
      left: EASEL_CHAT_ANCHOR.left,
      transform: `translate(-100%, -100%) ${counterScale}`,
      transformOrigin: 'bottom right',
      alignItems: 'flex-end' as const,
    };
  }

  const top = CHAT_ANCHOR.top;
  const sharedWithTop = { ...shared, top };

  if (side === 'center') {
    return {
      ...sharedWithTop,
      left: '50%',
      transform: `translate(-50%, -100%) ${counterScale}`,
      transformOrigin: 'bottom center',
      alignItems: 'stretch',
    };
  }

  if (side === 'right') {
    return {
      ...sharedWithTop,
      right: CHAT_ANCHOR.right,
      transform: `translate(0, -100%) ${counterScale}`,
      transformOrigin: 'bottom left',
      alignItems: 'flex-start',
    };
  }

  return {
    ...sharedWithTop,
    left: CHAT_ANCHOR.left,
    transform: `translate(-100%, -100%) ${counterScale}`,
    transformOrigin: 'bottom right',
    alignItems: 'flex-end',
  };
}

const Character = forwardRef<CharacterHandle, CharacterProps>(function Character({
  walking,
  facing,
  balloonColor = '#ef4023',
  loadout,
  accessory,
  scale = 0.34,
  outfit,
  dancing = false,
  bubbleSide = 'left',
  chatOverlay,
  connectGlow = false,
  easelChatAnchor = false,
  spaceFloat = false,
}, ref) {
  const outerRef       = useRef<HTMLDivElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const chatAnchorRef  = useRef<HTMLDivElement>(null);
  const spaceFloatRef  = useRef(spaceFloat);
  spaceFloatRef.current = spaceFloat;
  const bubbleSideRef  = useRef(bubbleSide);
  bubbleSideRef.current = bubbleSide;
  const easelChatAnchorRef = useRef(easelChatAnchor);
  easelChatAnchorRef.current = easelChatAnchor;
  const scaleRef       = useRef(scale);
  scaleRef.current     = scale;
  const facingRef      = useRef(facing);
  facingRef.current    = facing;
  const holdRightRef   = useRef(false);
  const hasHandMountedRef = useRef(false);
  const imperativeDancingRef = useRef(false);
  const imperativeWalkingRef = useRef(false);

  function applyChatAnchorSide(side: BubbleSide) {
    const el = chatAnchorRef.current;
    if (!el) return;
    el.style.marginLeft = '';
    if (side === 'center') {
      el.style.left = '50%';
      el.style.right = 'auto';
    } else if (side === 'right') {
      el.style.left = 'auto';
      el.style.right = `${CHAT_ANCHOR.right}px`;
    } else {
      el.style.left = `${CHAT_ANCHOR.left}px`;
      el.style.right = 'auto';
    }
  }

  function syncChatAnchorTransform(mirrored: boolean) {
    if (!chatAnchorRef.current) return;
    const sc = scaleRef.current;
    const s = bubbleSideRef.current ?? 'left';
    const counterScale = `scale(${1 / sc}) scaleX(${mirrored ? -1 : 1})`;
    if (easelChatAnchorRef.current) {
      chatAnchorRef.current.style.transform =
        `translate(-100%, -100%) ${counterScale}`;
      return;
    }
    chatAnchorRef.current.style.transform = s === 'center'
      ? `translate(-50%, -100%) ${counterScale}`
      : s === 'right'
        ? `translate(0, -100%) ${counterScale}`
        : `translate(-100%, -100%) ${counterScale}`;
  }

  useSyncExternalStore(
    subscribeLoadoutRegistry,
    getLoadoutRegistryVersion,
    () => 0,
  );

  // Silent Disco dress code — every character wears headphones, owned or not.
  const forcedHat = useSyncExternalStore(
    subscribeDressCode,
    getForcedHatId,
    () => null,
  );

  const effectiveLoadout = useMemo(
    () => (forcedHat && loadout ? { ...loadout, hat: forcedHat } : loadout),
    [forcedHat, loadout],
  );
  const equipped = useMemo(
    () => (effectiveLoadout ? resolveLoadout(effectiveLoadout, balloonColor) : null),
    [effectiveLoadout, balloonColor],
  );

  const equippedItemIds = useMemo(() => {
    const ids = equipped ? equippedLoadoutItemIds(equipped) : [];
    if (forcedHat) ids.push(forcedHat);
    return ids;
  }, [equipped, forcedHat]);

  const [propsReady, setPropsReady] = useState(() => areLoadoutItemsReady(equippedItemIds));

  useEffect(() => {
    if (equippedItemIds.length === 0) {
      setPropsReady(true);
      return;
    }
    if (areLoadoutItemsReady(equippedItemIds)) {
      setPropsReady(true);
      return;
    }
    let cancelled = false;
    setPropsReady(false);
    void preloadLoadoutItems(equippedItemIds).then(() => {
      if (!cancelled) setPropsReady(true);
    });
    return () => { cancelled = true; };
  }, [equippedItemIds]);

  const mirrored = facingRef.current === 'left';
  const holdRight = equipped
    ? loadoutHoldSide(equipped) === 'right'
    : accessoryHoldSide(accessory) === 'right';
  holdRightRef.current = holdRight;
  const guitarProp = hasGuitarEquipped(effectiveLoadout ?? undefined);
  const drumsProp = hasDrumsEquipped(effectiveLoadout ?? undefined);
  const hasHandMounted = propsReady && (
    effectiveLoadout?.hand
      ? isLoadoutHandMounted(effectiveLoadout)
      : Boolean(accessory)
  );
  hasHandMountedRef.current = hasHandMounted;
  const hasHandProp = hasHandMounted && holdRight;

  function syncWalkingClass(active: boolean) {
    if (!wrapperRef.current) return;
    if (spaceFloatRef.current) {
      wrapperRef.current.classList.remove('ch-walking');
      wrapperRef.current.classList.toggle('ch-space-float-moving', active);
      return;
    }
    wrapperRef.current.classList.remove('ch-space-float-moving');
    wrapperRef.current.classList.toggle('ch-walking', active);
  }

  function syncDancingClasses(active: boolean) {
    if (!wrapperRef.current || !outerRef.current) return;
    const mounted = hasHandMountedRef.current;
    wrapperRef.current.classList.toggle('ch-dancing', active);
    wrapperRef.current.classList.toggle(
      'ch-free-hand-left',
      active && mounted && holdRightRef.current,
    );
    wrapperRef.current.classList.toggle(
      'ch-free-hand-right',
      active && mounted && !holdRightRef.current,
    );
    outerRef.current.style.transition = active ? 'none' : 'transform 0.1s ease';
  }

  useImperativeHandle(ref, () => ({
    setFacing(f) {
      if (!outerRef.current) return;
      facingRef.current = f;
      const m = f === 'left';
      outerRef.current.style.transform = `translateX(-50%) scaleX(${m ? -1 : 1})`;
      outerRef.current.style.setProperty('--ch-mirror', m ? '-1' : '1');
      syncChatAnchorTransform(m);
    },
    setWalking(w) {
      imperativeWalkingRef.current = w;
      syncWalkingClass(w);
    },
    setDancing(d) {
      imperativeDancingRef.current = d;
      syncDancingClasses(d);
    },
    setChatScreenPct(pct) {
      if (easelChatAnchorRef.current || !chatAnchorRef.current) return;
      const nextSide = screenXToBubbleSide(pct);
      if (nextSide === bubbleSideRef.current) return;
      bubbleSideRef.current = nextSide;
      applyChatAnchorSide(nextSide);
      syncChatAnchorTransform(facingRef.current === 'left');
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useLayoutEffect(() => {
    if (dancing) imperativeDancingRef.current = false;
    if (walking) imperativeWalkingRef.current = false;
    syncDancingClasses(dancing || imperativeDancingRef.current);
    syncWalkingClass(walking || imperativeWalkingRef.current);
  }, [dancing, walking, holdRight, guitarProp, drumsProp, hasHandMounted]);

  useLayoutEffect(() => {
    if (!chatOverlay) return;
    let raf = 0;
    const tick = () => {
      const el = chatAnchorRef.current;
      if (el) clampChatAnchorHorizontally(el);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (chatAnchorRef.current) chatAnchorRef.current.style.marginLeft = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- clamp while any chat UI is mounted
  }, [Boolean(chatOverlay), bubbleSide, scale, easelChatAnchor]);

  useLayoutEffect(() => {
    applyChatAnchorSide(bubbleSide);
    syncChatAnchorTransform(facingRef.current === 'left');
  }, [bubbleSide, scale, easelChatAnchor, Boolean(chatOverlay)]);

  const partyHandClass = dancing && hasHandProp
    ? holdRight ? ' ch-free-hand-left' : ' ch-free-hand-right'
    : '';
  const glowstickAmbient = GLOWSTICK_AMBIENT_TWEAK
    || (loadout ? hasGlowsticksEquipped(loadout) : false);
  const confettiAmbient = CONFETTI_AMBIENT_TWEAK
    || (loadout ? hasConfettiEquipped(loadout) : false);
  const fireworksActive = loadout ? hasFireworksEquipped(loadout) : false;
  const paintingBrush = isPaintingBrushLoadout(effectiveLoadout ?? undefined);

  return (
    <div
      ref={outerRef}
      style={{
        transform: `translateX(-50%) scaleX(${mirrored ? -1 : 1})`,
        ['--ch-mirror' as string]: mirrored ? '-1' : '1',
        transformOrigin: 'center bottom',
        transition: dancing ? undefined : 'transform 0.1s ease',
      } as CSSProperties}
    >
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
        position: 'relative',
      }}>
        <div
          ref={wrapperRef}
          className={`ch-wrapper${outfit ? ` ch-outfit-${outfit}` : ''}${hasHandProp ? ' ch-hand-prop' : ''}${guitarProp ? ' ch-guitar-prop' : ''}${drumsProp ? ' ch-drums-prop' : ''}${paintingBrush ? ' ch-painting-brush' : ''}${spaceFloat ? ' ch-space-float' : ''}${!spaceFloat && walking ? ' ch-walking' : ''}${spaceFloat && walking ? ' ch-space-float-moving' : ''}${dancing ? ' ch-dancing' : ''}${partyHandClass}`}
        >
          <div className="ch-animal">
            {equipped
              ? renderLoadoutFloat(equipped)
              : renderAccessorySlot('float', accessory, balloonColor)}
            <div className="ch-ears" />
            <div className="ch-body">
              {equipped
                ? renderLoadoutHat(equipped)
                : forcedHat
                  ? renderLoadoutSlot('hat', forcedHat, balloonColor)
                  : renderAccessorySlot('head', accessory, balloonColor)}
              <div className="ch-eyes" />
              {equipped && renderLoadoutSunglasses(equipped)}
              <div className="ch-nose"><span /><span /></div>
              {equipped && renderLoadoutMask(equipped)}
              {equipped && renderLoadoutNecklace(equipped)}
              {equipped && renderLoadoutTop(equipped)}
              <div className="ch-hands">
                <div className="ch-left-hand"><span /><span /></div>
                <div className="ch-right-hand">
                  <span /><span />
                  {propsReady && (equipped
                    ? renderLoadoutHand(equipped)
                    : renderAccessorySlot('hand', accessory, balloonColor))}
                </div>
              </div>
              {equipped && renderLoadoutBottom(equipped)}
            </div>
            <div className="ch-legs"><span /><span /></div>
          </div>
        </div>

        <ChatConnectGlow active={Boolean(connectGlow)} subtle={connectGlow === 'subtle'} color={balloonColor} />
        <GlowstickAmbient active={glowstickAmbient} />
        <ConfettiAmbient active={confettiAmbient} />
        <FireworksOverlay active={fireworksActive} />

        {chatOverlay && (
          <div
            ref={chatAnchorRef}
            data-paraloid-ui
            className="game-chat-anchor"
            style={chatAnchorStyle(bubbleSide, scale, mirrored, easelChatAnchor)}
          >
            {chatOverlay}
          </div>
        )}
      </div>
    </div>
  );
});

export default memo(Character);
