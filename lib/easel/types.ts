/** Ambient NPC drawing — stroke program + easel state (spec v5). */

export type VenueCanvasPoint = [number, number];

/** Legacy player canvas stroke (venue_canvases). */
export type VenueCanvasStroke = {
  color: string;
  width: number;
  points: VenueCanvasPoint[];
};

/** Single stroke in a program — palette index preferred over hex `c`. */
export type DrawingStroke = {
  pi?: number;
  c?: string;
  w?: number;
  p: VenueCanvasPoint[];
};

export type DrawingProgram = {
  id: string;
  npc: string;
  model: string;
  topic: string;
  strokes: DrawingStroke[];
};

export type NpcDrawingPool = {
  model: string;
  palette: string[];
  drawings: DrawingProgram[];
};

export type DrawingsPoolFile = {
  version: number;
  npcs: Record<string, NpcDrawingPool>;
};

/** Flattened segment for delta-draw. */
export type DrawSegment = {
  pi: number;
  w: number;
  a: VenueCanvasPoint;
  b: VenueCanvasPoint;
};

export type EaselStatus = 'painting' | 'done';

export type EaselRow = {
  stage: string;
  slot: number;
  npc: string;
  drawing_id: string;
  total_segments: number;
  segments_done: number;
  rate: number;
  status: EaselStatus;
  started_at: string;
  completed_at: string | null;
  hidden_at: string | null;
  topic: string | null;
  program_json: DrawingProgram | null;
};

/** Broadcast baseline — clients compute liveDone from sessionStart. */
export type EaselSlotSync = {
  slot: number;
  npc: string;
  drawing_id: string;
  total_segments: number;
  segments_done: number;
  rate: number;
  status: EaselStatus;
  /** DB watched-clock anchor — used to restore progress after reload. */
  started_at?: string;
  topic?: string;
  /** AI-generated or legacy stroke program — included in API responses. */
  program?: DrawingProgram;
  /** Set when status is done — used for post-completion hold timer. */
  completed_at?: string;
};

export type EaselSessionSync = {
  sessionStart: number;
  slots: EaselSlotSync[];
};

export const EASEL_LOGICAL_SIZE = 96;
/** Distinct ground positions per stage — easels rotate through these, off the downstage lane. */
export const EASEL_SLOTS_PER_STAGE = 4;
export const EASEL_STEP_MS = 600;
export const EASEL_SEGMENTS_PER_STEP = 2;
export const EASEL_HOLD_MS = 120_000;
/** Hard cap — every canvas disappears within 5 minutes of appearing. */
export const EASEL_MAX_VISIBLE_MS = 300_000;
export const EASEL_DEFAULT_RATE = 0.5;

/** Client-side chat-triggered drawing next to an NPC. */
export type ChatNpcDrawingSession = {
  id: string;
  npcId: string;
  topic: string;
  program: DrawingProgram;
  totalSegments: number;
  /** Ground world-x anchor for the canvas center. */
  canvasWorldX: number;
  sessionStart: number;
  expiresAt: number;
  status: EaselStatus;
  /** Drawing LLM — shown in compare test mode. */
  modelId?: string;
  modelLabel?: string;
  /** Compare test — canvas clock runs without easel painter-ready gate. */
  isCompareTest?: boolean;
};
