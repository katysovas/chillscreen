import { BalloonAccessory } from '../../main/accessory';
import { LightsaberAccessory } from '../../accessories/lightsaber/accessory';
import { MicrophoneAccessory } from '../../accessories/microphone/accessory';
import { PirateSwordAccessory } from '../../pirate/accessory';
import type { LoadoutRenderCtx } from '../types';

const BOOMBOX_SRC = '/images/props/hands_boombox.svg';
const HOTDOG_SRC = '/images/props/food_hotdog.svg';
const DONUT_SRC = '/images/props/food_donut.svg';
const FRIES_SRC = '/images/props/food_fries.svg';

type HandPropProps = {
  variant: 'balloon' | 'microphone' | 'lightsaber' | 'sword' | 'boombox' | 'hotdog' | 'donut' | 'fries';
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
    case 'boombox':
      return (
        <div className="ch-lo-boombox">
          <img
            src={BOOMBOX_SRC}
            alt=""
            className="ch-lo-boombox-img"
            draggable={false}
          />
        </div>
      );
    case 'hotdog':
      return (
        <div className="ch-lo-hotdog">
          <img
            src={HOTDOG_SRC}
            alt=""
            className="ch-lo-hotdog-img"
            draggable={false}
          />
        </div>
      );
    case 'donut':
      return (
        <div className="ch-lo-donut">
          <img
            src={DONUT_SRC}
            alt=""
            className="ch-lo-donut-img"
            draggable={false}
          />
        </div>
      );
    case 'fries':
      return (
        <div className="ch-lo-fries">
          <img
            src={FRIES_SRC}
            alt=""
            className="ch-lo-fries-img"
            draggable={false}
          />
        </div>
      );
  }
}
