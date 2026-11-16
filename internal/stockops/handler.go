package stockops

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/pkg/logger"
	"dinosaurus-pos/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type IHandler interface {
	ListAdjustmentsHandler(c fiber.Ctx) error
	CreateAdjustmentHandler(c fiber.Ctx) error
	GetAdjustmentHandler(c fiber.Ctx) error
	UpdateAdjustmentHandler(c fiber.Ctx) error
	CompleteAdjustmentHandler(c fiber.Ctx) error

	ListTransfersHandler(c fiber.Ctx) error
	CreateTransferHandler(c fiber.Ctx) error
	GetTransferHandler(c fiber.Ctx) error
	UpdateTransferHandler(c fiber.Ctx) error
	CompleteTransferHandler(c fiber.Ctx) error

	ListStockTakesHandler(c fiber.Ctx) error
	CreateStockTakeHandler(c fiber.Ctx) error
	GetStockTakeHandler(c fiber.Ctx) error
	UpdateStockTakeHandler(c fiber.Ctx) error
	PostStockTakeHandler(c fiber.Ctx) error

	ListStockMovementsHandler(c fiber.Ctx) error
}

type Handler struct {
	service IService
	log     logger.ILogger
}

func NewHandler(service IService, log logger.ILogger) IHandler {
	return &Handler{service: service, log: log}
}

func parseID(c fiber.Ctx) (uuid.UUID, error) {
	return uuid.Parse(c.Params("id"))
}

func handleServiceErr(c fiber.Ctx, err error, notFoundMsg string) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, common.ErrNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: notFoundMsg})
	}
	if errors.Is(err, common.ErrInvalidState) || errors.Is(err, common.ErrInvalidInput) {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
	}
	if errors.Is(err, common.ErrUnauthorized) {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "Unauthorized"})
	}
	return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Request failed"})
}

// @Summary      List stock adjustments
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-adjustments [get]
func (h *Handler) ListAdjustmentsHandler(c fiber.Ctx) error {
	var req ListAdjustmentsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.ListAdjustments(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create stock adjustment
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-adjustments [post]
func (h *Handler) CreateAdjustmentHandler(c fiber.Ctx) error {
	var req CreateAdjustmentRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.CreateAdjustment(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Adjustment created", Data: resp})
}

// @Summary      Get stock adjustment
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-adjustments/{id} [get]
func (h *Handler) GetAdjustmentHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.GetAdjustment(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Adjustment not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update stock adjustment draft
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-adjustments/{id} [put]
func (h *Handler) UpdateAdjustmentHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req UpdateAdjustmentRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.UpdateAdjustment(c.RequestCtx(), id, req)
	if err != nil {
		return handleServiceErr(c, err, "Adjustment not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Adjustment updated", Data: resp})
}

// @Summary      Complete stock adjustment
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-adjustments/{id}/complete [post]
func (h *Handler) CompleteAdjustmentHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.CompleteAdjustment(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Adjustment not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Adjustment completed", Data: resp})
}

// @Summary      List stock transfers
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-transfers [get]
func (h *Handler) ListTransfersHandler(c fiber.Ctx) error {
	var req ListTransfersRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.ListTransfers(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create stock transfer
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-transfers [post]
func (h *Handler) CreateTransferHandler(c fiber.Ctx) error {
	var req CreateTransferRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.CreateTransfer(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Transfer created", Data: resp})
}

// @Summary      Get stock transfer
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-transfers/{id} [get]
func (h *Handler) GetTransferHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.GetTransfer(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Transfer not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update stock transfer draft
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-transfers/{id} [put]
func (h *Handler) UpdateTransferHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req UpdateTransferRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.UpdateTransfer(c.RequestCtx(), id, req)
	if err != nil {
		return handleServiceErr(c, err, "Transfer not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Transfer updated", Data: resp})
}

// @Summary      Complete stock transfer
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-transfers/{id}/complete [post]
func (h *Handler) CompleteTransferHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.CompleteTransfer(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Transfer not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Transfer completed", Data: resp})
}

// @Summary      List stock takes
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-takes [get]
func (h *Handler) ListStockTakesHandler(c fiber.Ctx) error {
	var req ListStockTakesRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.ListStockTakes(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Create stock take
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-takes [post]
func (h *Handler) CreateStockTakeHandler(c fiber.Ctx) error {
	var req CreateStockTakeRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.CreateStockTake(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "Stock take created", Data: resp})
}

// @Summary      Get stock take
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-takes/{id} [get]
func (h *Handler) GetStockTakeHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.GetStockTake(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Stock take not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

// @Summary      Update stock take draft
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-takes/{id} [put]
func (h *Handler) UpdateStockTakeHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	var req UpdateStockTakeRequest
	if err := c.Bind().Body(&req); err != nil {
		return bindErr(c, err)
	}
	resp, err := h.service.UpdateStockTake(c.RequestCtx(), id, req)
	if err != nil {
		return handleServiceErr(c, err, "Stock take not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Stock take updated", Data: resp})
}

// @Summary      Post stock take
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-takes/{id}/post [post]
func (h *Handler) PostStockTakeHandler(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID"})
	}
	resp, err := h.service.PostStockTake(c.RequestCtx(), id)
	if err != nil {
		return handleServiceErr(c, err, "Stock take not found")
	}
	return c.JSON(common.SuccessResponse{Message: "Stock take posted", Data: resp})
}

// @Summary      List stock movements
// @Tags         StockOps
// @x-roles      ["admin", "manager"]
// @Router       /stock-movements [get]
func (h *Handler) ListStockMovementsHandler(c fiber.Ctx) error {
	var req ListStockMovementsRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}
	resp, err := h.service.ListStockMovements(c.RequestCtx(), req)
	if err != nil {
		return handleServiceErr(c, err, "not found")
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: resp})
}

func bindErr(c fiber.Ctx, err error) error {
	var ve *validator.ValidationErrors
	if errors.As(err, &ve) {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Validation failed", Error: ve.Error()})
	}
	return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid request body"})
}