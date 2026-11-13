package customergroups

import (
	"context"
	"errors"
	"strings"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/customergroups/repository"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ICustomerGroupService interface {
	Create(ctx context.Context, req CreateCustomerGroupRequest) (*CustomerGroupResponse, error)
	Get(ctx context.Context, id uuid.UUID) (*CustomerGroupResponse, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateCustomerGroupRequest) (*CustomerGroupResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, req ListCustomerGroupsRequest) (*PagedCustomerGroupResponse, error)
	SeedDefaults(ctx context.Context, tenantID uuid.UUID) error
}

type Service struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewService(repo repository.Querier, log logger.ILogger) ICustomerGroupService {
	return &Service{repo: repo, log: log}
}

func (s *Service) SeedDefaults(ctx context.Context, tenantID uuid.UUID) error {
	ctx = tenant.WithID(ctx, tenantID)
	defaults := []struct {
		code, name, desc string
	}{
		{"RETAIL", "Khách lẻ", "Khách mua lẻ"},
		{"WHOLESALE", "Khách sỉ", "Khách mua sỉ"},
	}
	for _, d := range defaults {
		if err := s.repo.InsertCustomerGroupIfMissing(ctx, repository.InsertCustomerGroupIfMissingParams{
			TenantID:    tenantID,
			Code:        d.code,
			Name:        d.name,
			Description: d.desc,
		}); err != nil {
			s.log.Errorf("SeedDefaults customer group %s: %v", d.code, err)
			return err
		}
	}
	return nil
}

func (s *Service) Create(ctx context.Context, req CreateCustomerGroupRequest) (*CustomerGroupResponse, error) {
	row, err := s.repo.CreateCustomerGroup(ctx, repository.CreateCustomerGroupParams{
		Code:        strings.TrimSpace(req.Code),
		Name:        strings.TrimSpace(req.Name),
		Description: req.Description,
	})
	if err != nil {
		s.log.Errorf("CreateCustomerGroup failed", "error", err)
		return nil, err
	}
	return mapGroup(row), nil
}

func (s *Service) Get(ctx context.Context, id uuid.UUID) (*CustomerGroupResponse, error) {
	row, err := s.repo.GetCustomerGroupByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapGroup(row), nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateCustomerGroupRequest) (*CustomerGroupResponse, error) {
	row, err := s.repo.UpdateCustomerGroup(ctx, repository.UpdateCustomerGroupParams{
		ID:          id,
		Code:        strings.TrimSpace(req.Code),
		Name:        strings.TrimSpace(req.Name),
		Description: req.Description,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		s.log.Errorf("UpdateCustomerGroup failed", "error", err)
		return nil, err
	}
	return mapGroup(row), nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.repo.DeleteCustomerGroup(ctx, id)
	if err != nil {
		s.log.Errorf("DeleteCustomerGroup failed", "error", err)
		return err
	}
	return nil
}

func (s *Service) List(ctx context.Context, req ListCustomerGroupsRequest) (*PagedCustomerGroupResponse, error) {
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit
	var search *string
	if q := strings.TrimSpace(req.Search); q != "" {
		search = &q
	}
	rows, err := s.repo.ListCustomerGroups(ctx, repository.ListCustomerGroupsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
		Search: search,
	})
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountCustomerGroups(ctx, search)
	if err != nil {
		return nil, err
	}
	var out []CustomerGroupResponse
	for _, r := range rows {
		out = append(out, *mapGroup(r))
	}
	return &PagedCustomerGroupResponse{
		Groups:     out,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

func mapGroup(g repository.CustomerGroup) *CustomerGroupResponse {
	return &CustomerGroupResponse{
		ID:          g.ID,
		Code:        g.Code,
		Name:        g.Name,
		Description: g.Description,
		CreatedAt:   g.CreatedAt.Time,
		UpdatedAt:   g.UpdatedAt.Time,
	}
}
