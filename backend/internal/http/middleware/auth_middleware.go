package middleware

import (
	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"
	"context"
	"strings"

	"github.com/gofiber/fiber/v3"
)

const currentUserLocalkey = "current_user"

func ExtractCurrentUserLocalKey() string {
	return currentUserLocalkey
}

func CurrentUserFromContext(c fiber.Ctx) (*models.User, bool) {

	currentUser, ok := c.Locals(currentUserLocalkey).(*models.User)

	return currentUser, ok
}

type AuthMiddleware struct {
	config config.Config

	authService *services.AuthService

	userRepo *repositories.UserRepository
}

func NewAuthMiddleware(
	cfg config.Config,
	authService *services.AuthService,
	userRepo *repositories.UserRepository,
) *AuthMiddleware {
	return &AuthMiddleware{
		config:      cfg,
		authService: authService,
		userRepo:    userRepo,
	}
}

func (m *AuthMiddleware) RequireAuth() fiber.Handler {

	return func(c fiber.Ctx) error {
		tokenString := c.Cookies(m.config.AuthCookieName, "")

		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "missing auth cookie",
			})
		}

		claims, err := m.authService.ParseJWT(tokenString)

		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "Invalid auth token",
			})
		}

		user, err := m.userRepo.FindByID(context.Background(), claims.UserID)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "User not found in DB",
			})
		}

		c.Locals(currentUserLocalkey, user)

		return c.Next()
	}
}

func (m *AuthMiddleware) RequireAdmin() fiber.Handler {
	return func(c fiber.Ctx) error {
		currentUser, ok := CurrentUserFromContext(c)

		if !ok || currentUser == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "Unauthorized",
			})
		}

		if !strings.EqualFold(currentUser.Role, "admin") {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"message": "Admin access required",
			})
		}

		return c.Next()
	}
}
