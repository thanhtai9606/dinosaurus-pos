package suppliers

import (
	"errors"

	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"
	"POS-kasir/pkg/validator"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ISupplierHandler interface {
	CreateSupplierHandler(c fiber.Ctx) error
	GetSupplierHandler(c fiber.Ctx) error
	UpdateSupplierHandler(c fiber.Ctx) error
	DeleteSupplierHandler(c fiber.Ctx) error
	ListSuppliersHandler(c fiber.Ctx) error
}

type SupplierHandler struct {
	service ISupplierService
	log     logger.ILogger
}

func NewSupplierHandler(service ISupplierService, log logger.ILogger) ISupplierHandler {
	return &SupplierHandler{service: service, log: log}
}

// @Summary      Create a supplier
// @Tags         Suppliers
// @Accept       json
// @Produce      json
// @Param        request body CreateSupplierRequest true "Supplier details"
// @Success      201 {object} common.SuccessResponse{data=SupplierResponse}
// @x-roles      ["admin", "manager"]
// @Router       /suppliers [post]
func (h *SupplierHandler) CreateSupplierHandler(c fiber.Ctx) error {
	var req CreateSupplierRequest
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

	resp, err := h.service.CreateSupplier(c.RequestCtx(), req)
	if err != nil {
		h.log.Errorf("CreateSupplier failed", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to create supplier"})
	}

	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{
		Message: "Supplier created successfully",
		Data:    resp,
	})
}

// @Summary      Get a supplier
// @Tags         Suppliers
// @Param        id path string true "Supplier ID"
// @Success      200 {object} common.SuccessResponse{data=SupplierResponse}
// @x-roles      ["admin", "manager"]
// @Router       /suppliers/{id} [get]
func (h *SupplierHandler) GetSupplierHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	resp, err := h.service.GetSupplier(c.RequestCtx(), id)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Supplier not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to fetch supplier"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Supplier retrieved successfully",
		Data:    resp,
	})
}

// @Summary      Update a supplier
// @Tags         Suppliers
// @Param        id path string true "Supplier ID"
// @Param        request body UpdateSupplierRequest true "Supplier details"
// @Success      200 {object} common.SuccessResponse{data=SupplierResponse}
// @x-roles      ["admin", "manager"]
// @Router       /suppliers/{id} [put]
func (h *SupplierHandler) UpdateSupplierHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	var req UpdateSupplierRequest
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

	resp, err := h.service.UpdateSupplier(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "Supplier not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to update supplier"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Supplier updated successfully",
		Data:    resp,
	})
}

// @Summary      Delete a supplier
// @Tags         Suppliers
// @Param        id path string true "Supplier ID"
// @Success      200 {object} common.SuccessResponse
// @x-roles      ["admin"]
// @Router       /suppliers/{id} [delete]
func (h *SupplierHandler) DeleteSupplierHandler(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid ID format"})
	}

	if err := h.service.DeleteSupplier(c.RequestCtx(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to delete supplier"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{Message: "Supplier deleted successfully"})
}

// @Summary      List suppliers
// @Tags         Suppliers
// @Param        page query int false "Page"
// @Param        limit query int false "Limit"
// @Param        search query string false "Search"
// @Success      200 {object} common.SuccessResponse{data=PagedSupplierResponse}
// @x-roles      ["admin", "manager"]
// @Router       /suppliers [get]
func (h *SupplierHandler) ListSuppliersHandler(c fiber.Ctx) error {
	var req ListSuppliersRequest
	if err := c.Bind().Query(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "Invalid query parameters"})
	}

	resp, err := h.service.ListSuppliers(c.RequestCtx(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "Failed to list suppliers"})
	}

	return c.Status(fiber.StatusOK).JSON(common.SuccessResponse{
		Message: "Suppliers retrieved successfully",
		Data:    resp,
	})
}
