package customerdebts

import (
	"errors"

	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"
	"POS-kasir/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ICustomerDebtHandler interface {
	ListHandler(c fiber.Ctx) error
	SummaryHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	CreateHandler(c fiber.Ctx) error
	PaymentHandler(c fiber.Ctx) error
	VoidHandler(c fiber.Ctx) error
}

type CustomerDebtHandler struct {
	service ICustomerDebtService
	log     logger.ILogger
}

func NewCustomerDebtHandler(service ICustomerDebtService, log logger.ILogger) ICustomerDebtHandler {
	return &CustomerDebtHandler{service: service, log: log}
}

func (h *CustomerDebtHandler) ListHandler(c fiber.Ctx) error {
	var req ListCustomerDebtsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list customer debts"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: resp})
}

func (h *CustomerDebtHandler) SummaryHandler(c fiber.Ctx) error {
	resp, err := h.service.Summary(c.RequestCtx())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch summary"})
	}
	return c.JSON(common.SuccessResponse{Message: "OK", Data: resp})
}

func (h *CustomerDebtHandler) GetHandler(c fiber.Ctx) error {
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

func (h *CustomerDebtHandler) CreateHandler(c fiber.Ctx) error {
	var req CreateManualCustomerDebtRequest
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

func (h *CustomerDebtHandler) PaymentHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req RecordCustomerDebtPaymentRequest
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

func (h *CustomerDebtHandler) VoidHandler(c fiber.Ctx) error {
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
