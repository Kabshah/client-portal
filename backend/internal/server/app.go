package server

import (
	"backend/internal/config"
	"backend/internal/http/handlers"
	"backend/internal/http/middleware"
	"backend/internal/http/routes"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	recovermw "github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
)

func New(cfg config.Config, db *pgxpool.Pool) *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit: 100 * 1024 * 1024, // 100MB body limit to allow large file uploads
	})
	// register fiber logger middleware log each https request in terminal
	app.Use(logger.New())
	// if some panic happens this middleware is going to catch that panic
	app.Use(recovermw.New())

	allowedOrigins := []string{
		cfg.FrontendURL,
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3001",
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowCredentials: true,
		AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
	}))
	userRepo := repositories.NewUserRepository(db)
	submissionRepo := repositories.NewSubmissionRepository(db)

	authService := services.NewAuthService(cfg)
	n8nService := services.NewN8NService(cfg)
	emailService := services.NewEmailService(cfg)

	authHandler := handlers.NewAuthHandler(cfg, authService, userRepo)
	submissionHandler := handlers.NewSubmissionHandler(submissionRepo, n8nService)
	adminSubmissionHandler := handlers.NewAdminSubmissionHandler(submissionRepo, emailService)

	authMiddleware := middleware.NewAuthMiddleware(cfg, authService, userRepo)
	routes.Register(app, routes.RouteDependencies{
		AuthHandler:    authHandler,
		AuthMiddleware: authMiddleware,

		SubmissionHandler:      submissionHandler,
		AdminSubmissionHandler: adminSubmissionHandler,
	})
	return app
}
