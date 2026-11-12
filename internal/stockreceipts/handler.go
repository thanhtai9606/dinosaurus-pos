package stockreceipts

import (
	"errors"

	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"
	"POS-kasir/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IStockReceiptHandler interface {
	CreateHandler(c fiber.Ctx) error
	GetHandler(c fiber.Ctx) error
	ListHandler(c fiber.Ctx) error
	UpdateHandler(c fiber.Ctx) error
	CompleteHandler(c fiber.Ctx) error
	CancelHandler(c fiber.Ctx) error
	DeleteHandler(c fiber.Ctx) error
}

type StockReceiptHandler struct {
	service IStockReceiptService
	log     logger.ILogger
}

func NewStockReceiptHandler(service IStockReceiptService, log logger.ILogger) IStockReceiptHandler {
	return &StockReceiptHandler{service: service, log: log}
}

// @Summary      Create stock receipt draft
// @Tags         StockReceipts
// @Param        request body CreateStockReceiptRequest true "Receipt"
// @Success      201 {object} common.SuccessResponse{data=StockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts [post]
func (h *StockReceiptHandler) CreateHandler(c fiber.Ctx) error {
	var req CreateStockReceiptRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed",
				Error:   ve.Error(),
				Data:    map[string]interface{}{"errors": ve.Errors},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}

	resp, err := h.service.Create(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create stock receipt"})
	}

	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{
		Message: "Stock receipt created successfully",
		Data:    resp,
	})
}

// @Summary      Get stock receipt
// @Tags         StockReceipts
// @Param        id path string true "Receipt ID"
// @Success      200 {object} common.SuccessResponse{data=StockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts/{id} [get]
func (h *StockReceiptHandler) GetHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	resp, err := h.service.Get(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Stock receipt not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch stock receipt"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipt retrieved successfully",
		Data:    resp,
	})
}

// @Summary      List stock receipts
// @Tags         StockReceipts
// @Success      200 {object} common.SuccessResponse{data=PagedStockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts [get]
func (h *StockReceiptHandler) ListHandler(c fiber.Ctx) error {
	var req ListStockReceiptsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}

	resp, err := h.service.List(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list stock receipts"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipts retrieved successfully",
		Data:    resp,
	})
}

// @Summary      Update draft stock receipt
// @Tags         StockReceipts
// @Param        id path string true "Receipt ID"
// @Success      200 {object} common.SuccessResponse{data=StockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts/{id} [put]
func (h *StockReceiptHandler) UpdateHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	var req UpdateStockReceiptRequest
	if err := c.Bind().Body(&req); err != nil {
		var ve *validator.ValidationErrors
		if errors.As(err, &ve) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: "Validation failed",
				Error:   ve.Error(),
				Data:    map[string]interface{}{"errors": ve.Errors},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
	}

	resp, err := h.service.UpdateDraft(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Stock receipt not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Only draft receipts can be updated"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update stock receipt"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipt updated successfully",
		Data:    resp,
	})
}

// @Summary      Complete stock receipt
// @Tags         StockReceipts
// @Param        id path string true "Receipt ID"
// @Success      200 {object} common.SuccessResponse{data=StockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts/{id}/complete [post]
func (h *StockReceiptHandler) CompleteHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	resp, err := h.service.Complete(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Stock receipt not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Receipt cannot be completed in current status"})
		}
		if errors.Is(err, common.ErrInvalidInput) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Receipt must have at least one line item"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to complete stock receipt"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipt completed successfully",
		Data:    resp,
	})
}

// @Summary      Cancel draft stock receipt
// @Tags         StockReceipts
// @Param        id path string true "Receipt ID"
// @Success      200 {object} common.SuccessResponse{data=StockReceiptResponse}
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts/{id}/cancel [post]
func (h *StockReceiptHandler) CancelHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	resp, err := h.service.Cancel(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Stock receipt not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Only draft receipts can be cancelled"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to cancel stock receipt"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipt cancelled successfully",
		Data:    resp,
	})
}

// @Summary      Delete draft or cancelled stock receipt
// @Tags         StockReceipts
// @Param        id path string true "Receipt ID"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin", "manager"]
// @Router       /stock-receipts/{id} [delete]
func (h *StockReceiptHandler) DeleteHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	if err := h.service.Delete(c.RequestCtx(), id); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Stock receipt not found"})
		}
		if errors.Is(err, common.ErrInvalidState) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "Only draft or cancelled receipts can be deleted"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete stock receipt"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Stock receipt deleted successfully",
	})
}
