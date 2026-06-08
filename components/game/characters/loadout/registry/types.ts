import type { ReactNode } from 'react';
import type { LoadoutRenderCtx } from '../types';

export type ItemRenderer = (ctx: LoadoutRenderCtx) => ReactNode;
