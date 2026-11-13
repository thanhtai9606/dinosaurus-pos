package platform

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) InsertAudit(ctx context.Context, actor uuid.UUID, action, resourceType, resourceID string, details json.RawMessage) error {
	const q = `
INSERT INTO platform_audit_logs (actor_user_id, action, resource_type, resource_id, details)
VALUES ($1, $2, $3, NULLIF($4, ''), $5)`
	_, err := r.pool.Exec(ctx, q, actor, action, resourceType, resourceID, details)
	return err
}

type MembershipRow struct {
	UserID       uuid.UUID
	Email        string
	Username     string
	GlobalRole   string
	TenantID     uuid.UUID
	TenantCode   string
	TenantName   string
	TenantRole   *string
	IsSuperAdmin bool
}

func (r *Repository) ListMemberships(ctx context.Context) ([]MembershipRow, error) {
	const q = `
SELECT
  u.id,
  u.email,
  u.username,
  u.role::text,
  t.id,
  t.code,
  t.name,
  tu.role::text
FROM tenant_users tu
JOIN users u ON u.id = tu.user_id
JOIN tenants t ON t.id = tu.tenant_id
WHERE u.role <> 'super_admin'
ORDER BY u.email, t.code`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []MembershipRow
	for rows.Next() {
		var row MembershipRow
		if err := rows.Scan(
			&row.UserID, &row.Email, &row.Username, &row.GlobalRole,
			&row.TenantID, &row.TenantCode, &row.TenantName, &row.TenantRole,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) ListSuperAdmins(ctx context.Context) ([]MembershipRow, error) {
	const q = `
SELECT u.id, u.email, u.username, u.role::text
FROM users u
WHERE u.role = 'super_admin'
ORDER BY u.email`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []MembershipRow
	for rows.Next() {
		var row MembershipRow
		row.IsSuperAdmin = true
		if err := rows.Scan(&row.UserID, &row.Email, &row.Username, &row.GlobalRole); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

type AuditRow struct {
	ID           uuid.UUID
	ActorUserID  *uuid.UUID
	ActorEmail   *string
	Action       string
	ResourceType string
	ResourceID   *string
	Details      json.RawMessage
	CreatedAt    time.Time
}

func (r *Repository) ListAudits(ctx context.Context, limit int) ([]AuditRow, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	const q = `
SELECT a.id, a.actor_user_id, u.email, a.action, a.resource_type, a.resource_id, a.details, a.created_at
FROM platform_audit_logs a
LEFT JOIN users u ON u.id = a.actor_user_id
ORDER BY a.created_at DESC
LIMIT $1`
	rows, err := r.pool.Query(ctx, q, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AuditRow
	for rows.Next() {
		var row AuditRow
		if err := rows.Scan(
			&row.ID, &row.ActorUserID, &row.ActorEmail, &row.Action, &row.ResourceType,
			&row.ResourceID, &row.Details, &row.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *Repository) SchemaVersion(ctx context.Context) (int, bool, error) {
	var version int
	var dirty bool
	err := r.pool.QueryRow(ctx, `SELECT version, dirty FROM schema_migrations LIMIT 1`).Scan(&version, &dirty)
	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, false, nil
		}
		return 0, false, err
	}
	return version, dirty, nil
}
