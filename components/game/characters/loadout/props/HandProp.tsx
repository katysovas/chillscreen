import { BalloonAccessory } from '../../main/accessory';
import { LightsaberAccessory } from '../../accessories/lightsaber/accessory';
import { MicrophoneAccessory } from '../../accessories/microphone/accessory';
import { PirateSwordAccessory } from '../../pirate/accessory';
import type { LoadoutRenderCtx } from '../types';
import { handPropRotateStyle } from './handPropRotateStyle';

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
const BRUSH_SRC = '/images/props/hands_brush.svg';
const GUITAR_1_SRC = '/images/props/instrument_guitar_1.svg';
const GUITAR_ACOUSTIC_SRC = '/images/props/instrument_guitar_accoustic.svg';
const GUITAR_BASS_SRC = '/images/props/instrument_guitar_bass.svg';
const GUITAR_ELECTRIC_1_SRC = '/images/props/instrument_guitar_electric_1.svg';
const GUITAR_ELECTRIC_SRC = '/images/props/instrument_guitar_electric.svg';
const GUITAR_SRC = '/images/props/instrument_guitar.svg';
const DRUMS_SRC = '/images/props/instruments_drums.svg';
const BONGO_SRC = '/images/props/instruments_bongo.svg';
const TRUMPET_SRC = '/images/props/instruments_trumpet.svg';

