import type { LoadoutRenderCtx } from '../types';

const PIRATE_HAT_SRC = '/images/props/pirate_hat.svg';
const HEADPHONES_SRC = '/images/props/headphones.svg';
const VIKING_HAT_SRC = '/images/props/hat_viking.svg';
const LADY_HAT_SRC = '/images/props/hat_lady.svg';
const HUNTER_HAT_SRC = '/images/props/hat_hunter.svg';
const BASEBALL_HAT_SRC = '/images/props/hat_baseball.svg';
const PAMELA_HAT_SRC = '/images/props/hat_pamela.svg';
const HELMET_SRC = '/images/props/hat_helmet.svg';

type HatPropProps = {
  variant: 'beanie' | 'cap' | 'chef' | 'pirate-hat' | 'headphones' | 'viking-hat' | 'lady-hat' | 'hunter-hat' | 'baseball-hat' | 'pamela-hat' | 'helmet-hat';
  ctx: LoadoutRenderCtx;
};

/** Hats — mounted above the ears. */
export function HatProp({ variant, ctx }: HatPropProps) {
  const color = ctx.props.color ?? '#2c3e50';
  const accent = ctx.props.accentColor ?? '#1a1a1a';

  return (
    <div
      className={`ch-lo-hat ch-lo-hat-${variant}`}
      style={{
        ['--lo-color' as string]: color,
        ['--lo-accent' as string]: accent,
      }}
    >
      {variant === 'chef' && <div className="ch-lo-hat-chef-poof" />}
      {variant === 'cap' && <div className="ch-lo-hat-cap-bill" />}
      {variant === 'pirate-hat' && (
        <img
          src={PIRATE_HAT_SRC}
          alt=""
          className="ch-lo-pirate-hat-img"
          draggable={false}
        />
      )}
      {variant === 'headphones' && (
        <img
          src={HEADPHONES_SRC}
          alt=""
          className="ch-lo-headphones-img"
          draggable={false}
        />
      )}
      {variant === 'viking-hat' && (
        <img
          src={VIKING_HAT_SRC}
          alt=""
          className="ch-lo-viking-hat-img"
          draggable={false}
        />
      )}
      {variant === 'lady-hat' && (
        <img
          src={LADY_HAT_SRC}
          alt=""
          className="ch-lo-lady-hat-img"
          draggable={false}
        />
      )}
      {variant === 'hunter-hat' && (
        <img
          src={HUNTER_HAT_SRC}
          alt=""
          className="ch-lo-hunter-hat-img"
          draggable={false}
        />
      )}
      {variant === 'baseball-hat' && (
        <img
          src={BASEBALL_HAT_SRC}
          alt=""
          className="ch-lo-baseball-hat-img"
          draggable={false}
        />
      )}
      {variant === 'pamela-hat' && (
        <img
          src={PAMELA_HAT_SRC}
          alt=""
          className="ch-lo-pamela-hat-img"
          draggable={false}
        />
      )}
      {variant === 'helmet-hat' && (
        <img
          src={HELMET_SRC}
          alt=""
          className="ch-lo-helmet-hat-img"
          draggable={false}
        />
      )}
    </div>
  );
}
