/** Held item rendered in the character's right hand (replaces default balloon). */
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

type ColoredProp = Exclude<CharacterAccessory, { type: 'lightsaber' }>['type'];

export function defaultAccessory(balloonColor: string): CharacterAccessory {
  return { type: 'balloon', color: balloonColor };
}

/** Side that holds the visible accessory (party mode animates the other hand). */
export function accessoryHoldSide(accessory: CharacterAccessory | undefined): 'left' | 'right' {
  if (accessory?.type === 'lightsaber' || accessory?.type === 'microphone' || accessory?.type === 'dj') return 'right';
  return 'right'; // default balloon floats on the character's right
}

export function isHandMountedAccessory(
  accessory: CharacterAccessory | undefined,
): accessory is Extract<CharacterAccessory, { type: 'lightsaber' | 'microphone' | 'dj' }> {
  return accessory?.type === 'lightsaber' || accessory?.type === 'microphone' || accessory?.type === 'dj';
}

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

function ColoredPropAccessory({ type, color }: { type: ColoredProp; color: string }) {
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

export function renderAccessory(
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
) {
  const item = accessory ?? defaultAccessory(balloonColor);
  if (item.type === 'lightsaber' || item.type === 'microphone' || item.type === 'dj') {
    return null;
  }
  if (item.type === 'necklace') {
    if (item.balloonColor) return <BalloonAccessory color={item.balloonColor} />;
    return null;
  }
  return <ColoredPropAccessory type={item.type} color={item.color} />;
}
