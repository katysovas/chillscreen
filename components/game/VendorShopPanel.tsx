'use client';

import { useState } from 'react';
import {
  loadoutItem,
  loadoutItemId,
  type CharacterLoadout,
} from './characters/loadout';
import {
  DEFAULT_VENDOR_CATEGORY,
  VENDOR_ITEM_PREVIEWS,
  VENDOR_PREVIEW_SIZE,
  VENDOR_SHOP_CATEGORIES,
  type VendorShopItemId,
} from '@/lib/vendorShop';

type Props = {
  loadout: CharacterLoadout;
  onPurchase: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
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

/** Buz's merch panel — fixed on the right so chat stays clear. */
export function VendorShopPanel({ loadout, onPurchase, onUnequip }: Props) {
  const [categoryId, setCategoryId] = useState(DEFAULT_VENDOR_CATEGORY);
  const category =
    VENDOR_SHOP_CATEGORIES.find(c => c.id === categoryId) ?? VENDOR_SHOP_CATEGORIES[0]!;

  return (
    <div
      style={{
        position: 'absolute',
        right: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 210,
        width: 248,
        padding: '12px 12px 10px',
        borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: '#aaa',
          marginBottom: 2,
        }}
      >
        Buz&apos;s Cart
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#222',
          marginBottom: 10,
        }}
      >
        Festival Store
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 10,
          padding: 3,
          borderRadius: 10,
          background: '#f3f3f3',
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
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                color: active ? '#222' : '#888',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {category.items.length === 0 ? (
          <div
            style={{
              padding: '12px 8px',
              borderRadius: 10,
              border: '1px solid #ececec',
              background: '#fafafa',
              fontSize: 10,
              color: '#999',
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

          const cardStyle = {
            display: 'flex',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 10,
            border: equipped ? '1.5px solid #e67e22' : '1px solid #ececec',
            background: equipped ? '#fff8f0' : '#fafafa',
            fontFamily: 'inherit',
            textAlign: 'left' as const,
          };

          const thumb = (
            <div
              style={{
                flexShrink: 0,
                width: 44,
                height: 36,
                borderRadius: 8,
                background: '#fff',
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ItemPreview itemId={itemId} />
            </div>
          );

          const body = (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#333',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {item.name}
              </div>
              <div
                style={{
                  marginTop: 5,
                  minHeight: 18,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {equipped ? (
                  <>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                        color: '#c86a1a',
                      }}
                    >
                      Equipped
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      title={`Remove ${item.name}`}
                      onClick={e => {
                        e.stopPropagation();
                        onUnequip(itemId);
                      }}
                      style={{
                        marginLeft: 'auto',
                        width: 18,
                        height: 18,
                        padding: 0,
                        borderRadius: '50%',
                        border: '1px solid rgba(200,106,26,0.35)',
                        background: '#fff',
                        color: '#c86a1a',
                        fontSize: 13,
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
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#777',
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: '#eee',
                    }}
                  >
                    Buy
                  </span>
                )}
              </div>
            </div>
          );

          if (equipped) {
            return (
              <div key={itemId} style={cardStyle}>
                {thumb}
                {body}
              </div>
            );
          }

          return (
            <button
              key={itemId}
              type="button"
              onClick={() => onPurchase(itemId)}
              style={{ ...cardStyle, cursor: 'pointer' }}
            >
              {thumb}
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
