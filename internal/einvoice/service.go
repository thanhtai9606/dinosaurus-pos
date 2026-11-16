package einvoice

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"dinosaurus-pos/internal/common"
	ei_repo "dinosaurus-pos/internal/einvoice/repository"
	orders_repo "dinosaurus-pos/internal/orders/repository"
	"dinosaurus-pos/internal/settings"
	"dinosaurus-pos/pkg/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IService interface {
	IssueForOrder(ctx context.Context, orderID uuid.UUID, req IssueEInvoiceRequest) (*EInvoiceResponse, error)
	GetByOrder(ctx context.Context, orderID uuid.UUID) (*EInvoiceResponse, error)
}

type Service struct {
	repo     *ei_repo.Queries
	orders   *orders_repo.Queries
	settings settings.ISettingsService
	log      logger.ILogger
}

func NewService(repo *ei_repo.Queries, orders *orders_repo.Queries, settings settings.ISettingsService, log logger.ILogger) IService {
	return &Service{repo: repo, orders: orders, settings: settings, log: log}
}

func (s *Service) GetByOrder(ctx context.Context, orderID uuid.UUID) (*EInvoiceResponse, error) {
	row, err := s.repo.GetEInvoiceByOrderID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	return mapRow(row), nil
}

func (s *Service) IssueForOrder(ctx context.Context, orderID uuid.UUID, req IssueEInvoiceRequest) (*EInvoiceResponse, error) {
	if existing, err := s.repo.GetEInvoiceByOrderID(ctx, orderID); err == nil {
		return mapRow(existing), nil
	}
	order, err := s.orders.GetOrderHeaderByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, common.ErrNotFound
		}
		return nil, err
	}
	if order.Status != orders_repo.OrderStatusPaid {
		return nil, fmt.Errorf("%w: order must be paid", common.ErrInvalidState)
	}
	invSettings, err := s.settings.GetInvoiceSettings(ctx)
	if err != nil {
		return nil, err
	}
	count, err := s.repo.CountEInvoices(ctx)
	if err != nil {
		return nil, err
	}
	prefix := invSettings.InvoicePrefix
	if prefix == "" {
		prefix = "HD"
	}
	invoiceNo := fmt.Sprintf("%s-%s-%06d", prefix, time.Now().Format("200601"), count+1)
	payload, _ := json.Marshal(map[string]interface{}{
		"order_no":   order.OrderNo,
		"net_total":  order.NetTotal,
		"issued_via": "dinosaurus-pos-mvp",
	})
	row, err := s.repo.CreateEInvoice(ctx, ei_repo.CreateEInvoiceParams{
		OrderID:       orderID,
		InvoiceNo:     invoiceNo,
		BuyerName:     req.BuyerName,
		BuyerTaxCode:  req.BuyerTaxCode,
		TotalAmount:   order.NetTotal,
		Status:        "issued",
		PayloadJson:   payload,
	})
	if err != nil {
		return nil, err
	}
	return mapRow(row), nil
}

func mapRow(row ei_repo.EInvoice) *EInvoiceResponse {
	return &EInvoiceResponse{
		ID:           row.ID,
		OrderID:      row.OrderID,
		InvoiceNo:    row.InvoiceNo,
		BuyerName:    row.BuyerName,
		BuyerTaxCode: row.BuyerTaxCode,
		TotalAmount:  row.TotalAmount,
		Status:       row.Status,
		IssuedAt:     row.IssuedAt.Time,
		PayloadJSON:  row.PayloadJson,
	}
}