/** @deprecated Use `@/lib/adminAuth` — kept for existing imports. */
export {
  AdminForbiddenError,
  assertAdminRequest,
  assertAdminOrSuperAdminRequest,
  assertAdminOrSuperAdminRequest as assertLocalAdminRequest,
  isAdminEnabled,
  isAdminAuthenticated,
} from '@/lib/adminAuth';
