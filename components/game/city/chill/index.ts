'use client';

import { createCreatorMainStage } from '../creatorTemplates/shared/createCreatorMainStage';
import { createCreatorTrussLabel } from '../creatorTemplates/shared/createCreatorTrussLabel';
import * as constants from './constants';

const C = { ...constants, idPrefix: 'chill', trussTitleFill: constants.CHILL_STAGE_TITLE_COLOR };

export const ChillStage = createCreatorMainStage(C).MainStage;
export const ChillTrussLabel = createCreatorTrussLabel(C);
export { ChillTile } from './ChillTile';
export { ChillForestLayer } from './ChillForestLayer';
export {
  WHICH_STAGE_MID_X as CHILL_STAGE_MID_X,
  WHICH_STAGE_HALF as CHILL_STAGE_HALF,
  WHICH_STAGE_TOILET_HALF as CHILL_STAGE_TOILET_HALF,
} from './constants';
