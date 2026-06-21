'use client';

import { useState } from 'react';
import {
  loadoutItem,
  loadoutItemId,
  hasPurchasedLoadoutItem,
  type CharacterLoadout,
} from './characters/loadout';
import {
  DEFAULT_VENDOR_CATEGORY,
  VENDOR_ITEM_PREVIEWS,
  VENDOR_PREVIEW_SIZE,
  VENDOR_SHOP_CATEGORIES,
  type VendorShopItemId,
} from '@/lib/vendorShop';
import { Z_MODAL } from '@/lib/zLayers';
import { vendorItemPrice } from '@/lib/vendorPrices';
import { playPurchaseSound } from '@/lib/playPurchaseSound';

type Props = {
  loadout: CharacterLoadout;
  coins: number;
  onPurchase: (itemId: string) => boolean | Promise<boolean>;
  onUnequip: (itemId: string) => void | Promise<void>;
  onClose?: () => void;
  /** Renders inside the stage chat panel — no outer chrome or close button. */
  embedded?: boolean;
};

function SwordPreview() {
  return (
    <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 18, height: 28, transform: 'rotate(42deg)' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 6,
            height: 18,
            marginLeft: -3,
            borderRadius: '3px 1px 1px 1px',
            background: 'linear-gradient(90deg,#7a8894,#edf2f6,#8a9aaa)',
            border: '1px solid #4a5560',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 6,
            width: 14,
            height: 4,
            marginLeft: -7,
            borderRadius: 2,
            background: 'linear-gradient(180deg,#e8c040,#a07818)',
            border: '1px solid #222',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            width: 5,
            height: 9,
            marginLeft: -2.5,
            borderRadius: 2,
            background: 'linear-gradient(90deg,#5a3a10,#9a6c22)',
            border: '1px solid #222',
          }}
        />
      </div>
    </div>
  );
}

function LightsaberPreview() {
  return (
    <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 28, transform: 'rotate(42deg)' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 5,
            height: 20,
            marginLeft: -2.5,
            borderRadius: '2px 2px 1px 1px',
            background: 'linear-gradient(90deg,#4dff88,#66ff88,#4dff88)',
            boxShadow: '0 0 5px rgba(102,255,136,0.75)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 5,
            width: 9,
            height: 3,
            marginLeft: -4.5,
            borderRadius: 1,
            background: '#888',
            border: '1px solid #333',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            width: 7,
            height: 8,
            marginLeft: -3.5,
            borderRadius: 1,
            background: 'linear-gradient(90deg,#3a3a42,#5a5a62)',
            border: '1px solid #222',
          }}
        />
      </div>
    </div>
  );
}

const COIN_SRC = '/images/coin.svg';
const VENDOR_COIN_SRC = '/images/vendor-coin.svg';

function CoinAmount({
  amount,
  iconSize = 12,
  muted = false,
  light = false,
  buttonCoin = false,
  fontSize = 11,
  fontWeight = 800,
}: {
  amount: number;
  iconSize?: number;
  muted?: boolean;
  light?: boolean;
  /** Compact coin art for orange buy buttons. */
  buttonCoin?: boolean;
  fontSize?: number;
  fontWeight?: number;
}) {
  const color = light ? '#fff' : muted ? '#b8a068' : '#c9a227';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color,
        fontSize,
        fontWeight,
        lineHeight: 1,
      }}
    >
      <img
        src={buttonCoin ? VENDOR_COIN_SRC : COIN_SRC}
        alt=""
        width={iconSize}
        height={iconSize}
        draggable={false}
        style={{
          display: 'block',
          objectFit: 'contain',
          opacity: muted && !light ? 0.55 : 1,
          flexShrink: 0,
          filter: buttonCoin
            ? muted ? 'grayscale(0.9)' : undefined
            : light ? 'brightness(1.45) saturate(0.9)' : undefined,
        }}
      />
      {amount}
    </span>
  );
}

const actionBtnBase = {
  fontFamily: 'inherit',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.35,
  textTransform: 'uppercase' as const,
  borderRadius: 8,
  padding: '7px 10px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  whiteSpace: 'nowrap' as const,
  lineHeight: 1,
  flexShrink: 0,
};

