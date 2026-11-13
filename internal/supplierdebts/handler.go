package supplierdebts

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ISupplierDebtHandler interface {
	ListHandler(c fiber.Ctx) error
	SummaryHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	CreateHandler(c fiber.Ctx) error
	PaymentHandler(c fiber.Ctx) error
	VoidHandler(c fiber.Ctx) error
}

type SupplierDebtHandler struct {
	service ISupplierDebtService
	log     logger.ILogger
}

func NewSupplierDebtHandler(service ISupplierDebtService, log logger.ILogger) ISupplierDebtHandler {
	return &SupplierDebtHandler{service: service, log: log}
}

func (h *SupplierDebtHandler) ListHandler(c fiber.Ctx) error {
	var req ListSupplierDebtsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list supplier debts"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: resp})
}

func (h *SupplierDebtHandler) SummaryHandler(c fiber.Ctx) error {
	resp, err := h.service.Summary(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch summary"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: resp})
}

func (h *SupplierDebtHandler) GetHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.Get(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch debt"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: resp})
}

func (h *SupplierDebtHandler) CreateHandler(c fiber.Ctx) error {
	var req CreateManualSupplierDebtRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	resp, err := h.service.CreateManual(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create debt"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Created", Data: resp})
}

func (h *SupplierDebtHandler) PaymentHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req RecordSupplierDebtPaymentRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid body"})
	}
	resp, err := h.service.RecordPayment(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		if errors.Is(err, common.ErrInvalidState) || errors.Is(err, common.ErrInvalidInput) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to record payment"})
	}
	return c.JSON(common.SuccessResponse{Message: "Payment recorded", Data: resp})
}

func (h *SupplierDebtHandler) VoidHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.Void(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Cannot void"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to void"})
	}
	return c.JSON(common.SuccessResponse{Message: "Voided", Data: resp})
}
