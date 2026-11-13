package tenants

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"POS-kasir/internal/common"
	"POS-kasir/internal/tenant"
	user_repo "POS-kasir/internal/user/repository"
	"POS-kasir/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var ErrTenantCodeExists = errors.New("tenant code already exists")

type Service struct {
	repo *Repository
	log  logger.ILogger
}

func NewService(repo *Repository, log logger.ILogger) *Service {
	return &Service{repo: repo, log: log}
}

type CreateTenantRequest struct {
	Code             string  `json:"code" validate:"required,min=2,max=32"`
	Name             string  `json:"name" validate:"required,min=2,max=150"`
	DataPlane        string  `json:"data_plane,omitempty" validate:"omitempty,oneof=shared dedicated"`
	DatabaseDSNKey   *string `json:"database_dsn_key,omitempty" validate:"omitempty,max=64"`
}

type UpdateTenantRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=150"`
	IsActive bool   `json:"is_active"`
}

func (s *Service) ListAll(ctx context.Context) ([]Summary, error) {
	rows, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	return Summaries(rows), nil
}

func (s *Service) Create(ctx context.Context, req CreateTenantRequest) (Summary, error) {
	code := strings.ToLower(strings.TrimSpace(req.Code))
	name := strings.TrimSpace(req.Name)
	id, err := uuid.NewV7()
	if err != nil {
		return Summary{}, err
	}
	plane := strings.ToLower(strings.TrimSpace(req.DataPlane))
	if plane == "" {
		plane = "shared"
	}
	if plane == "dedicated" && (req.DatabaseDSNKey == nil || strings.TrimSpace(*req.DatabaseDSNKey) == "") {
		return Summary{}, fmt.Errorf("%w: database_dsn_key required for dedicated tenant", common.ErrBadRequest)
	}
	var dsnKey *string
	if req.DatabaseDSNKey != nil {
		k := strings.TrimSpace(*req.DatabaseDSNKey)
		if k != "" {
			dsnKey = &k
		}
	}
	row, err := s.repo.Create(ctx, id, code, name, plane, dsnKey)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Summary{}, ErrTenantCodeExists
		}
		s.log.Errorf("Create tenant: %v", err)
		return Summary{}, common.ErrInternal
	}
	return Summary{
		ID: row.ID, Code: row.Code, Name: row.Name, IsActive: row.IsActive,
		DataPlane: row.DataPlane, DatabaseDSNKey: row.DatabaseDSNKey,
	}, nil
}

type CreateTenantMemberRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3,max=50"`
	Password string `json:"password" validate:"required,min=6,max=100"`
	Role     string `json:"role" validate:"required,oneof=admin manager cashier"`
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateTenantRequest) (Summary, error) {
	if id == tenant.DefaultTenantID && !req.IsActive {
		return Summary{}, common.ErrBadRequest
	}
	name := strings.TrimSpace(req.Name)
	row, err := s.repo.Update(ctx, id, name, req.IsActive)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Summary{}, common.ErrNotFound
		}
		s.log.Errorf("Update tenant: %v", err)
		return Summary{}, common.ErrInternal
	}
	return Summary{
		ID: row.ID, Code: row.Code, Name: row.Name, IsActive: row.IsActive,
		DataPlane: row.DataPlane, DatabaseDSNKey: row.DatabaseDSNKey,
	}, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if id == tenant.DefaultTenantID {
		return common.ErrBadRequest
	}
	_, err := s.repo.GetByIDAny(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		return err
	}
	if err := s.repo.DeleteByID(ctx, id); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return fmt.Errorf("%w: tenant still has business data — deactivate instead", common.ErrBadRequest)
		}
		s.log.Errorf("Delete tenant: %v", err)
		return common.ErrInternal
	}
	return nil
}

func (s *Service) AddMemberToTenant(ctx context.Context, tenantID uuid.UUID, userID uuid.UUID, role user_repo.UserRole) error {
	if role == user_repo.UserRoleSuperAdmin {
		return common.ErrForbidden
	}
	roleStr := string(role)
	return s.repo.AddMember(ctx, tenantID, userID, &roleStr)
}