const VENDOR_BUY_BTN_STYLES = `
  .vendor-buy-btn {
    border: none;
    background: linear-gradient(180deg, #ffb347 0%, #e67e22 100%);
    color: #fff;
    box-shadow: 0 2px 6px rgba(230, 126, 34, 0.28);
    cursor: pointer;
    transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
  }
  @media (hover: hover) {
    .vendor-buy-btn:not(:disabled):hover {
      background: linear-gradient(180deg, #ffc96b 0%, #f39c12 100%);
      box-shadow: 0 4px 12px rgba(230, 126, 34, 0.42);
      transform: translateY(-1px);
    }
    .vendor-buy-btn:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(230, 126, 34, 0.3);
    }
  }
  .vendor-buy-btn:disabled {
    background: #f0f0f0;
    color: #aaa;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

function BuyButton({
  price,
  disabled,
  onClick,
}: {
  price: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="vendor-buy-btn"
      disabled={disabled}
      onClick={onClick}
      aria-label={disabled ? `Buy for ${price} coins — insufficient funds` : `Buy for ${price} coins`}
      style={actionBtnBase}
    >
      <span>Buy</span>
      <CoinAmount
        amount={price}
        iconSize={12}
        fontSize={10}
        fontWeight={700}
        buttonCoin
        light={!disabled}
        muted={disabled}
      />
    </button>
  );
}

function EquipButton({ onClick, embedded = false }: { onClick: () => void; embedded?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...actionBtnBase,
        border: embedded ? '1.5px solid rgba(230, 126, 34, 0.65)' : '1.5px solid #e67e22',
        background: embedded ? 'rgba(255, 255, 255, 0.06)' : '#fff',
        color: embedded ? '#ffb347' : '#e67e22',
        cursor: 'pointer',
      }}
    >
      Equip
    </button>
  );
}

function ItemPreview({ itemId }: { itemId: VendorShopItemId }) {
  if (itemId === 'hand-sword') return <SwordPreview />;
  if (itemId === 'hand-lightsaber') return <LightsaberPreview />;

  const src = VENDOR_ITEM_PREVIEWS[itemId];
  if (!src) return null;

  const size = VENDOR_PREVIEW_SIZE[itemId] ?? { width: 32, height: 28 };

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: size.width,
        height: size.height,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

/** Buz's merch — standalone overlay or embedded in the stage chat shop tab. */
function shopTheme(embedded: boolean) {
  if (!embedded) {
    return {
      coinsLabel: '#9a7209',
      coinsBg: 'linear-gradient(180deg,#fff9e6,#fff3cc)',
      coinsBorder: '1px solid rgba(184,134,11,0.35)',
      coinsLight: false,
      categoryBg: '#f3f3f3',
      categoryActiveBg: '#fff',
      categoryActiveColor: '#222',
      categoryInactiveColor: '#888',
      categoryActiveShadow: '0 1px 4px rgba(0,0,0,0.08)',
      rowBg: '#fafafa',
      rowBgEquipped: '#fff8f0',
      rowBorder: '1px solid #ececec',
      rowBorderEquipped: '1.5px solid #e67e22',
      rowNameColor: '#222',
      rowMutedColor: '#9a9a9a',
      previewBg: '#fff',
      previewBorder: '1px solid #eee',
      emptyBg: '#fafafa',
      emptyBorder: '1px solid #ececec',
      emptyColor: '#999',
    } as const;
  }

  return {
    coinsLabel: 'rgba(255, 255, 255, 0.88)',
    coinsBg: 'rgba(255, 255, 255, 0.06)',
    coinsBorder: '1px solid rgba(255, 255, 255, 0.1)',
    coinsLight: true,
    categoryBg: 'rgba(255, 255, 255, 0.06)',
    categoryActiveBg: 'rgba(255, 255, 255, 0.1)',
    categoryActiveColor: 'rgba(255, 255, 255, 0.92)',
    categoryInactiveColor: 'rgba(255, 255, 255, 0.45)',
    categoryActiveShadow: 'none',
    rowBg: 'rgba(255, 255, 255, 0.06)',
    rowBgEquipped: 'rgba(255, 255, 255, 0.09)',
    rowBorder: '1px solid rgba(255, 255, 255, 0.1)',
    rowBorderEquipped: '1.5px solid rgba(230, 126, 34, 0.55)',
    rowNameColor: 'rgba(255, 255, 255, 0.88)',
    rowMutedColor: 'rgba(255, 255, 255, 0.42)',
    previewBg: '#fff',
    previewBorder: '1px solid #eee',
    emptyBg: 'rgba(255, 255, 255, 0.06)',
    emptyBorder: '1px solid rgba(255, 255, 255, 0.1)',
    emptyColor: 'rgba(255, 255, 255, 0.45)',
  } as const;
}

export function VendorShopPanel({
  loadout,
  coins,
  onPurchase,
  onUnequip,
  onClose,
  embedded = false,
}: Props) {
  const [categoryId, setCategoryId] = useState(DEFAULT_VENDOR_CATEGORY);
  const category =
    VENDOR_SHOP_CATEGORIES.find(c => c.id === categoryId) ?? VENDOR_SHOP_CATEGORIES[0]!;
  const theme = shopTheme(embedded);

  return (
    <div
      style={
        embedded
          ? {
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 14px 12px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              pointerEvents: 'auto',
            }
          : {
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: Z_MODAL,
              width: 300,
              padding: '14px 14px 12px',
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              pointerEvents: 'auto',
            }
      }
    >
      <style>{VENDOR_BUY_BTN_STYLES}</style>
      {!embedded && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close store"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: '#999',
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
          paddingLeft: onClose ? 24 : 0,
          paddingRight: onClose ? 24 : 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            color: theme.coinsLabel,
            background: theme.coinsBg,
            border: theme.coinsBorder,
            borderRadius: 999,
            padding: '4px 10px',
            whiteSpace: 'nowrap',
            letterSpacing: 0.15,
          }}
        >
          <span>My Coins:</span>
          <CoinAmount
            amount={coins}
            iconSize={11}
            fontSize={11}
            fontWeight={700}
            buttonCoin
            light={theme.coinsLight}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 10,
          padding: 3,
          borderRadius: 10,
          background: theme.categoryBg,
          flexShrink: 0,
        }}
      >
        {VENDOR_SHOP_CATEGORIES.map(tab => {
          const active = tab.id === category.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryId(tab.id)}
              style={{
                flex: '1 1 28%',
                minWidth: 44,
                padding: '5px 6px',
                borderRadius: 8,
                border: 'none',
                background: active ? theme.categoryActiveBg : 'transparent',
                boxShadow: active ? theme.categoryActiveShadow : 'none',
                color: active ? theme.categoryActiveColor : theme.categoryInactiveColor,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'normal',
                lineHeight: 1.15,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: embedded ? 1 : undefined,
          minHeight: embedded ? 0 : undefined,
          overflowY: embedded ? 'auto' : undefined,
          padding: embedded ? undefined : undefined,
        }}
        className={embedded ? 'stage-chatter-scroll' : undefined}
      >
        {category.items.length === 0 ? (
          <div
            style={{
              padding: '14px 10px',
              borderRadius: 12,
              border: theme.emptyBorder,
              background: theme.emptyBg,
              fontSize: 10,
              color: theme.emptyColor,
              textAlign: 'center',
            }}
          >
            Coming soon
          </div>
        ) : null}
        {category.items.map(itemId => {
          const item = loadoutItem(itemId);
          if (!item) return null;
          const equipped = loadoutItemId(loadout, item.slot) === itemId;
          const owned = hasPurchasedLoadoutItem(loadout, itemId);
          const price = vendorItemPrice(itemId);
          const canAfford = coins >= price;

          return (
            <div
              key={itemId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 12,
                border: equipped ? theme.rowBorderEquipped : theme.rowBorder,
                background: equipped ? theme.rowBgEquipped : theme.rowBg,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 40,
                  borderRadius: 10,
                  background: theme.previewBg,
                  border: theme.previewBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ItemPreview itemId={itemId} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.rowNameColor,
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                  }}
                >
                  {item.name}
                </div>
                {owned && !equipped ? (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      color: theme.rowMutedColor,
                    }}
                  >
                    Owned
                  </div>
                ) : null}
              </div>

              <div style={{ flexShrink: 0 }}>
                {equipped ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#c86a1a',
                        padding: '7px 8px',
                        borderRadius: 8,  
                        background: 'rgba(230, 126, 34, 0.1)',
                      }}
                    >
                      Equipped
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      title={`Remove ${item.name}`}
                      onClick={() => onUnequip(itemId)}
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        borderRadius: 8,
                        border: embedded
                          ? '1px solid rgba(255, 140, 100, 0.35)'
                          : '1px solid rgba(200, 106, 26, 0.3)',
                        background: embedded ? 'rgba(255, 255, 255, 0.06)' : '#fff',
                        color: embedded ? '#ffb347' : '#c86a1a',
                        fontSize: 14,
                        lineHeight: 1,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : owned ? (
                  <EquipButton
                    embedded={embedded}
                    onClick={() => {
                      void Promise.resolve(onPurchase(itemId)).then(ok => {
                        if (ok) playPurchaseSound();
                      });
                    }}
                  />
                ) : (
                  <BuyButton
                    price={price}
                    disabled={!canAfford}
                    onClick={() => {
                      void Promise.resolve(onPurchase(itemId)).then(ok => {
                        if (ok) playPurchaseSound();
                      });
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
