-- name: GetSettings :many
SELECT key, value, description, updated_at
FROM settings
ORDER BY key;

-- name: GetSettingByKey :one
SELECT key, value, description, updated_at
FROM settings
WHERE key = $1;

-- name: UpdateSetting :one
UPDATE settings
SET value = $2, updated_at = NOW()
WHERE key = $1
RETURNING key, value, description, updated_at;

-- name: UpsertSetting :one
INSERT INTO settings (tenant_id, key, value, updated_at)
VALUES (
  COALESCE(
    NULLIF(current_setting('app.tenant_id', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  $1,
  $2,
  NOW()
)
ON CONFLICT (tenant_id, key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW()
RETURNING key, value, description, updated_at;
