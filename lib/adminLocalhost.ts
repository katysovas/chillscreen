/** Admin tools are dev-only and must not be exposed in production. */
export function isLocalAdminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isLocalhostHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.split(':')[0]?.toLowerCase() ?? '';
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

export function assertLocalAdminRequest(request: Request): void {
  if (!isLocalAdminEnabled()) {
    throw new AdminForbiddenError('Admin is disabled in production');
  }
  const host = request.headers.get('host');
  if (!isLocalhostHost(host)) {
    throw new AdminForbiddenError('Admin is only available on localhost');
  }
}

export class AdminForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AdminForbiddenError';
  }
}
