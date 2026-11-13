package tenants

import (
	"context"
	"errors"

	"POS-kasir/internal/tenant"
	"POS-kasir/pkg/database"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Row struct {
	ID             uuid.UUID
	Code           string
	Name           string
	IsActive       bool
	DataPlane      string
	DatabaseDSNKey *string
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const tenantRowSelect = `id, code, name, is_active, data_plane::text, database_dsn_key`

func scanTenantRow(row pgx.Row) (Row, error) {
	var out Row
	err := row.Scan(&out.ID, &out.Code, &out.Name, &out.IsActive, &out.DataPlane, &out.DatabaseDSNKey)
	if out.DataPlane == "" {
		out.DataPlane = "shared"
	}
	return out, err
}

// RoutingForTenant implements database.TenantRoutingLookup.
func (r *Repository) RoutingForTenant(ctx context.Context, tenantID uuid.UUID) (database.TenantRouting, error) {
	row, err := r.GetByIDAny(ctx, tenantID)
	if err != nil {
		return database.TenantRouting{}, err
	}
	key := ""
	if row.DatabaseDSNKey != nil {
		key = *row.DatabaseDSNKey
	}
	return database.TenantRouting{
		DataPlane:      row.DataPlane,
		DatabaseDSNKey: key,
	}, nil
}

func (r *Repository) ListForUser(ctx context.Context, userID uuid.UUID) ([]Row, error) {
	const q = `
SELECT t.id, t.code, t.name, t.is_active, t.data_plane::text, t.database_dsn_key
FROM tenants t
JOIN tenant_users tu ON tu.tenant_id = t.id
WHERE tu.user_id = $1 AND t.is_active = true
ORDER BY t.name`
	rows, err := r.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Row
	for rows.Next() {
		row, err := scanTenantRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) GetByCode(ctx context.Context, code string) (Row, error) {
	const q = `SELECT ` + tenantRowSelect + ` FROM tenants WHERE code = $1 AND is_active = true`
	return scanTenantRow(r.pool.QueryRow(ctx, q, code))
}

func (r *Repository) GetByIDAny(ctx context.Context, id uuid.UUID) (Row, error) {
	const q = `SELECT ` + tenantRowSelect + ` FROM tenants WHERE id = $1`
	return scanTenantRow(r.pool.QueryRow(ctx, q, id))
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (Row, error) {
	const q = `SELECT ` + tenantRowSelect + ` FROM tenants WHERE id = $1 AND is_active = true`
	return scanTenantRow(r.pool.QueryRow(ctx, q, id))
}

func (r *Repository) UserHasTenant(ctx context.Context, userID, tenantID uuid.UUID) (bool, error) {
	const q = `SELECT 1 FROM tenant_users WHERE user_id = $1 AND tenant_id = $2`
	var one int
	err := r.pool.QueryRow(ctx, q, userID, tenantID).Scan(&one)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *Repository) AddUserToDefaultTenant(ctx context.Context, userID uuid.UUID) error {
	const q = `INSERT INTO tenant_users (tenant_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.pool.Exec(ctx, q, tenant.DefaultTenantID, userID)
	return err
}

func (r *Repository) EnsureDefaultTenant(ctx context.Context) error {
	const q = `
INSERT INTO tenants (id, code, name, is_active)
VALUES ($1, 'default', 'Default Store', true)
ON CONFLICT (id) DO NOTHING`
	_, err := r.pool.Exec(ctx, q, tenant.DefaultTenantID)
	return err
}

func (r *Repository) AssignAllUsersToDefault(ctx context.Context) error {
	const q = `
INSERT INTO tenant_users (tenant_id, user_id)
SELECT $1, u.id FROM users u
ON CONFLICT DO NOTHING`
	_, err := r.pool.Exec(ctx, q, tenant.DefaultTenantID)
	return err
}

func (r *Repository) ListAll(ctx context.Context) ([]Row, error) {
	const q = `SELECT ` + tenantRowSelect + ` FROM tenants ORDER BY name`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Row
	for rows.Next() {
		row, err := scanTenantRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) Create(ctx context.Context, id uuid.UUID, code, name, dataPlane string, dsnKey *string) (Row, error) {
	if dataPlane == "" {
		dataPlane = "shared"
	}
	const q = `
INSERT INTO tenants (id, code, name, is_active, data_plane, database_dsn_key)
VALUES ($1, $2, $3, true, $4::tenant_data_plane, $5)
RETURNING ` + tenantRowSelect
	return scanTenantRow(r.pool.QueryRow(ctx, q, id, code, name, dataPlane, dsnKey))
}

type MemberRow struct {
	UserID   uuid.UUID
	Email    string
	Username string
	Role     string
	IsActive bool
}

func (r *Repository) ListMembers(ctx context.Context, tenantID uuid.UUID) ([]MemberRow, error) {
	const q = `
SELECT u.id, u.email, u.username, COALESCE(tu.role::text, u.role::text), u.is_active
FROM tenant_users tu
JOIN users u ON u.id = tu.user_id
WHERE tu.tenant_id = $1 AND u.role <> 'super_admin'
ORDER BY u.email`
	rows, err := r.pool.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []MemberRow
	for rows.Next() {
		var row MemberRow
		if err := rows.Scan(&row.UserID, &row.Email, &row.Username, &row.Role, &row.IsActive); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) RemoveMember(ctx context.Context, tenantID, userID uuid.UUID) error {
	const q = `DELETE FROM tenant_users WHERE tenant_id = $1 AND user_id = $2`
	tag, err := r.pool.Exec(ctx, q, tenantID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) UpdateMemberRole(ctx context.Context, tenantID, userID uuid.UUID, role string) error {
	const q = `UPDATE tenant_users SET role = $3::user_role WHERE tenant_id = $1 AND user_id = $2`
	tag, err := r.pool.Exec(ctx, q, tenantID, userID, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) AddMember(ctx context.Context, tenantID, userID uuid.UUID, role *string) error {
	const q = `
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES ($1, $2, $3::user_role)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = COALESCE(EXCLUDED.role, tenant_users.role)`
	_, err := r.pool.Exec(ctx, q, tenantID, userID, role)
	return err
}

func (r *Repository) EffectiveRole(ctx context.Context, tenantID, userID uuid.UUID) (string, error) {
	const q = `
SELECT COALESCE(tu.role, u.role)::text
FROM users u
LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = $1
WHERE u.id = $2 AND u.deleted_at IS NULL`
	var role string
	err := r.pool.QueryRow(ctx, q, tenantID, userID).Scan(&role)
	return role, err
}

func (r *Repository) UserInTenant(ctx context.Context, tenantID, userID uuid.UUID) (bool, error) {
	const q = `SELECT 1 FROM tenant_users WHERE tenant_id = $1 AND user_id = $2`
	var one int
	err := r.pool.QueryRow(ctx, q, tenantID, userID).Scan(&one)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, name string, isActive bool) (Row, error) {
	const q = `
UPDATE tenants
SET name = $2, is_active = $3, updated_at = now()
WHERE id = $1
RETURNING ` + tenantRowSelect
	return scanTenantRow(r.pool.QueryRow(ctx, q, id, name, isActive))
}

func (r *Repository) DeleteByID(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM tenants WHERE id = $1`
	_, err := r.pool.Exec(ctx, q, id)
	return err
}

func (r *Repository) BackfillTenantMemberRoles(ctx context.Context) error {
	const q = `
UPDATE tenant_users tu
SET role = u.role
FROM users u
WHERE tu.user_id = u.id AND tu.role IS NULL AND u.role <> 'super_admin'`
	_, err := r.pool.Exec(ctx, q)
	return err
}
