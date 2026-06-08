'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const VendorShopPanelInner = dynamic(
  () => import('./VendorShopPanel').then(m => m.VendorShopPanel),
  { ssr: false, loading: () => null },
);

export type VendorShopPanelProps = ComponentProps<
  typeof import('./VendorShopPanel').VendorShopPanel
>;

export function VendorShopPanel(props: VendorShopPanelProps) {
  return <VendorShopPanelInner {...props} />;
}

let vendorShopPreload: Promise<unknown> | null = null;

/** Warm the vendor panel chunk — call when approaching Buz. */
export function preloadVendorShopPanel(): void {
  if (!vendorShopPreload) {
    vendorShopPreload = import('./VendorShopPanel');
  }
}
