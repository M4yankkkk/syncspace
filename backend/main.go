package main

import (
	"log"

	"syncspace-ag-backend/api"
	"syncspace-ag-backend/database"
	"syncspace-ag-backend/models"
	"syncspace-ag-backend/ws"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Datastores
	database.ConnectPostgres()
	database.ConnectRedis()

	// 2. Migrate Schema
	models.Migrate(database.DB)

	// 3. Setup WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()

	// 4. Setup REST API
	r := api.SetupRouter()

	// Inject the WebSocket handler into Gin
	r.GET("/ws", func(c *gin.Context) {
		ws.ServeWs(hub, c.Writer, c.Request)
	})

	// 5. Start Server
	log.Println("Starting SyncSpace Backend Server on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to run server: ", err)
	}
}
