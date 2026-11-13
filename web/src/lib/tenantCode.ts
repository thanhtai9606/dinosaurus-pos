import * as z from 'zod'

/** Must match `internal/tenant/code.go` (no whitespace; 2–32 chars). */
export const TENANT_CODE_PATTERN = /^[a-z0-9_-]{2,32}$/

export function stripTenantCodeInput(value: string): string {
  return value.replace(/\s+/g, '')
}

export function normalizeTenantCode(value: string): string | null {
  const trimmed = stripTenantCodeInput(value).toLowerCase()
  if (!TENANT_CODE_PATTERN.test(trimmed)) return null
  return trimmed
}

export function isValidTenantCode(value: string): boolean {
  return normalizeTenantCode(value) !== null
}

type TenantCodeT = (key: string) => string

export function tenantCodeZodField(t: TenantCodeT) {
  return z
    .string()
    .min(2)
    .max(32)
    .refine((v) => !/\s/.test(v), { message: t('auth.tenant_code_no_spaces') })
    .refine((v) => isValidTenantCode(v), { message: t('auth.tenant_code_invalid') })
}
