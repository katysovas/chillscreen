export type Wallpaper = {
  url: string;
  alt: string;
  author: string;
  authorUrl: string;
};

// 6 manually curated calm landscapes from Unsplash (no runtime API key needed).
// URLs use the stable CDN format: https://images.unsplash.com/photo-<id>?...
export const WALLPAPERS: Wallpaper[] = [
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&fit=crop&auto=format',
    alt: 'misty mountain at dawn',
    author: 'Kalen Emsley',
    authorUrl: 'https://unsplash.com/@kalenemsley',
  },
  {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1080&fit=crop&auto=format',
    alt: 'still forest path',
    author: 'veeterzy',
    authorUrl: 'https://unsplash.com/@veeterzy',
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&fit=crop&auto=format',
    alt: 'calm lake at sunrise',
    author: 'Sven Scheuermeier',
    authorUrl: 'https://unsplash.com/@sveninho',
  },
  {
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1080&fit=crop&auto=format',
    alt: 'desert dunes at dusk',
    author: 'Wolfgang Hasselmann',
    authorUrl: 'https://unsplash.com/@wolfgang_hasselmann',
  },
  {
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1080&fit=crop&auto=format',
    alt: 'ocean horizon at twilight',
    author: 'Andrei Ciobanu',
    authorUrl: 'https://unsplash.com/@andreiciobanu',
  },
  {
    url: 'https://images.unsplash.com/photo-1571931468053-8d86f199f72f?w=1080&fit=crop&auto=format',
    alt: 'zen garden stones',
    author: 'Sarah Brown',
    authorUrl: 'https://unsplash.com/@sweetpagesco',
  },
];
