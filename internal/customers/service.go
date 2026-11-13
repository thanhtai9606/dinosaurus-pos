package customers

import (
	"context"
	"errors"
	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/common/pagination"
	"dinosaurus-pos/internal/customers/repository"
	"dinosaurus-pos/internal/docno"
	"dinosaurus-pos/pkg/logger"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func uuidPtrToPg(u *uuid.UUID) pgtype.UUID {
	if u == nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: *u, Valid: true}
}

func pgUUIDToPtr(p pgtype.UUID) *uuid.UUID {
	if !p.Valid {
		return nil
	}
	id := uuid.UUID(p.Bytes)
	return &id
}

type ICustomerService interface {
	CreateCustomer(ctx context.Context, req CreateCustomerRequest) (*CustomerResponse, error)
	GetCustomer(ctx context.Context, id uuid.UUID) (*CustomerResponse, error)
	UpdateCustomer(ctx context.Context, id uuid.UUID, req UpdateCustomerRequest) (*CustomerResponse, error)
	DeleteCustomer(ctx context.Context, id uuid.UUID) error
	ListCustomers(ctx context.Context, req ListCustomersRequest) (*PagedCustomerResponse, error)
}

type CustomerService struct {
	repo repository.Querier
	log  logger.ILogger
}

func NewCustomerService(repo repository.Querier, log logger.ILogger) ICustomerService {
	return &CustomerService{repo: repo, log: log}
}

func (s *CustomerService) CreateCustomer(ctx context.Context, req CreateCustomerRequest) (*CustomerResponse, error) {
	count, err := s.repo.CountCustomersForCode(ctx)
	if err != nil {
		s.log.Errorf("CountCustomersForCode failed", "error", err)
		return nil, err
	}
	cust, err := s.repo.CreateCustomer(ctx, repository.CreateCustomerParams{
		Name:            req.Name,
		Phone:           req.Phone,
		Email:           req.Email,
		Address:         req.Address,
		Code:            docno.CustomerCode(count + 1),
		CustomerGroupID: uuidPtrToPg(req.CustomerGroupID),
	})
	if err != nil {
		s.log.Errorf("CreateCustomer failed", "error", err)
		return nil, err
	}
	return s.GetCustomer(ctx, cust.ID)
}

func (s *CustomerService) GetCustomer(ctx context.Context, id uuid.UUID) (*CustomerResponse, error) {
	cust, err := s.repo.GetCustomerByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapGetRowToCustomerResponse(cust), nil
}

func (s *CustomerService) UpdateCustomer(ctx context.Context, id uuid.UUID, req UpdateCustomerRequest) (*CustomerResponse, error) {
	_, err := s.repo.UpdateCustomer(ctx, repository.UpdateCustomerParams{
		ID:              id,
		Name:            req.Name,
		Phone:           req.Phone,
		Email:           req.Email,
		Address:         req.Address,
		CustomerGroupID: uuidPtrToPg(req.CustomerGroupID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		s.log.Errorf("UpdateCustomer failed", "error", err)
		return nil, err
	}
	return s.GetCustomer(ctx, id)
}

func (s *CustomerService) DeleteCustomer(ctx context.Context, id uuid.UUID) error {
	err := s.repo.DeleteCustomer(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return common.ErrNotFound
		}
		s.log.Errorf("DeleteCustomer failed", "error", err)
		return err
	}
	return nil
}

func (s *CustomerService) ListCustomers(ctx context.Context, req ListCustomersRequest) (*PagedCustomerResponse, error) {
	req.SetDefaults()
	limit := req.Limit
	offset := (req.Page - 1) * limit

	var searchPtr *string
	if q := strings.TrimSpace(req.Search); q != "" {
		searchPtr = &q
	}
	var groupID *uuid.UUID
	if g := strings.TrimSpace(req.GroupID); g != "" {
		parsed, err := uuid.Parse(g)
		if err != nil {
			return nil, common.ErrBadRequest
		}
		groupID = &parsed
	}
	custs, err := s.repo.ListCustomers(ctx, repository.ListCustomersParams{
		Limit:   int32(limit),
		Offset:  int32(offset),
		Search:  searchPtr,
		GroupID: uuidPtrToPg(groupID),
	})
	if err != nil {
		s.log.Errorf("ListCustomers failed", "error", err)
		return nil, err
	}

	count, err := s.repo.CountCustomers(ctx, repository.CountCustomersParams{
		Search:  searchPtr,
		GroupID: uuidPtrToPg(groupID),
	})
	if err != nil {
		s.log.Errorf("CountCustomers failed", "error", err)
		return nil, err
	}

	var responses []CustomerResponse
	for _, c := range custs {
		responses = append(responses, *mapListRowToCustomerResponse(c))
	}

	return &PagedCustomerResponse{
		Customers: responses,
		Pagination: pagination.BuildPagination(req.Page, int(count), limit),
	}, nil
}

func mapListRowToCustomerResponse(c repository.ListCustomersRow) *CustomerResponse {
	return &CustomerResponse{
		ID:                c.ID,
		Code:              c.Code,
		Name:              c.Name,
		Phone:             c.Phone,
		Email:             c.Email,
		Address:           c.Address,
		CustomerGroupID:   pgUUIDToPtr(c.CustomerGroupID),
		CustomerGroupName: c.CustomerGroupName,
		CreatedAt:         c.CreatedAt.Time,
		UpdatedAt:         c.UpdatedAt.Time,
	}
}

func mapGetRowToCustomerResponse(c repository.GetCustomerByIDRow) *CustomerResponse {
	return &CustomerResponse{
		ID:                c.ID,
		Code:              c.Code,
		Name:              c.Name,
		Phone:             c.Phone,
		Email:             c.Email,
		Address:           c.Address,
		CustomerGroupID:   pgUUIDToPtr(c.CustomerGroupID),
		CustomerGroupName: c.CustomerGroupName,
		CreatedAt:         c.CreatedAt.Time,
		UpdatedAt:         c.UpdatedAt.Time,
	}
}
