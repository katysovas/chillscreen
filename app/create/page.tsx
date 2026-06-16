import type { Metadata } from 'next';
import { CreateStageWizard } from '@/components/create/CreateStageWizard';
import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Your Stage',
  description: 'Build your own WhichStage — pick a URL, paste your stream, and share the link.',
  path: '/create',
  keywords: ['create', 'stage', 'stream', 'festival', 'whichstage'],
});

export default function CreatePage() {
  return <CreateStageWizard />;
}
