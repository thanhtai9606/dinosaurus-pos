package middleware

import (
	"github.com/gofiber/fiber/v3"
)

// SuperAdminOnly restricts the route to users with the super_admin JWT role.
func SuperAdminOnly() fiber.Handler {
	return func(c fiber.Ctx) error {
		roleVal := c.Locals("role")
		var role string
		switch v := roleVal.(type) {
		case UserRole:
			role = string(v)
		case string:
			role = v
		default:
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		if role != string(UserRoleSuperAdmin) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "super admin required"})
		}
		return c.Next()
	}
}
