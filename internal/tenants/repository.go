package tenants

import (
	"context"
	"errors"

	"POS-kasir/internal/tenant"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Row struct {
	ID       uuid.UUID
	Code     string
	Name     string
	IsActive bool
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListForUser(ctx context.Context, userID uuid.UUID) ([]Row, error) {
	const q = `
SELECT t.id, t.code, t.name, t.is_active
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
		var row Row
		if err := rows.Scan(&row.ID, &row.Code, &row.Name, &row.IsActive); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) GetByCode(ctx context.Context, code string) (Row, error) {
	const q = `SELECT id, code, name, is_active FROM tenants WHERE code = $1 AND is_active = true`
	var row Row
	err := r.pool.QueryRow(ctx, q, code).Scan(&row.ID, &row.Code, &row.Name, &row.IsActive)
	return row, err
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
