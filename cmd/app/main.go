package main

import (
	_ "POS-kasir/docs"
	"POS-kasir/server"
)

// @title Dinosaurus POS API
// @version 1.0
// @description Dinosaurus POS API
// @host localhost:8080
// @BasePath /api/v1
func main() {
	app := server.InitApp()
	defer server.Cleanup(app)

	go server.StartServer(app)

	server.WaitForShutdown(app)
}
