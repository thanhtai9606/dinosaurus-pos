package tenants

import (
	"context"
	"errors"
	"strings"

	"POS-kasir/internal/common"
	user_repo "POS-kasir/internal/user/repository"
	"POS-kasir/pkg/logger"

	"github.com/google/uuid"
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
	Code string `json:"code" validate:"required,min=2,max=32"`
	Name string `json:"name" validate:"required,min=2,max=150"`
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
	row, err := s.repo.Create(ctx, id, code, name)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Summary{}, ErrTenantCodeExists
		}
		s.log.Errorf("Create tenant: %v", err)
		return Summary{}, common.ErrInternal
	}
	return Summary{ID: row.ID, Code: row.Code, Name: row.Name}, nil
}

type CreateTenantMemberRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3,max=50"`
	Password string `json:"password" validate:"required,min=6,max=100"`
	Role     string `json:"role" validate:"required,oneof=admin manager cashier"`
}

func (s *Service) AddMemberToTenant(ctx context.Context, tenantID uuid.UUID, userID uuid.UUID, role user_repo.UserRole) error {
	if role == user_repo.UserRoleSuperAdmin {
		return common.ErrForbidden
	}
	roleStr := string(role)
	return s.repo.AddMember(ctx, tenantID, userID, &roleStr)
}
