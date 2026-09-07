package handlers

import (
	"backend/internal/config"
	"backend/internal/http/middleware"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"
	"context"
	"log"
	"strings"

	"github.com/gofiber/fiber/v3"
)

type AuthHandler struct {
	config config.Config
	// authService
	//have authentication logic
	authservice *services.AuthService
	userRepo    *repositories.UserRepository
}

func NewAuthHandler(cfg config.Config, authService *services.AuthService, userRepo *repositories.UserRepository) *AuthHandler {
	return &AuthHandler{
		config:      cfg,
		authservice: authService,
		userRepo:    userRepo,
	}
}

// method which will trigger user authentication
// h us AuthHandler object ka reference hai.
// h ke through handler ki properties/methods access kar sakti
func (h *AuthHandler) StartGoogleAuth(c fiber.Ctx) error {
	state, err := h.authservice.GenerateStateToken()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to generate the state token",
		})
	}
	h.authservice.SetOauthStateCookie(c, state)
	return c.Redirect().To(h.authservice.BuildGoogleAuthUrl(state))
}

// callback -> we r checking whether user is actually authenticated or not?
// if not authehticated redirect to login pg
func (h *AuthHandler) GoogleCallback(c fiber.Ctx) error {
	stateFromQuery := c.Query("state")
	stateFromCookie := h.authservice.ReadOauthStateCookie(c)
	if stateFromQuery == "" || stateFromCookie == "" || stateFromQuery != stateFromCookie {
		h.authservice.ClearOauthStateCookie(c)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid oauth state",
		})
	}
	// if state is valid we will clear oauth cookie temp bcz we dont need it anymore once we do validation
	h.authservice.ClearOauthStateCookie(c)

	// auth code from google's callback url
	// temp code and will be excahnged for a google aaccess token
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Missing auth code",
		})
	}
	//actual google user info from google auth code
	googleUser, err := h.authservice.ExchangeCodeForGoogleUser(context.Background(), code)
	if err != nil {
		log.Printf("ExchangeCodeForGoogleUser error: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"message": "Failed to fetch google user information",
			"error":   err.Error(),
		})
	}
	//to actually add info to db
	user, err := h.userRepo.UpsertByEmail(context.Background(), repositories.UpsertUserInput{
		Email:     googleUser.Email,
		Name:      googleUser.Name,
		AvatarURL: googleUser.Picture,
	})
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"message": "Failed to upser user in our DB",
		})
	}
	// creating signed jwt for our application
	token, err := h.authservice.SignJWT(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to sign jwt",
		})
	}
	h.authservice.SetAuthCookie(c, token)
	targetPath := "/submissions"
	if strings.EqualFold(user.Role, "admin") {
		targetPath = "/admin"
	}
	return c.Redirect().To(h.config.FrontendURL + targetPath)
}
func (h *AuthHandler) GetUserInfo(c fiber.Ctx) error {
	currentUser, ok := c.Locals(middleware.ExtractCurrentUserLocalKey()).(*models.User)
	if !ok || currentUser == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized",
		})
	}
	return c.JSON(fiber.Map{
		"user": currentUser,
	})
}
func (h *AuthHandler) Logout(c fiber.Ctx) error {
	h.authservice.ClearAuthCookie(c)
	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}
