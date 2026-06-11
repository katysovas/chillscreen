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

export const FESTIE_TOPICS = [
  'house',
  'techno',
  'indie',
  'jam bands',
  'hip hop',
  'edm',
  'folk',
  'food',
  'camping',
  'light shows',
] as const;

export type FestieTopic = (typeof FESTIE_TOPICS)[number];

export function festiePresetById(id: FestiePreset): FestiePresetDef {
  return FESTIE_PRESETS.find(p => p.id === id) ?? FESTIE_PRESETS[0]!;
}
