ALTER TABLE tenant_users DROP COLUMN IF EXISTS role;

-- Cannot remove enum value 'super_admin' from user_role in PostgreSQL without recreating the type.
