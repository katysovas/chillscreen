import { BalloonAccessory } from '../../main/accessory';
import { LightsaberAccessory } from '../../accessories/lightsaber/accessory';
import { MicrophoneAccessory } from '../../accessories/microphone/accessory';
import { PirateSwordAccessory } from '../../pirate/accessory';
import type { LoadoutRenderCtx } from '../types';

const BOOMBOX_SRC = '/images/props/hands_boombox.svg';
const BALLOONS_SRC = '/images/props/hands_balloons.svg';
const BALLOONS_2_SRC = '/images/props/hands_balloons_2.svg';
const HOTDOG_SRC = '/images/props/food_hotdog.svg';
const DONUT_SRC = '/images/props/food_donut.svg';
const FRIES_SRC = '/images/props/food_fries.svg';
const PIZZA_SRC = '/images/props/food_pizza.svg';
const TACOS_SRC = '/images/props/food_tacos.svg';
const POPCORN_SRC = '/images/props/food_popcorn.svg';
const LOLLIPOP_SRC = '/images/props/food_lollipop.svg';
const MARTINI_SRC = '/images/props/drinks_martini.svg';
const LEMONADE_SRC = '/images/props/drinks_lemonade.svg';
const BEER_SRC = '/images/props/drinks_beer.svg';
const BOTTLE_SRC = '/images/props/drinks_bottle.svg';
const WATER_SRC = '/images/props/drinks_water.svg';
const JUICE_SRC = '/images/props/drinks_juice.svg';
const COFFEE_SRC = '/images/props/drinks_coffee.svg';
const GLOWSTICKS_SRC = '/images/props/festival_glowsticks.png';
const CONFETTI_SRC = '/images/props/festival_confetti.svg';
const FIREWORKS_SRC = '/images/props/festival_fireworks.svg';
const STICKER_SRC = '/images/props/sticker.svg';
const TOTEM_SRC = '/images/props/hands_totem.svg';

type HandPropProps = {
  variant: 'balloon' | 'microphone' | 'lightsaber' | 'sword' | 'boombox' | 'balloons' | 'balloons2' | 'hotdog' | 'donut' | 'fries' | 'pizza' | 'tacos' | 'popcorn' | 'lollipop' | 'martini' | 'lemonade' | 'beer' | 'bottle' | 'water' | 'juice' | 'coffee' | 'glowsticks' | 'confetti' | 'fireworks' | 'sticker' | 'totem';
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
    case 'balloons':
      return (
        <div className="ch-lo-balloons">
          <img
            src={BALLOONS_SRC}
            alt=""
            className="ch-lo-balloons-img"
            draggable={false}
          />
        </div>
      );
    case 'balloons2':
      return (
        <div className="ch-lo-balloons-2">
          <img
            src={BALLOONS_2_SRC}
            alt=""
            className="ch-lo-balloons-2-img"
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
    case 'pizza':
      return (
        <div className="ch-lo-pizza">
          <img
            src={PIZZA_SRC}
            alt=""
            className="ch-lo-pizza-img"
            draggable={false}
          />
        </div>
      );
    case 'tacos':
      return (
        <div className="ch-lo-tacos">
          <img
            src={TACOS_SRC}
            alt=""
            className="ch-lo-tacos-img"
            draggable={false}
          />
        </div>
      );
    case 'popcorn':
      return (
        <div className="ch-lo-popcorn">
          <img
            src={POPCORN_SRC}
            alt=""
            className="ch-lo-popcorn-img"
            draggable={false}
          />
        </div>
      );
    case 'lollipop':
      return (
        <div className="ch-lo-lollipop">
          <img
            src={LOLLIPOP_SRC}
            alt=""
            className="ch-lo-lollipop-img"
            draggable={false}
          />
        </div>
      );
    case 'martini':
      return (
        <div className="ch-lo-martini">
          <img
            src={MARTINI_SRC}
            alt=""
            className="ch-lo-martini-img"
            draggable={false}
          />
        </div>
      );
    case 'lemonade':
      return (
        <div className="ch-lo-lemonade">
          <img
            src={LEMONADE_SRC}
            alt=""
            className="ch-lo-lemonade-img"
            draggable={false}
          />
        </div>
      );
    case 'beer':
      return (
        <div className="ch-lo-beer">
          <img
            src={BEER_SRC}
            alt=""
            className="ch-lo-beer-img"
            draggable={false}
          />
        </div>
      );
    case 'bottle':
      return (
        <div className="ch-lo-bottle">
          <img
            src={BOTTLE_SRC}
            alt=""
            className="ch-lo-bottle-img"
            draggable={false}
          />
        </div>
      );
    case 'water':
      return (
        <div className="ch-lo-water">
          <img
            src={WATER_SRC}
            alt=""
            className="ch-lo-water-img"
            draggable={false}
          />
        </div>
      );
    case 'juice':
      return (
        <div className="ch-lo-juice">
          <img
            src={JUICE_SRC}
            alt=""
            className="ch-lo-juice-img"
            draggable={false}
          />
        </div>
      );
    case 'coffee':
      return (
        <div className="ch-lo-coffee">
          <img
            src={COFFEE_SRC}
            alt=""
            className="ch-lo-coffee-img"
            draggable={false}
          />
        </div>
      );
    case 'glowsticks':
      return (
        <div className="ch-lo-glowsticks">
          <img
            src={GLOWSTICKS_SRC}
            alt=""
            className="ch-lo-glowsticks-img"
            draggable={false}
          />
        </div>
      );
    case 'confetti':
      return (
        <div className="ch-lo-confetti">
          <img
            src={CONFETTI_SRC}
            alt=""
            className="ch-lo-confetti-img"
            draggable={false}
          />
        </div>
      );
    case 'fireworks':
      return (
        <div className="ch-lo-fireworks">
          <img
            src={FIREWORKS_SRC}
            alt=""
            className="ch-lo-fireworks-img"
            draggable={false}
          />
        </div>
      );
    case 'sticker':
      return (
        <div className="ch-lo-sticker">
          <img
            src={STICKER_SRC}
            alt=""
            className="ch-lo-sticker-img"
            draggable={false}
          />
        </div>
      );
    case 'totem':
      return (
        <div className="ch-lo-totem">
          <img
            src={TOTEM_SRC}
            alt=""
            className="ch-lo-totem-img"
            draggable={false}
          />
        </div>
      );
  }
}
