export type CreatorStageConstants = {
  idPrefix: string;
  TENTAROO_GND: number;
  WHICH_STAGE_MID_X: number;
  WHICH_STAGE_SCALE: number;
  WHICH_STAGE_PUSH_Y: number;
  WHICH_NEON: {
    green: string;
    cyan: string;
    magenta: string;
    amber: string;
    violet: string;
    edge: string;
  };
  /** Truss title fill — defaults to farm neon white-green. */
  trussTitleFill?: string;
  /** Moving-head truss Y — default 368. */
  WHICH_STAGE_TRUSS_Y?: number;
  /** Now-playing strip top Y — below truss on the foreground rig. */
  WHICH_STAGE_STREAM_LABEL_Y?: number;
  /** Stage name baseline Y — default trussY - 18. */
  WHICH_STAGE_TITLE_Y?: number;
  /** Speaker stack top Y — default trussY + 28. */
  WHICH_STAGE_SPEAKER_Y?: number;
  /** Video screen top Y — default 406. */
  WHICH_STAGE_SCREEN_Y?: number;
  /** Landing hero — gap between truss bottom and speaker/screen row. */
  WHICH_STAGE_HERO_ROW_GAP?: number;
  /** Landing hero — push speakers/screen below the nav. */
  WHICH_STAGE_HERO_NAV_GAP?: number;
};
