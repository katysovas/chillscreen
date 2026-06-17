'use client';

import { CHARACTER_STYLES } from './characterStyles';

/**
 * Character sprite CSS — rendered as an inline <style> so rules exist before the
 * first crowd paint. (Moving this to useEffect caused hand props to render at the
 * wrong angle until movement triggered a reflow.)
 */
export function GameCharacterStyles() {
  return (
    <style
      data-game-character-styles=""
      dangerouslySetInnerHTML={{ __html: CHARACTER_STYLES }}
    />
  );
}
