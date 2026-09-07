package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/server"
	"context"
	"log"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Load config: %v", err)
	}
	ctx := context.Background()
	db, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Connect database: %v", err)
	}
	defer db.Close()
	app := server.New(cfg, db)
	log.Printf("Backend running on http://localhost:%s", cfg.Port)

	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Listen %v", err)
	}
}
