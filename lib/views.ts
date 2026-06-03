import { WALLPAPERS } from './images';

const UTM = 'utm_source=chillscreen&utm_medium=referral';

export function buildHomeView(selectedIndex: number) {
  const hero = WALLPAPERS[selectedIndex];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Breathe. 🌿', emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Your current scene*' },
    },
    hero.videoUrl
      ? {
          type: 'video',
          video_url: hero.videoUrl,
          thumbnail_url: hero.thumbnailUrl ?? hero.url,
          alt_text: hero.alt,
          title: { type: 'plain_text', text: hero.alt },
        }
      : {
          type: 'image',
          image_url: hero.url,
          alt_text: hero.alt,
        },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: hero.videoUrl
            ? `🎬 Playing: ${hero.alt}`
            : `Photo by <${hero.authorUrl}?${UTM}|${hero.author}> on <https://unsplash.com/?${UTM}|Unsplash>`,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Choose a different scene*' },
    },
  ];

  for (const [i, img] of WALLPAPERS.entries()) {
    if (i === selectedIndex) continue;

    blocks.push({
      type: 'image',
      image_url: img.url,
      alt_text: img.alt,
    });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Photo by <${img.authorUrl}?${UTM}|${img.author}> on <https://unsplash.com/?${UTM}|Unsplash>`,
        },
      ],
    });
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✓ Set as main', emoji: true },
          action_id: 'set_hero',
          value: String(i),
        },
      ],
    });
  }

  return { type: 'home' as const, blocks };
}
