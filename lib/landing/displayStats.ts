/** Marketing bump on homepage hero / stages eyebrow. */
export const LANDING_STAGE_COUNT_INFLATION = 20;
export const LANDING_FESTIE_COUNT_INFLATION = 200;

export function displayStageCount(builtInStages: number, creatorStages: number): number {
  return builtInStages + creatorStages + LANDING_STAGE_COUNT_INFLATION;
}

export function displayFestieCount(rawTotal: number): number {
  return rawTotal + LANDING_FESTIE_COUNT_INFLATION;
}