type HandPropProps = {
  variant: 'balloon' | 'microphone' | 'lightsaber' | 'sword' | 'boombox' | 'balloons' | 'balloons2' | 'hotdog' | 'donut' | 'fries' | 'pizza' | 'tacos' | 'popcorn' | 'lollipop' | 'martini' | 'lemonade' | 'beer' | 'bottle' | 'water' | 'juice' | 'coffee' | 'glowsticks' | 'confetti' | 'fireworks' | 'sticker' | 'totem' | 'brush' | 'guitar1' | 'guitarAcoustic' | 'guitarBass' | 'guitarElectric1' | 'guitarElectric' | 'guitar' | 'drums' | 'bongo' | 'trumpet';
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
        <div className="ch-lo-boombox" style={handPropRotateStyle('boombox')}>
          <img src={BOOMBOX_SRC} alt="" className="ch-lo-boombox-img" draggable={false} />
        </div>
      );
    case 'balloons':
      return (
        <div className="ch-lo-balloons" style={handPropRotateStyle('balloons')}>
          <img src={BALLOONS_SRC} alt="" className="ch-lo-balloons-img" draggable={false} />
        </div>
      );
    case 'balloons2':
      return (
        <div className="ch-lo-balloons-2" style={handPropRotateStyle('balloons2')}>
          <img src={BALLOONS_2_SRC} alt="" className="ch-lo-balloons-2-img" draggable={false} />
        </div>
      );
    case 'hotdog':
      return (
        <div className="ch-lo-hotdog" style={handPropRotateStyle('hotdog')}>
          <img src={HOTDOG_SRC} alt="" className="ch-lo-hotdog-img" draggable={false} />
        </div>
      );
    case 'donut':
      return (
        <div className="ch-lo-donut" style={handPropRotateStyle('donut')}>
          <img src={DONUT_SRC} alt="" className="ch-lo-donut-img" draggable={false} />
        </div>
      );
    case 'fries':
      return (
        <div className="ch-lo-fries" style={handPropRotateStyle('fries')}>
          <img src={FRIES_SRC} alt="" className="ch-lo-fries-img" draggable={false} />
        </div>
      );
    case 'pizza':
      return (
        <div className="ch-lo-pizza" style={handPropRotateStyle('pizza')}>
          <img src={PIZZA_SRC} alt="" className="ch-lo-pizza-img" draggable={false} />
        </div>
      );
    case 'tacos':
      return (
        <div className="ch-lo-tacos" style={handPropRotateStyle('tacos')}>
          <img src={TACOS_SRC} alt="" className="ch-lo-tacos-img" draggable={false} />
        </div>
      );
    case 'popcorn':
      return (
        <div className="ch-lo-popcorn" style={handPropRotateStyle('popcorn')}>
          <img src={POPCORN_SRC} alt="" className="ch-lo-popcorn-img" draggable={false} />
        </div>
      );
    case 'lollipop':
      return (
        <div className="ch-lo-lollipop" style={handPropRotateStyle('lollipop')}>
          <img src={LOLLIPOP_SRC} alt="" className="ch-lo-lollipop-img" draggable={false} />
        </div>
      );
    case 'martini':
      return (
        <div className="ch-lo-martini" style={handPropRotateStyle('martini')}>
          <img src={MARTINI_SRC} alt="" className="ch-lo-martini-img" draggable={false} />
        </div>
      );
    case 'lemonade':
      return (
        <div className="ch-lo-lemonade" style={handPropRotateStyle('lemonade')}>
          <img src={LEMONADE_SRC} alt="" className="ch-lo-lemonade-img" draggable={false} />
        </div>
      );
    case 'beer':
      return (
        <div className="ch-lo-beer" style={handPropRotateStyle('beer')}>
          <img src={BEER_SRC} alt="" className="ch-lo-beer-img" draggable={false} />
        </div>
      );
    case 'bottle':
      return (
        <div className="ch-lo-bottle" style={handPropRotateStyle('bottle')}>
          <img src={BOTTLE_SRC} alt="" className="ch-lo-bottle-img" draggable={false} />
        </div>
      );
    case 'water':
      return (
        <div className="ch-lo-water" style={handPropRotateStyle('water')}>
          <img src={WATER_SRC} alt="" className="ch-lo-water-img" draggable={false} />
        </div>
      );
    case 'juice':
      return (
        <div className="ch-lo-juice" style={handPropRotateStyle('juice')}>
          <img src={JUICE_SRC} alt="" className="ch-lo-juice-img" draggable={false} />
        </div>
      );
    case 'coffee':
      return (
        <div className="ch-lo-coffee" style={handPropRotateStyle('coffee')}>
          <img src={COFFEE_SRC} alt="" className="ch-lo-coffee-img" draggable={false} />
        </div>
      );
    case 'glowsticks':
      return (
        <div className="ch-lo-glowsticks" style={handPropRotateStyle('glowsticks')}>
          <img src={GLOWSTICKS_SRC} alt="" className="ch-lo-glowsticks-img" draggable={false} />
        </div>
      );
    case 'confetti':
      return (
        <div className="ch-lo-confetti" style={handPropRotateStyle('confetti')}>
          <img src={CONFETTI_SRC} alt="" className="ch-lo-confetti-img" draggable={false} />
        </div>
      );
    case 'fireworks':
      return (
        <div className="ch-lo-fireworks" style={handPropRotateStyle('fireworks')}>
          <img src={FIREWORKS_SRC} alt="" className="ch-lo-fireworks-img" draggable={false} />
        </div>
      );
    case 'sticker':
      return (
        <div className="ch-lo-sticker" style={handPropRotateStyle('sticker')}>
          <img src={STICKER_SRC} alt="" className="ch-lo-sticker-img" draggable={false} />
        </div>
      );
    case 'totem':
      return (
        <div className="ch-lo-totem" style={handPropRotateStyle('totem')}>
          <img src={TOTEM_SRC} alt="" className="ch-lo-totem-img" draggable={false} />
        </div>
      );
    case 'brush':
      return (
        <div className="ch-lo-brush">
          <div className="ch-lo-brush-stroke">
            <img src={BRUSH_SRC} alt="" className="ch-lo-brush-img" draggable={false} />
          </div>
        </div>
      );
    case 'guitar1':
      return (
        <div className="ch-lo-guitar-1" style={handPropRotateStyle('guitar1')}>
          <img src={GUITAR_1_SRC} alt="" className="ch-lo-guitar-1-img" draggable={false} />
        </div>
      );
    case 'guitarAcoustic':
      return (
        <div className="ch-lo-guitar-acoustic" style={handPropRotateStyle('guitarAcoustic')}>
          <img src={GUITAR_ACOUSTIC_SRC} alt="" className="ch-lo-guitar-acoustic-img" draggable={false} />
        </div>
      );
    case 'guitarBass':
      return (
        <div className="ch-lo-guitar-bass" style={handPropRotateStyle('guitarBass')}>
          <img src={GUITAR_BASS_SRC} alt="" className="ch-lo-guitar-bass-img" draggable={false} />
        </div>
      );
    case 'guitarElectric1':
      return (
        <div className="ch-lo-guitar-electric-1" style={handPropRotateStyle('guitarElectric1')}>
          <img src={GUITAR_ELECTRIC_1_SRC} alt="" className="ch-lo-guitar-electric-1-img" draggable={false} />
        </div>
      );
    case 'guitarElectric':
      return (
        <div className="ch-lo-guitar-electric" style={handPropRotateStyle('guitarElectric')}>
          <img src={GUITAR_ELECTRIC_SRC} alt="" className="ch-lo-guitar-electric-img" draggable={false} />
        </div>
      );
    case 'guitar':
      return (
        <div className="ch-lo-guitar" style={handPropRotateStyle('guitar')}>
          <img src={GUITAR_SRC} alt="" className="ch-lo-guitar-img" draggable={false} />
        </div>
      );
    case 'drums':
      return (
        <div className="ch-lo-drums" style={handPropRotateStyle('drums')}>
          <img src={DRUMS_SRC} alt="" className="ch-lo-drums-img" draggable={false} />
        </div>
      );
    case 'bongo':
      return (
        <div className="ch-lo-bongo" style={handPropRotateStyle('bongo')}>
          <img src={BONGO_SRC} alt="" className="ch-lo-bongo-img" draggable={false} />
        </div>
      );
    case 'trumpet':
      return (
        <div className="ch-lo-trumpet" style={handPropRotateStyle('trumpet')}>
          <img src={TRUMPET_SRC} alt="" className="ch-lo-trumpet-img" draggable={false} />
        </div>
      );
  }
}
