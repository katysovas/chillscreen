'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Multiplayer } from '@/lib/multiplayer/useMultiplayer';

export type StageLineupMultiplayer = Pick<
  Multiplayer,
  | 'connected'
  | 'requestConnect'
  | 'sendLineupSubscribe'
  | 'sendLineupVote'
  | 'sendLineupSuggest'
  | 'registerLineupStateHandler'
  | 'sendMatchupSubscribe'
  | 'sendMatchupVote'
  | 'registerMatchupStateHandler'
>;

const StageLineupMultiplayerContext = createContext<StageLineupMultiplayer | null>(null);

export function StageLineupMultiplayerProvider({
  value,
  children,
}: {
  value: StageLineupMultiplayer;
  children: ReactNode;
}) {
  return (
    <StageLineupMultiplayerContext.Provider value={value}>
      {children}
    </StageLineupMultiplayerContext.Provider>
  );
}

export function useStageLineupMultiplayer(): StageLineupMultiplayer | null {
  return useContext(StageLineupMultiplayerContext);
}
