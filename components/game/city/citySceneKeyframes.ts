import { SKY_CREATURES_KF } from '../SkyCreatures';

/** Scene parallax / UI keyframes (not character body). */
export const CITY_SCENE_KEYFRAMES = `
  @keyframes cloud1 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(16px)} }
  @keyframes cloud2 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(-12px)} }
  @keyframes cloud3 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(9px)} }
  @keyframes sw1    { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
  @keyframes sw2    { 0%,100%{transform:rotate(-1deg)}   50%{transform:rotate(1deg)} }
  @keyframes sw3    { 0%,100%{transform:rotate(-2.2deg)} 50%{transform:rotate(2.2deg)} }
  @keyframes fdi       { from{opacity:0} to{opacity:1} }
  @keyframes greet-pop { 0%,100%{transform:translateX(-50%) scale(1) translateY(0);} 50%{transform:translateX(-50%) scale(1.18) translateY(-6px);} }
  @keyframes chat-in-left  { from{opacity:0;} to{opacity:1;} }
  @keyframes chat-in-right { from{opacity:0;} to{opacity:1;} }
  ${SKY_CREATURES_KF}
`;
