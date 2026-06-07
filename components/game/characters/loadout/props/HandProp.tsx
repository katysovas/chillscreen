import { BalloonAccessory } from '../../main/accessory';
import { LightsaberAccessory } from '../../accessories/lightsaber/accessory';
import { MicrophoneAccessory } from '../../accessories/microphone/accessory';
import { PirateSwordAccessory } from '../../pirate/accessory';
import type { LoadoutRenderCtx } from '../types';

type HandPropProps = {
  variant: 'balloon' | 'microphone' | 'lightsaber' | 'sword';
  ctx: LoadoutRenderCtx;
};

/** Items held in or floating beside the character's hand. */
export function HandProp({ variant, ctx }: HandPropProps) {
  const color = ctx.props.color ?? ctx.balloonColor;

  switch (variant) {
    case 'balloon':
      return <BalloonAccessory color={color} />;
    case 'microphone':
      return <MicrophoneAccessory color={color} />;
    case 'lightsaber':
      return (
        <LightsaberAccessory
          bladeColor={ctx.props.bladeColor ?? '#66ff88'}
          hiltColor={ctx.props.hiltColor ?? '#4a4a52'}
        />
      );
    case 'sword':
      return <PirateSwordAccessory />;
  }
}
