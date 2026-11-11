package server

import (
	"github.com/gofiber/fiber/v3"
)

func HealthHandler(app *App) fiber.Handler {
	return func(c fiber.Ctx) error {

		if err := app.DB.Ping(c.RequestCtx()); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "fail",
				"error":  "PostgreSQL unavailable",
			})
		}

		if app.R2 != nil {
			r2Exists, err := app.R2.BucketExists(c.RequestCtx())
			if err != nil || !r2Exists {
				if app.Config.Server.Env == "development" {
					app.Logger.Warnf("Object storage check skipped in development: exists=%v err=%v", r2Exists, err)
				} else {
					if err != nil {
						app.Logger.Errorf("Error checking R2 bucket existence: %v", err)
					}
					return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
						"status": "fail",
						"error":  "object storage bucket unavailable",
					})
				}
			}
		}

		return c.JSON(fiber.Map{
			"status": "ok",
		})
	}
}

// fiber:context-methods migrated
