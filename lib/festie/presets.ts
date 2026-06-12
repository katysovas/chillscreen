import type { FestiePreset } from '@/lib/festie/types';

export type FestiePresetDef = {
  id: FestiePreset;
  label: string;
  balloonColor: string;
  outfit?: string;
};

/** Visual presets for Make Your Festie — maps to Character balloon + outfit. */
export const FESTIE_PRESETS: FestiePresetDef[] = [
  { id: 'ember', label: 'Ember', balloonColor: '#ef4023' },
  { id: 'moss', label: 'Moss', balloonColor: '#4a7c59', outfit: 'tie-dye' },
  { id: 'tide', label: 'Tide', balloonColor: '#4a90c4' },
  { id: 'dusk', label: 'Dusk', balloonColor: '#7b5ea7' },
];

export const FESTIE_TOPIC_OPTIONS = [
  { id: 'music', label: 'Music' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'sports', label: 'Sports' },
  { id: 'politics', label: 'Politics' },
  { id: 'food', label: 'Food' },
  { id: 'art', label: 'Art' },
  { id: 'technology', label: 'Technology' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'travel', label: 'Travel' },
  { id: 'nature', label: 'Nature' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'movies', label: 'Movies' },
] as const;

export const FESTIE_TOPICS = FESTIE_TOPIC_OPTIONS.map(o => o.id);

export type FestieTopic = (typeof FESTIE_TOPIC_OPTIONS)[number]['id'];

const TOPIC_LABEL_BY_ID = Object.fromEntries(
  FESTIE_TOPIC_OPTIONS.map(o => [o.id, o.label]),
) as Record<FestieTopic, string>;

export function festieTopicLabel(topicId: string): string {
  return TOPIC_LABEL_BY_ID[topicId as FestieTopic] ?? topicId;
}

export function formatFestieTopics(topics: string[]): string {
  return topics.map(festieTopicLabel).join(', ');
}

export function festiePresetById(id: FestiePreset): FestiePresetDef {
  return FESTIE_PRESETS.find(p => p.id === id) ?? FESTIE_PRESETS[0]!;
}
