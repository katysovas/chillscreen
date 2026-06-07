import type { ColoredProp } from '../../types';
import { BalloonAccessory } from '../../main/accessory';

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
