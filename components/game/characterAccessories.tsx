import type { ReactNode } from 'react';

/** Held / worn item rendered on a character (replaces the default balloon). */
export type CharacterAccessory =
  | { type: 'balloon'; color: string }
  | { type: 'lightsaber'; bladeColor?: string; hiltColor?: string }
  | { type: 'globe'; color: string }
  | { type: 'guitar'; color: string }
  | { type: 'chefHat'; color: string }
  | { type: 'compass'; color: string }
  | { type: 'microphone'; color: string }
  | { type: 'dj'; headphoneColor?: string; speakerColor?: string }
  | { type: 'necklace'; symbol?: string; color: string; chainColor?: string; balloonColor?: string };

export type AccessoryType = CharacterAccessory['type'];

type ColoredProp = Exclude<CharacterAccessory, { type: 'lightsaber' }>['type'];

export function defaultAccessory(balloonColor: string): CharacterAccessory {
  return { type: 'balloon', color: balloonColor };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Accessory primitives
 * Reusable visual building blocks. New items in the future library should be
 * authored here (or imported) and then registered in ACCESSORY_LIBRARY below.
 * ────────────────────────────────────────────────────────────────────────── */

export function BalloonAccessory({ color }: { color: string }) {
  return (
    <div className="ch-ballons">
      <div className="ch-heart">
        <span style={{ background: color }} />
        <span style={{ background: color }} />
      </div>
    </div>
  );
}

export function ColoredPropAccessory({ type, color }: { type: ColoredProp; color: string }) {
  if (type === 'balloon') return <BalloonAccessory color={color} />;
  return (
    <div className={`ch-prop-wrap ch-prop-${type}`}>
      <div
        className={`ch-prop ch-prop-${type}-body`}
        style={{ ['--prop-color' as string]: color }}
      />
    </div>
  );
}

export function DjHeadphones({ color = '#2c2c34' }: { color?: string }) {
  return (
    <div
      className="ch-dj-phones"
      style={{ ['--dj-phone-color' as string]: color }}
    >
      <div className="ch-dj-phones-band" />
      <div className="ch-dj-phones-cup ch-dj-phones-cup-l" />
      <div className="ch-dj-phones-cup ch-dj-phones-cup-r" />
    </div>
  );
}

export function DjSpeaker({ color = '#e04f8e' }: { color?: string }) {
  return (
    <div
      className="ch-dj-speaker"
      style={{ ['--dj-speaker-color' as string]: color }}
    >
      <div className="ch-boom-handle" />
      <div className="ch-boom-body">
        <div className="ch-boom-woofer ch-boom-woofer-l" />
        <div className="ch-boom-center">
          <div className="ch-boom-tape" />
          <div className="ch-boom-panel" />
        </div>
        <div className="ch-boom-woofer ch-boom-woofer-r" />
      </div>
      <div className="ch-boom-grip" />
    </div>
  );
}

export function NecklaceAccessory({
  symbol = '₿',
  color = '#f7931a',
  chainColor = '#c9a227',
}: {
  symbol?: string;
  color?: string;
  chainColor?: string;
}) {
  return (
    <div
      className="ch-necklace"
      style={{
        ['--pendant-color' as string]: color,
        ['--chain-color' as string]: chainColor,
      }}
    >
      <div className="ch-necklace-chain" />
      <div className="ch-necklace-link" />
      <div className="ch-necklace-pendant" aria-hidden>
        {symbol}
      </div>
    </div>
  );
}

export function MicrophoneAccessory({ color = '#2c3e50' }: { color?: string }) {
  return (
    <div className="ch-mic">
      <div className="ch-mic-head" style={{ ['--mic-color' as string]: color }} />
      <div className="ch-mic-grille" />
      <div className="ch-mic-handle" />
    </div>
  );
}

export function LightsaberAccessory({
  bladeColor = '#FFE566',
  hiltColor = '#5a5a62',
}: {
  bladeColor?: string;
  hiltColor?: string;
}) {
  return (
    <div className="ch-saber">
      <div
        className="ch-saber-blade"
        style={{
          ['--saber-blade' as string]: bladeColor,
        }}
      />
      <div
        className="ch-saber-hilt"
        style={{ background: hiltColor }}
      />
      <div className="ch-saber-guard" />
      <div className="ch-saber-glow" style={{ background: bladeColor }} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Accessory library (registry)
 * Each item declares which body "slots" it occupies and how to render each.
 * A single item can fill multiple slots (e.g. the DJ kit = headphones on the
 * head + boombox in the hand). Adding a new item is one entry here — no
 * if/else chains scattered through the Character component.
 * ────────────────────────────────────────────────────────────────────────── */

/** Mount points on the character body that an accessory can render into. */
export type AccessorySlot = 'float' | 'head' | 'hand';

type RenderCtx = { balloonColor: string };

type AccessoryDefinition = {
  /** Hand that visibly holds the item (party mode animates the other hand). */
  holdSide: 'left' | 'right';
  /** True when the item occupies a hand (vs. a floating / worn item). */
  handMounted: boolean;
  /** Per-slot renderers. Slots omitted here simply render nothing. */
  slots: Partial<Record<AccessorySlot, (accessory: CharacterAccessory, ctx: RenderCtx) => ReactNode>>;
};

/** Authoring helper — narrows `accessory` to the concrete variant per entry. */
function define<T extends AccessoryType>(def: {
  holdSide?: 'left' | 'right';
  handMounted?: boolean;
  slots: Partial<
    Record<AccessorySlot, (accessory: Extract<CharacterAccessory, { type: T }>, ctx: RenderCtx) => ReactNode>
  >;
}): AccessoryDefinition {
  return {
    holdSide: def.holdSide ?? 'right',
    handMounted: def.handMounted ?? false,
    slots: def.slots as AccessoryDefinition['slots'],
  };
}

export const ACCESSORY_LIBRARY: Record<AccessoryType, AccessoryDefinition> = {
  balloon: define<'balloon'>({
    slots: { float: a => <BalloonAccessory color={a.color} /> },
  }),
  globe: define<'globe'>({
    slots: { float: a => <ColoredPropAccessory type="globe" color={a.color} /> },
  }),
  guitar: define<'guitar'>({
    slots: { float: a => <ColoredPropAccessory type="guitar" color={a.color} /> },
  }),
  chefHat: define<'chefHat'>({
    slots: { float: a => <ColoredPropAccessory type="chefHat" color={a.color} /> },
  }),
  compass: define<'compass'>({
    slots: { float: a => <ColoredPropAccessory type="compass" color={a.color} /> },
  }),
  lightsaber: define<'lightsaber'>({
    handMounted: true,
    slots: { hand: a => <LightsaberAccessory bladeColor={a.bladeColor} hiltColor={a.hiltColor} /> },
  }),
  microphone: define<'microphone'>({
    handMounted: true,
    slots: { hand: a => <MicrophoneAccessory color={a.color} /> },
  }),
  dj: define<'dj'>({
    handMounted: true,
    slots: {
      head: a => <DjHeadphones color={a.headphoneColor} />,
      hand: a => <DjSpeaker color={a.speakerColor} />,
    },
  }),
  necklace: define<'necklace'>({
    slots: {
      head: a => <NecklaceAccessory symbol={a.symbol} color={a.color} chainColor={a.chainColor} />,
      float: a => (a.balloonColor ? <BalloonAccessory color={a.balloonColor} /> : null),
    },
  }),
};

/* ──────────────────────────────────────────────────────────────────────────
 * Public API used by <Character />
 * ────────────────────────────────────────────────────────────────────────── */

function resolve(accessory: CharacterAccessory | undefined, balloonColor: string) {
  const item = accessory ?? defaultAccessory(balloonColor);
  return { item, def: ACCESSORY_LIBRARY[item.type] };
}

/** Render whatever a character's accessory contributes to the given slot. */
export function renderAccessorySlot(
  slot: AccessorySlot,
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
): ReactNode {
  const { item, def } = resolve(accessory, balloonColor);
  const render = def?.slots[slot];
  return render ? render(item, { balloonColor }) : null;
}

/** Side that holds the visible accessory (party mode animates the other). */
export function accessoryHoldSide(accessory: CharacterAccessory | undefined): 'left' | 'right' {
  return accessory ? ACCESSORY_LIBRARY[accessory.type]?.holdSide ?? 'right' : 'right';
}

/** True when the accessory is held in a hand (lightsaber / mic / dj boombox). */
export function isHandMountedAccessory(accessory: CharacterAccessory | undefined): boolean {
  return !!accessory && (ACCESSORY_LIBRARY[accessory.type]?.handMounted ?? false);
}
