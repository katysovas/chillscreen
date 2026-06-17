import { CHARACTER_STYLES } from './characterStyles';

/** Server-rendered character CSS — present in HTML before client paint. */
export function CharacterStylesTag() {
  return (
    <style
      data-game-character-styles=""
      dangerouslySetInnerHTML={{ __html: CHARACTER_STYLES }}
    />
  );
}
