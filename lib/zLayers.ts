/** Edge nav signs (prev/next stage) — below crowd, player, and canvases; sign glyphs re-enable pointer-events. */
export const Z_NAV_SIGNS = 12;

/** Local player — always above crowd depth rows and the desktop bottom control panel (z-index 38). */
export const Z_PLAYER_CHARACTER = 45;

/** Stage easels and NPC drawing canvases — above crowd and player. */
export const Z_EASEL = 47;

/** Visible ambient/public chat bubbles — above easels; latest bumps to Z_CHAT_OVERLAY. */
export const Z_AMBIENT_CHAT = Z_EASEL + 1;

/** In-world chat overlays and conversation character lifts — below modals. */
export const Z_CHAT_CHARACTER = 200;
export const Z_CHAT_OVERLAY = 201;

/** Bottom controls, mobile chat bar, festie corner. */
export const Z_CONTROLS = 100;

/** Standard in-game modals and panels (Help, Festie Life, vendor shop). */
export const Z_MODAL = 500;

/** Modals that stack on top of other modals (settings, sign-out confirm). */
export const Z_MODAL_NESTED = 510;

/** Full-screen flows: welcome, stage picker, boot shell. */
export const Z_OVERLAY = 1000;

/** Paraloid capture preview — above other overlays. */
export const Z_PARALOID = 1100;
