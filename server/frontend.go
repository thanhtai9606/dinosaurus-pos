package server

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func SetupFrontend(app *App) {
	distPath := "./web/dist"

	if _, err := os.Stat(distPath); os.IsNotExist(err) {
		app.Logger.Warn("Frontend dist directory not found, skipping frontend setup. Run 'cd web && npm run build' to generate it.")
		return
	}

	staticHandler := static.New(distPath, static.Config{
		Compress: true,
		Browse:   false,
	})

	skipBackendPaths := func(path string) bool {
		return strings.HasPrefix(path, "/api/") ||
			strings.HasPrefix(path, "/swagger/") ||
			path == "/healthz"
	}

	// Never serve SPA/static for API paths — otherwise PUT/PATCH return 405 from the file server.
	app.FiberApp.Use(func(c fiber.Ctx) error {
		if skipBackendPaths(c.Path()) {
			return c.Next()
		}
		return staticHandler(c)
	})

	app.FiberApp.Get("/*", func(c fiber.Ctx) error {
		if skipBackendPaths(c.Path()) {
			return c.Next()
		}
		return c.SendFile(distPath + "/index.html")
	})
}
