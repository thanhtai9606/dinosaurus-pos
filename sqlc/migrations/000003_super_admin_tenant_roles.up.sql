-- Super admin platform role + per-tenant role on membership.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE tenant_users
  ADD COLUMN IF NOT EXISTS role user_role;
