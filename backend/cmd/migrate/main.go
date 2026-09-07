package main

import (
	"backend/internal/config"
	"backend/internal/database"
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
	// closes db pool when main finishes
	defer db.Close()
	if err := database.RunMigrations(ctx, db); err != nil {
		log.Fatalf("Run migrations: %v", err)
	}
	log.Println("Migration successfully done")
}
