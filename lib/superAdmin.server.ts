import { getFestieByUserId } from '@/lib/festie/db';
import { isSuperAdminFestieName } from '@/lib/superAdmin';

export async function isSuperAdminUserId(userId: string): Promise<boolean> {
  const festie = await getFestieByUserId(userId);
  return isSuperAdminFestieName(festie?.name);
}
