package platform

import (
	"context"
	"os"

	"POS-kasir/internal/tenants"
	"POS-kasir/pkg/database"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DedicatedIssue struct {
	TenantID       string `json:"tenant_id"`
	TenantCode     string `json:"tenant_code"`
	DatabaseDSNKey string `json:"database_dsn_key"`
	EnvConfigured  bool   `json:"env_configured"`
}

type Overview struct {
	TenantTotal            int              `json:"tenant_total"`
	TenantActive           int              `json:"tenant_active"`
	TenantShared           int              `json:"tenant_shared"`
	TenantDedicated        int              `json:"tenant_dedicated"`
	DedicatedMissingDSN    []DedicatedIssue `json:"dedicated_missing_dsn"`
	DedicatedPoolsOpen     int              `json:"dedicated_pools_open"`
	DatabaseOK             bool             `json:"database_ok"`
	SchemaVersion          int              `json:"schema_version"`
	SchemaDirty            bool             `json:"schema_dirty"`
}

type Service struct {
	repo       *Repository
	tenantRepo *tenants.Repository
	pool       *pgxpool.Pool
	router     *database.PoolRouter
}

func NewService(repo *Repository, tenantRepo *tenants.Repository, pool *pgxpool.Pool, router *database.PoolRouter) *Service {
	return &Service{repo: repo, tenantRepo: tenantRepo, pool: pool, router: router}
}

func (s *Service) Overview(ctx context.Context) (Overview, error) {
	out := Overview{DatabaseOK: true}
	if err := s.pool.Ping(ctx); err != nil {
		out.DatabaseOK = false
	}

	rows, err := s.tenantRepo.ListAll(ctx)
	if err != nil {
		return out, err
	}
	out.TenantTotal = len(rows)
	for _, t := range rows {
		if t.IsActive {
			out.TenantActive++
		}
		if t.DataPlane == "dedicated" {
			out.TenantDedicated++
			key := ""
			if t.DatabaseDSNKey != nil {
				key = *t.DatabaseDSNKey
			}
			configured := key != "" && os.Getenv(key) != ""
			if !configured {
				out.DedicatedMissingDSN = append(out.DedicatedMissingDSN, DedicatedIssue{
					TenantID:       t.ID.String(),
					TenantCode:     t.Code,
					DatabaseDSNKey: key,
					EnvConfigured:  configured,
				})
			}
		} else {
			out.TenantShared++
		}
	}

	if s.router != nil {
		out.DedicatedPoolsOpen = s.router.DedicatedPoolCount()
	}

	ver, dirty, err := s.repo.SchemaVersion(ctx)
	if err == nil {
		out.SchemaVersion = ver
		out.SchemaDirty = dirty
	}
	return out, nil
}

func (s *Service) Memberships(ctx context.Context) ([]MembershipRow, error) {
	rows, err := s.repo.ListMemberships(ctx)
	if err != nil {
		return nil, err
	}
	supers, err := s.repo.ListSuperAdmins(ctx)
	if err != nil {
		return nil, err
	}
	return append(supers, rows...), nil
}

func (s *Service) Audits(ctx context.Context, limit int) ([]AuditRow, error) {
	return s.repo.ListAudits(ctx, limit)
}
