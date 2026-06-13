'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type CinemaCanvasContextValue = { active: boolean; interactive: boolean };

const CinemaCanvasContext = createContext<CinemaCanvasContextValue>({
  active: false,
  interactive: false,
});

export function useCinemaCanvas() {
  return useContext(CinemaCanvasContext);
}

export function CinemaCanvasProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ active, interactive: active }), [active]);
  return (
    <CinemaCanvasContext.Provider value={value}>
      {children}
    </CinemaCanvasContext.Provider>
  );
}
