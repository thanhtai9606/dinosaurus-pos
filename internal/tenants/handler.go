package tenants

import (
	"errors"

	"dinosaurus-pos/internal/common"
	"dinosaurus-pos/internal/platformaudit"
	"dinosaurus-pos/internal/tenant"
	"dinosaurus-pos/pkg/database/seeder/catalog"
	"dinosaurus-pos/pkg/logger"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	repo          *Repository
	service       *Service
	log           logger.ILogger
	audit         platformaudit.Recorder
	lookupCache   *LookupCache
	overviewCache overviewCacheInvalidator
}

type overviewCacheInvalidator interface {
	Invalidate()
}

func NewHandler(
	repo *Repository,
	service *Service,
	log logger.ILogger,
	audit platformaudit.Recorder,
	lookupCache *LookupCache,
	overviewCache overviewCacheInvalidator,
) *Handler {
	return &Handler{
		repo:          repo,
		service:       service,
		log:           log,
		audit:         audit,
		lookupCache:   lookupCache,
		overviewCache: overviewCache,
	}
}

func (h *Handler) bustPlatformCaches(code string) {
	if h.lookupCache != nil {
		h.lookupCache.InvalidateCode(code)
	}
	if h.overviewCache != nil {
		h.overviewCache.Invalidate()
	}
}

func (h *Handler) recordPlatform(c fiber.Ctx, action, resourceType, resourceID string, details map[string]any) {
	if h.audit == nil {
		return
	}
	actor, ok := c.Locals("user_id").(uuid.UUID)
	if !ok {
		return
	}
	if err := h.audit.Record(c.RequestCtx(), actor, action, resourceType, resourceID, details); err != nil {
		h.log.Warnf("platform audit: %v", err)
	}
}

// LookupByCode checks that an active tenant exists (public, for login).
func (h *Handler) LookupByCode(c fiber.Ctx) error {
	code, err := tenant.NormalizeCode(c.Query("code"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant code"})
	}
	ctx := c.RequestCtx()
	if h.lookupCache != nil {
		if cached, hit := h.lookupCache.Get(ctx, code); hit {
			if cached == nil {
				return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
			}
			return c.JSON(common.SuccessResponse{
				Message: "ok",
				Data:    map[string]string{"code": cached.Code, "name": cached.Name},
			})
		}
	}
	row, err := h.repo.GetByCode(ctx, code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			if h.lookupCache != nil {
				h.lookupCache.SetMiss(ctx, code)
			}
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
		}
		h.log.Errorf("LookupByCode: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "tenant lookup failed"})
	}
	res := LookupCacheFromTenantRow(row.Code, row.Name)
	if h.lookupCache != nil {
		h.lookupCache.SetHit(ctx, code, res)
	}
	return c.JSON(common.SuccessResponse{
		Message: "ok",
		Data:    map[string]string{"code": row.Code, "name": row.Name},
	})
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

func (h *Handler) OnboardingOptions(c fiber.Ctx) error {
	market := c.Query("market", "vn")
	return c.JSON(common.SuccessResponse{
		Message: "ok",
		Data:    catalog.OnboardingOptions(market),
	})
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
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to create tenant"})
	}
	if actorID, ok := c.Locals("user_id").(uuid.UUID); ok {
		h.log.Infof("audit: tenant_create actor=%s code=%s data_plane=%s", actorID, summary.Code, summary.DataPlane)
	}
	h.recordPlatform(c, "tenant_create", "tenant", summary.ID.String(), map[string]any{
		"code": summary.Code, "data_plane": summary.DataPlane,
	})
	h.bustPlatformCaches(summary.Code)
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
	if actorID, ok := c.Locals("user_id").(uuid.UUID); ok {
		h.log.Infof("audit: tenant_update actor=%s tenant_id=%s active=%v", actorID, summary.ID, summary.IsActive)
	}
	h.recordPlatform(c, "tenant_update", "tenant", summary.ID.String(), map[string]any{
		"code": summary.Code, "is_active": summary.IsActive,
	})
	h.bustPlatformCaches(summary.Code)
	return c.JSON(common.SuccessResponse{Message: "tenant updated", Data: summary})
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	ctx := c.RequestCtx()
	var deleteCode string
	if row, err := h.repo.GetByIDAny(ctx, id); err == nil {
		deleteCode = row.Code
	}
	if err := h.service.Delete(ctx, id); err != nil {
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
	if actorID, ok := c.Locals("user_id").(uuid.UUID); ok {
		h.log.Infof("audit: tenant_delete actor=%s tenant_id=%s", actorID, id)
	}
	h.recordPlatform(c, "tenant_delete", "tenant", id.String(), nil)
	if deleteCode != "" {
		h.bustPlatformCaches(deleteCode)
	}
	return c.JSON(common.SuccessResponse{Message: "tenant deleted"})
}

func (h *Handler) ListMembers(c fiber.Ctx) error {
	tenantID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	rows, err := h.service.ListMembers(c.RequestCtx(), tenantID)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to list members"})
	}
	return c.JSON(common.SuccessResponse{Message: "ok", Data: rows})
}

func (h *Handler) CreateMember(c fiber.Ctx) error {
	tenantID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	var req CreateTenantMemberRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid request"})
	}
	member, err := h.service.CreateMember(c.RequestCtx(), tenantID, req)
	if err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "tenant not found"})
		}
		if errors.Is(err, common.ErrBadRequest) {
			return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "user not found for email"})
		}
		if errors.Is(err, common.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(common.ErrorResponse{Message: "forbidden"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to add member"})
	}
	h.recordPlatform(c, "tenant_member_create", "tenant", tenantID.String(), map[string]any{
		"user_id": member.UserID.String(), "email": member.Email,
	})
	return c.Status(fiber.StatusCreated).JSON(common.SuccessResponse{Message: "member added", Data: member})
}

func (h *Handler) UpdateMember(c fiber.Ctx) error {
	tenantID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid user id"})
	}
	var req UpdateMemberRoleRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid request"})
	}
	if err := h.service.UpdateMemberRole(c.RequestCtx(), tenantID, userID, req.Role); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "member not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to update member"})
	}
	return c.JSON(common.SuccessResponse{Message: "member updated"})
}

func (h *Handler) RemoveMember(c fiber.Ctx) error {
	tenantID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid tenant id"})
	}
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(common.ErrorResponse{Message: "invalid user id"})
	}
	if err := h.service.RemoveMember(c.RequestCtx(), tenantID, userID); err != nil {
		if errors.Is(err, common.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(common.ErrorResponse{Message: "member not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(common.ErrorResponse{Message: "failed to remove member"})
	}
	h.recordPlatform(c, "tenant_member_remove", "tenant", tenantID.String(), map[string]any{"user_id": userID.String()})
	return c.JSON(common.SuccessResponse{Message: "member removed"})
}
