'use client';

import { createCreatorMainStage } from '../creatorTemplates/shared/createCreatorMainStage';
import { createCreatorTrussLabel } from '../creatorTemplates/shared/createCreatorTrussLabel';
import * as constants from './constants';

const C = { idPrefix: 'cinema', ...constants };

export const CinemaStage = createCreatorMainStage(C).MainStage;
export const CinemaTrussLabel = createCreatorTrussLabel(C);
export { CinemaTile } from './CinemaTile';
export { CityBackdropLayer } from './CityBackdropLayer';
export {
  WHICH_STAGE_MID_X as CINEMA_STAGE_MID_X,
  WHICH_STAGE_HALF as CINEMA_STAGE_HALF,
  WHICH_STAGE_TOILET_HALF as CINEMA_STAGE_TOILET_HALF,
} from './constants';
