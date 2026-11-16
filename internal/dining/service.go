package dining

import (
	"context"
	"errors"

	"dinosaurus-pos/internal/common"
	dining_repo "dinosaurus-pos/internal/dining/repository"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IService interface {
	ListAreas(ctx context.Context) ([]DiningAreaResponse, error)
	ListTables(ctx context.Context) ([]DiningTableResponse, error)
	CreateTable(ctx context.Context, req CreateDiningTableRequest) (*DiningTableResponse, error)
	UpdateTableStatus(ctx context.Context, id uuid.UUID, req UpdateTableStatusRequest) (*DiningTableResponse, error)
}

type Service struct {
	repo *dining_repo.Queries
	log  logger.ILogger
}

func NewService(repo *dining_repo.Queries, log logger.ILogger) IService {
	return &Service{repo: repo, log: log}
}

func (s *Service) ListAreas(ctx context.Context) ([]DiningAreaResponse, error) {
	rows, err := s.repo.ListDiningAreas(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]DiningAreaResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, DiningAreaResponse{
			ID: r.ID, Name: r.Name, SortOrder: int(r.SortOrder), CreatedAt: r.CreatedAt.Time,
		})
	}
	return out, nil
}

func (s *Service) ListTables(ctx context.Context) ([]DiningTableResponse, error) {
	rows, err := s.repo.ListDiningTables(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]DiningTableResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, DiningTableResponse{
			ID: r.ID, AreaID: r.AreaID, AreaName: r.AreaName, Name: r.Name,
			Capacity: int(r.Capacity), Status: string(r.Status), CreatedAt: r.CreatedAt.Time,
		})
	}
	return out, nil
}

func (s *Service) CreateTable(ctx context.Context, req CreateDiningTableRequest) (*DiningTableResponse, error) {
	row, err := s.repo.CreateDiningTable(ctx, dining_repo.CreateDiningTableParams{
		AreaID:   req.AreaID,
		Name:     req.Name,
		Capacity: int32(req.Capacity),
		Status:   dining_repo.DiningTableStatusAvailable,
	})
	if err != nil {
		return nil, err
	}
	return &DiningTableResponse{
		ID: row.ID, AreaID: row.AreaID, Name: row.Name, Capacity: int(row.Capacity),
		Status: string(row.Status), CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) UpdateTableStatus(ctx context.Context, id uuid.UUID, req UpdateTableStatusRequest) (*DiningTableResponse, error) {
	status := dining_repo.DiningTableStatus(req.Status)
	row, err := s.repo.UpdateDiningTableStatus(ctx, dining_repo.UpdateDiningTableStatusParams{
		ID: id, Status: status,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return &DiningTableResponse{
		ID: row.ID, AreaID: row.AreaID, Name: row.Name, Capacity: int(row.Capacity),
		Status: string(row.Status), CreatedAt: row.CreatedAt.Time,
	}, nil
}