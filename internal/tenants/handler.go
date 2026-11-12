package tenants

import (
	"POS-kasir/internal/common"
	"POS-kasir/pkg/logger"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type Handler struct {
	repo *Repository
	log  logger.ILogger
}

func NewHandler(repo *Repository, log logger.ILogger) *Handler {
	return &Handler{repo: repo, log: log}
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
