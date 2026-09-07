package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv             string
	Port               string
	FrontendURL        string
	AppBaseURL         string
	DatabaseURL        string
	JWTSecret          string
	JWTExpiresInHours  int
	AuthCookieName     string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	CookieDomain       string
	CookieSecure       bool
	CookieSameSite     string
	N8NWebhookURL      string
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPass           string
	SMTPFrom           string
	MeetingURL         string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		Port:               getEnv("PORT", "8080"),
		FrontendURL:        strings.TrimRight(getEnv("FRONTEND_URL", "http://localhost:3000"), "/"),
		AppBaseURL:         strings.TrimRight(getEnv("APP_BASE_URL", "http://localhost:8080"), "/"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTExpiresInHours:  getEnvAsInt("JWT_EXPIRES_IN_HOURS", 168),
		AuthCookieName:     getEnv("AUTH_COOKIE_NAME", "agency_portal_token"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", getEnv("GOOGLE_REDIRECT_URI", "")),
		CookieDomain:       getEnv("COOKIE_DOMAIN", ""),
		CookieSecure:       getEnvAsBool("COOKIE_SECURE", false),
		CookieSameSite:     strings.ToLower(getEnv("COOKIE_SAME_SITE", "lax")),
		N8NWebhookURL:      getEnv("N8N_WEBHOOK_URL", ""),
		SMTPHost:           getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:           getEnv("SMTP_PORT", "587"),
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPass:           getEnv("SMTP_PASS", ""),
		SMTPFrom:           getEnv("SMTP_FROM", ""),
		MeetingURL:         getEnv("MEETING_URL", ""),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("db url is required")
	}

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("jwt secret is required")
	}

	if cfg.GoogleClientID == "" {
		return Config{}, fmt.Errorf("google client id is required")
	}

	if cfg.GoogleClientSecret == "" {
		return Config{}, fmt.Errorf("google client secret is required")
	}

	if cfg.GoogleRedirectURL == "" {
		return Config{}, fmt.Errorf("google redirect url is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {

	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	return value

}

func getEnvAsInt(key string, fallback int) int {
	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)

	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsBool(key string, fallback bool) bool {
	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)

	if err != nil {
		return fallback
	}

	return parsed
}
