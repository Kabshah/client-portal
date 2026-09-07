package routes

import (
	"backend/internal/http/handlers"
	"backend/internal/http/middleware"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

type RouteDependencies struct {
	AuthHandler    *handlers.AuthHandler
	AuthMiddleware *middleware.AuthMiddleware
	//for submission of clients
	SubmissionHandler *handlers.SubmissionHandler
	// for review of admins of all submissions
	AdminSubmissionHandler *handlers.AdminSubmissionHandler
}

func Register(app *fiber.App, deps RouteDependencies) {
	// GROUPING ALL AUTH RELATED ROUTES
	auth := app.Group("/auth")
	auth.Get("/google", deps.AuthHandler.StartGoogleAuth)
	auth.Get("/google/callback", deps.AuthHandler.GoogleCallback)
	auth.Post("/logout", deps.AuthHandler.Logout)
	auth.Get("/me", deps.AuthMiddleware.RequireAuth(), deps.AuthHandler.GetUserInfo)

	submissions := app.Group("/submissions", deps.AuthMiddleware.RequireAuth())
	submissions.Post("/", deps.SubmissionHandler.Create)
	submissions.Post("", deps.SubmissionHandler.Create)
	submissions.Get("/", deps.SubmissionHandler.ListMine)
	submissions.Get("", deps.SubmissionHandler.ListMine)
	submissions.Get("/:id", deps.SubmissionHandler.GetMineByID)
	submissions.Delete("/drafts/:id", deps.SubmissionHandler.DeleteDraft)

	admin := app.Group("/admin", deps.AuthMiddleware.RequireAuth(), deps.AuthMiddleware.RequireAdmin())
	admin.Get("/me", deps.AuthHandler.GetUserInfo)
	admin.Get("/submissions", deps.AdminSubmissionHandler.ListAllSubmissions)
	admin.Patch("/submissions/:id/status", deps.AdminSubmissionHandler.UpdateStatus)
	admin.Delete("/submissions/:id", deps.AdminSubmissionHandler.Delete)

	// Serve uploaded files so admin can view/download them
	app.Get("/uploads/*", static.New("./uploads"))

	// Silent handler for browser favicon requests
	app.Get("/favicon.ico", func(c fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})
}
