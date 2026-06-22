'use client';

import { createContext, useContext } from 'react';

const LandingHeroContext = createContext(false);

export function LandingHeroProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <LandingHeroContext.Provider value={active}>
      {children}
    </LandingHeroContext.Provider>
  );
}

export function useLandingHero() {
  return useContext(LandingHeroContext);
}
