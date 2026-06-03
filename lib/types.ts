export type CoverrVideo = {
  id: string;
  title: string;
  poster: string;
  thumbnail: string;
  duration: number;
  tags: string[];
  urls: { mp4: string; mp4_preview: string; mp4_download: string };
};

export type CoverrAudio = {
  id: string;
  name: string;
  duration: number;
  moods: string[];
  genres: string[];
  isPremium: boolean;
  urls: { preview: string; previewDownload: string; masterDownload: string };
};

export type CoverrCategory = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
};

export type CuratedCategory = {
  id: string;
  name: string;
  emoji: string;
  videoIds: string[];
};

export type HydratedCategory = {
  id: string;
  name: string;
  emoji: string;
  videos: CoverrVideo[];
};
