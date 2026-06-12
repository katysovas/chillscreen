import { ORBIT_SCENE_LEFT_FLOATERS } from './orbitSceneMarkup';

/** Strip orbit CSS animation hooks from generated SVG fragments. */
export function orbitMarkupWithoutAnimations(html: string): string {
  return html
    .replace(/<g class="orbit-shoot">[\s\S]*?<\/g>/g, '')
    .replace(/\s*class="[^"]*orbit[^"]*"/g, '');
}

/** Planets only — main world + moon satellite (no rocket, astro, nebula, or surface art). */
export const ORBIT_SCENE_PLANETS = orbitMarkupWithoutAnimations(
  ORBIT_SCENE_LEFT_FLOATERS.split('<g class="orbit-rocket">')[0]!,
);
