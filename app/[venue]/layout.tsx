import { CharacterStylesTag } from '@/components/game/CharacterStylesTag';
import { LOGO_PATH } from '@/lib/site';

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" href={LOGO_PATH} as="image" fetchPriority="high" />
      <CharacterStylesTag />
      {children}
    </>
  );
}
