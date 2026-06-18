import chartData from '@/data/featured-stages-chart.json';
import { stagePickerTargetId, type StagePickerTarget } from '@/lib/stagePickerOptions';

export type ChartMovement = 'up' | 'down' | 'same';

export type FeaturedChartEntry = {
  rank: number;
  previousRank: number | null;
  /** Venue rows — required. Creator rows fall back to live API metadata. */
  name?: string;
  subtitle?: string;
  thumbnail?: string;
  target: StagePickerTarget;
};

export type FeaturedChartTab = {
  id: string;
  label: string;
  entries: FeaturedChartEntry[];
};

type FeaturedStagesChartData = {
  tabs: FeaturedChartTab[];
};

const data = chartData as FeaturedStagesChartData;

/** Active chart tab — single "Featured" tab for now; genre tabs later. */
export function getFeaturedStagesChartTab(tabId = 'featured'): FeaturedChartTab {
  return data.tabs.find(tab => tab.id === tabId) ?? data.tabs[0]!;
}

export function chartEntryId(entry: FeaturedChartEntry): string {
  return stagePickerTargetId(entry.target);
}

export function chartMovement(rank: number, previousRank: number | null): ChartMovement {
  if (previousRank == null || previousRank === rank) return 'same';
  return previousRank > rank ? 'up' : 'down';
}
