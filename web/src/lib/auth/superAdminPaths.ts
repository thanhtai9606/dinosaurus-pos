/** Routes super admin may open (platform console only — no tenant POS). */
const SUPER_ADMIN_PREFIXES = ['/platform', '/tenants', '/account'] as const

export function isSuperAdminPlatformPath(pathname: string): boolean {
  if (pathname === '/') return false
  return SUPER_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export const SUPER_ADMIN_HOME = '/platform/overview' as const
