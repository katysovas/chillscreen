/** In-game super admin — festie display name (case-insensitive). */
export const SUPER_ADMIN_FESTIE_NAME = 'HuskyNights';

export function isSuperAdminFestieName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return name.trim().toLowerCase() === SUPER_ADMIN_FESTIE_NAME.toLowerCase();
}
