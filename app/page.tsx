import { HomeCityPicker } from '@/components/game/HomeCityPicker';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_DESCRIPTION, SITE_TAGLINE } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: SITE_TAGLINE,
  description: `${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
});

export default function Home() {
  return <HomeCityPicker />;
}
