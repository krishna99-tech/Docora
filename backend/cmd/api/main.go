package main

import (
	"log"
	"os"

	"docora/backend/internal/config"
	"docora/backend/internal/repositories"
	"docora/backend/internal/server"
)

func main() {
	log.Println("Starting Docora Professional Receipt & PDF Generator...")

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := repositories.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Printf("Warning: Database connection failed (%v). Retrying in background...", err)
	} else {
		defer db.Close()
	}

	srv, err := server.NewServer(cfg, db)
	if err != nil {
		log.Fatalf("Failed to initialize server: %v", err)
	}

	if err := srv.Run(); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
		os.Exit(1)
	}
}
