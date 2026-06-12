/** Longer standing still between wander bursts (multiplier on personality.idleMs). */
export const NPC_IDLE_MS_SCALE = 2.2;

/** When idle timer fires, chance of actually starting a walk (else stay put longer). */
export const NPC_WANDER_START_CHANCE = 0.5;

/** Shorter walk bursts at full speed (multiplier on 4–10s leg timer). */
export const NPC_WANDER_LEG_MS_SCALE = 0.6;

/** How far targets can be from current spot (0–1). Lower = less left/right travel. */
export const NPC_WANDER_DISTANCE_SCALE = 0.45;

/** Cross-screen roam chance (default logic used 0.25). */
export const NPC_FAR_WANDER_CHANCE = 0.08;

/** Jump probability multiplier on personality.jumpiness. */
export const NPC_JUMP_CHANCE_SCALE = 0.3;

/** How often each NPC rolls for a jump (ms). */
export const NPC_JUMP_CHECK_MS: [number, number] = [6500, 15_000];
