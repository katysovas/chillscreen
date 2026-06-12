'use client';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { BubbleSide } from '../../ChatBubble';
import {
  areLoadoutItemsReady,
  equippedLoadoutItemIds,
  getLoadoutRegistryVersion,
  GlowstickAmbient,
  GLOWSTICK_AMBIENT_TWEAK,
  ConfettiAmbient,
  CONFETTI_AMBIENT_TWEAK,
  FireworksOverlay,
  hasGlowsticksEquipped,
  hasConfettiEquipped,
  hasFireworksEquipped,
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
  /** Soft glow while in a 1:1 connected conversation. */
  chatConnected?: boolean;
  /** Deep Space — zero-G float visuals (bob + drift legs) instead of walk cycle. */
  spaceFloat?: boolean;
};

/** Imperative handle for the direct-DOM updates used by the NPC RAF loop. */
export type CharacterHandle = {
  /** Flip direction — updates style.transform directly, zero React re-render. */
  setFacing: (f: 'left' | 'right') => void;
  /** Toggle walk animation — updates classList directly, zero React re-render. */
  setWalking: (w: boolean) => void;
};

/** Artboard coords (500×240) — above the head, aligned to the sprite body. */
const CHAT_ANCHOR = {
  /** Body left edge ~165px; anchor near top-left of head. */
  left: 172,
  /** Balloons extend right — keep existing offset (looks correct). */
  right: 48,
  top: -68,
};

const CHAT_BUBBLE_OVERFLOW: CSSProperties = {
  overflow: 'visible',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'normal',
};

function chatAnchorStyle(side: BubbleSide, scale: number, mirrored: boolean) {
  const counterScale = `scale(${1 / scale}) scaleX(${mirrored ? -1 : 1})`;
  const shared = {
    position: 'absolute' as const,
    top: CHAT_ANCHOR.top,
    zIndex: 40,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    pointerEvents: 'auto' as const,
    ...CHAT_BUBBLE_OVERFLOW,
  };

  if (side === 'center') {
    return {
      ...shared,
      left: '50%',
      transform: `translate(-50%, -100%) ${counterScale}`,
      transformOrigin: 'bottom center',
      alignItems: 'stretch',
    };
  }

  if (side === 'right') {
    return {
      ...shared,
      right: CHAT_ANCHOR.right,
      transform: `translate(0, -100%) ${counterScale}`,
      transformOrigin: 'bottom left',
      alignItems: 'flex-start',
    };
  }

  return {
    ...shared,
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
  chatConnected = false,
  spaceFloat = false,
}, ref) {
  const outerRef       = useRef<HTMLDivElement>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const chatAnchorRef  = useRef<HTMLDivElement>(null);
  const spaceFloatRef  = useRef(spaceFloat);
  spaceFloatRef.current = spaceFloat;
  const bubbleSideRef  = useRef(bubbleSide);
  bubbleSideRef.current = bubbleSide;
  const scaleRef       = useRef(scale);
  scaleRef.current     = scale;

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

  const equippedItemIds = useMemo(() => {
    const ids = loadout ? equippedLoadoutItemIds(loadout) : [];
    if (forcedHat) ids.push(forcedHat);
    return ids;
  }, [loadout, forcedHat]);

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

  useImperativeHandle(ref, () => ({
    setFacing(f) {
      if (!outerRef.current) return;
      const m = f === 'left';
      outerRef.current.style.transform = `translateX(-50%) scaleX(${m ? -1 : 1})`;
      outerRef.current.style.setProperty('--ch-mirror', m ? '-1' : '1');
      if (chatAnchorRef.current) {
        const sc = scaleRef.current;
        const s  = bubbleSideRef.current ?? 'left';
        const counterScale = `scale(${1 / sc}) scaleX(${m ? -1 : 1})`;
        chatAnchorRef.current.style.transform = s === 'center'
          ? `translate(-50%, -100%) ${counterScale}`
          : s === 'right'
            ? `translate(0, -100%) ${counterScale}`
            : `translate(-100%, -100%) ${counterScale}`;
      }
    },
    setWalking(w) {
      if (!wrapperRef.current) return;
      if (spaceFloatRef.current) {
        wrapperRef.current.classList.remove('ch-walking');
        wrapperRef.current.classList.toggle('ch-space-float-moving', w);
      } else {
        wrapperRef.current.classList.remove('ch-space-float-moving');
        wrapperRef.current.classList.toggle('ch-walking', w);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const mirrored = facing === 'left';
  const effectiveLoadout = forcedHat && loadout
    ? { ...loadout, hat: forcedHat }
    : loadout;
  const equipped = effectiveLoadout ? resolveLoadout(effectiveLoadout, balloonColor) : null;
  const holdRight = equipped
    ? loadoutHoldSide(equipped) === 'right'
    : accessoryHoldSide(accessory) === 'right';
  const partyHandClass = dancing
    ? holdRight ? ' ch-free-hand-left' : ' ch-free-hand-right'
    : '';
  const glowstickAmbient = GLOWSTICK_AMBIENT_TWEAK
    || (loadout ? hasGlowsticksEquipped(loadout) : false);
  const confettiAmbient = CONFETTI_AMBIENT_TWEAK
    || (loadout ? hasConfettiEquipped(loadout) : false);
  const fireworksActive = loadout ? hasFireworksEquipped(loadout) : false;

  if (!propsReady) return null;

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
          className={`ch-wrapper${outfit ? ` ch-outfit-${outfit}` : ''}${spaceFloat ? ' ch-space-float' : ''}${!spaceFloat && walking ? ' ch-walking' : ''}${spaceFloat && walking ? ' ch-space-float-moving' : ''}${dancing ? ' ch-dancing' : ''}${partyHandClass}`}
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
                  {equipped
                    ? renderLoadoutHand(equipped)
                    : renderAccessorySlot('hand', accessory, balloonColor)}
                </div>
              </div>
              {equipped && renderLoadoutBottom(equipped)}
            </div>
            <div className="ch-legs"><span /><span /></div>
          </div>
        </div>

        <ChatConnectGlow active={chatConnected} color={balloonColor} />
        <GlowstickAmbient active={glowstickAmbient} />
        <ConfettiAmbient active={confettiAmbient} />
        <FireworksOverlay active={fireworksActive} />

        {chatOverlay && (
          <div
            ref={chatAnchorRef}
            data-paraloid-ui
            className="game-chat-anchor"
            style={chatAnchorStyle(bubbleSide, scale, mirrored)}
          >
            {chatOverlay}
          </div>
        )}
      </div>
    </div>
  );
});

export default Character;
