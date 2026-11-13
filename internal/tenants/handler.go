package tenants

import (
	"errors"

	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type Handler struct {
	repo    *Repository
	service *Service
	log     logger.ILogger
}

func NewHandler(repo *Repository, log logger.ILogger) *Handler {
	return &Handler{repo: repo, service: NewService(repo, log), log: log}
}

func (h *Handler) ListMine(c fiber.Ctx) error {
	userVal := c.Locals("user_id")
	userID, ok := userVal.(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{Message: "unauthorized"})
	}
	rows, err := h.repo.ListForUser(c.RequestCtx(), userID)
	if err != nil {
		h.log.Errorf("ListMine tenants: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to list tenants"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: Summaries(rows)})
}

func (h *Handler) ListAll(c fiber.Ctx) error {
	rows, err := h.repo.ListAll(c.RequestCtx())
	if err != nil {
		h.log.Errorf("ListAll tenants: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to list tenants"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: Summaries(rows)})
}

func (h *Handler) Create(c fiber.Ctx) error {
	var req CreateTenantRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid request"})
	}
	summary, err := h.service.Create(c.RequestCtx(), req)
	if err != nil {
		if errors.Is(err, ErrTenantCodeExists) {
			return c.Status(fiber.StatusConflict).JSON(common.ErrorResponse{Message: "tenant code already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to create tenant"})
	}
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "tenant created", Data: summary})
}

func (h *Handler) Update(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	var req UpdateTenantRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid request"})
	}
	summary, err := h.service.Update(c.RequestCtx(), id, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
		}
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "cannot deactivate default tenant"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to update tenant"})
	}
	return c.JSON(common.SuccessResponse{Message: "tenant updated", Data: summary})
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	if err := h.service.Delete(c.RequestCtx(), id); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
		}
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{
				Message: err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to delete tenant"})
	}
	return c.JSON(common.SuccessResponse{Message: "tenant deleted"})
}
