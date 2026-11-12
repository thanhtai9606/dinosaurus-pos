package middleware

import (
	"POS-kasir/internal/common"
	"POS-kasir/internal/tenant"
	"POS-kasir/pkg/logger"

	"POS-kasir/pkg/utils"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func AuthMiddleware(tokenManager utils.Manager, log logger.ILogger) fiber.Handler {
	return func(c fiber.Ctx) error {
		token := c.Cookies("access_token")
		if token == "" {
			log.Warnf("unauthorized access attempt: no token provided")
			return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{
				Message: "unauthorized",
			})
		}

		claims, err := tokenManager.VerifyToken(token)
		if err != nil {
			log.Warnf("unauthorized access attempt: invalid token - %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(common.ErrorResponse{
				Message: "unauthorized",
			})
		}
		c.Locals("user", claims.Username)
		c.Locals("role", UserRole(claims.Role))
		c.Locals("email", claims.Email)
		c.Locals("user_id", claims.UserID)

		log.Infof("current user is %v, role is %v, email is %v, user ID is %v", claims.Username, claims.Role, claims.Email, claims.UserID)

		c.RequestCtx().SetUserValue(common.UserIDKey, claims.UserID)

		tenantID := claims.TenantID
		if tenantID == uuid.Nil {
			tenantID = tenant.DefaultTenantID
		}
		c.Locals("tenant_id", tenantID)
		c.RequestCtx().SetUserValue(common.TenantIDKey, tenantID)

		return c.Next()
	}
}
