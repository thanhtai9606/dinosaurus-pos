package einvoice

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	IssueHandler(c fiber.Ctx) error
	GetByOrderHandler(c fiber.Ctx) error
}

type Handler struct {
	service IService
	log     logger.ILogger
}

func NewHandler(service IService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

func (h *Handler) IssueHandler(c fiber.Ctx) error {
	orderID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid order id"})
	}
	var req IssueEInvoiceRequest
	_ = c.Bind().Body(&req)
	data, err := h.service.IssueForOrder(c.RequestCtx(), orderID, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Order not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to issue e-invoice"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Issued", Data: data})
}

func (h *Handler) GetByOrderHandler(c fiber.Ctx) error {
	orderID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid order id"})
	}
	data, err := h.service.GetByOrder(c.RequestCtx(), orderID)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to load e-invoice"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: data})
}