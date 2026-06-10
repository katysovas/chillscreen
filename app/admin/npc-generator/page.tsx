import { NpcGeneratorAdmin } from '@/components/admin/NpcGeneratorAdmin';

export const metadata = {
  title: 'NPC Generator Admin',
  robots: { index: false, follow: false },
};

export default function NpcGeneratorAdminPage() {
  return <NpcGeneratorAdmin />;
}
