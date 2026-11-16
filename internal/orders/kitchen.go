package orders

import (
	"context"
	"errors"
	"time"

	"dinosaurus-pos/internal/common"
	orders_repo "dinosaurus-pos/internal/orders/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type KitchenTicketResponse struct {
	ID            uuid.UUID  `json:"id"`
	OrderNo       string     `json:"order_no"`
	KitchenStatus string     `json:"kitchen_status"`
	OrderStatus   string     `json:"order_status"`
	CreatedAt     time.Time  `json:"created_at"`
	DiningTableID *uuid.UUID `json:"dining_table_id,omitempty"`
	TableName     *string    `json:"table_name,omitempty"`
}

type UpdateKitchenStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=pending preparing ready served"`
}

func (s *OrderService) ListKitchenTickets(ctx context.Context) ([]KitchenTicketResponse, error) {
	rows, err := s.ordersRepo.ListKitchenTickets(ctx, 100)
	if err != nil {
		return nil, err
	}
	out := make([]KitchenTicketResponse, 0, len(rows))
	for _, r := range rows {
		var tableID *uuid.UUID
		if r.DiningTableID.Valid {
			id := uuid.UUID(r.DiningTableID.Bytes)
			tableID = &id
		}
		out = append(out, KitchenTicketResponse{
			ID:            r.ID,
			OrderNo:       r.OrderNo,
			KitchenStatus: string(r.KitchenStatus),
			OrderStatus:   string(r.OrderStatus),
			CreatedAt:     r.CreatedAt.Time,
			DiningTableID: tableID,
			TableName:     r.TableName,
		})
	}
	return out, nil
}

func (s *OrderService) UpdateKitchenStatus(ctx context.Context, orderID uuid.UUID, req UpdateKitchenStatusRequest) (*KitchenTicketResponse, error) {
	status := orders_repo.KitchenTicketStatus(req.Status)
	row, err := s.ordersRepo.UpdateOrderKitchenStatus(ctx, orders_repo.UpdateOrderKitchenStatusParams{
		ID: orderID, KitchenStatus: status,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return &KitchenTicketResponse{
		ID:            row.ID,
		OrderNo:       row.OrderNo,
		KitchenStatus: string(row.KitchenStatus),
		OrderStatus:   string(row.Status),
		CreatedAt:     row.CreatedAt.Time,
	}, nil
}