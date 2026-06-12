const COIN_SRC = '/images/coin.svg';
const VENDOR_COIN_SRC = '/images/vendor-coin.svg';

type Props = {
  size?: number;
  className?: string;
  /** `buy` — compact art on vendor purchase buttons. */
  variant?: 'default' | 'buy';
};

export function CoinIcon({ size = 12, className, variant = 'default' }: Props) {
  return (
    <img
      src={variant === 'buy' ? VENDOR_COIN_SRC : COIN_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ display: 'block', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}

export { COIN_SRC, VENDOR_COIN_SRC };
