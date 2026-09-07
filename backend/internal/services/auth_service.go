package services

import (
	"backend/internal/config"
	"backend/internal/models"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthService struct {
	config config.Config
	// store google authentication
	oauthConfig *oauth2.Config
	httpClient  *http.Client
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

//we can store custom information inside jwt following is info we are storing inside jwt

type AuthClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

func NewAuthService(cfg config.Config) *AuthService {
	dialer := &net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 30 * time.Second,
	}

	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			// Force IPv4 to avoid broken IPv6 TLS handshake timeouts with Google
			return dialer.DialContext(ctx, "tcp4", addr)
		},
		TLSHandshakeTimeout:   20 * time.Second,
		ResponseHeaderTimeout: 25 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	httpClient := &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}

	return &AuthService{
		config: cfg,
		oauthConfig: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			Endpoint:     google.Endpoint,
			Scopes:       []string{"openid", "profile", "email"},
		},
		httpClient: httpClient,
	}
}

// token create krr rha h
func (s *AuthService) GenerateStateToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("Generate state token failed")
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

const oauthStateCookieName = "google_oauth_state"

func (s *AuthService) SetOauthStateCookie(c fiber.Ctx, value string) {
	c.Cookie(&fiber.Cookie{
		Name:     oauthStateCookieName,
		Value:    value,
		Path:     "/", //cookie which we r creating is avaialable 4 whole site
		HTTPOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: s.config.CookieSameSite,
		Domain:   s.config.CookieDomain,
		MaxAge:   20 * 60,
	})
}

func (s *AuthService) BuildGoogleAuthUrl(state string) string {
	//AuthCodeURL creates google oauth consent url
	return s.oauthConfig.AuthCodeURL(state)
}
func (s *AuthService) ReadOauthStateCookie(c fiber.Ctx) string {
	return c.Cookies(oauthStateCookieName, "")
}

func (s *AuthService) SetAuthCookie(c fiber.Ctx, token string) {
	maxAge := s.config.JWTExpiresInHours * 60 * 60
	c.Cookie(&fiber.Cookie{
		Name:     s.config.AuthCookieName,
		Value:    token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: s.config.CookieSameSite,
		Domain:   s.config.CookieDomain,
		MaxAge:   maxAge,
	})
}
func (s *AuthService) ClearOauthStateCookie(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     oauthStateCookieName,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: s.config.CookieSameSite,
		Domain:   s.config.CookieDomain,
		//expire cookie in past for better browser compatibility
		Expires: time.Unix(0, 0),
	})
}

// getting google user info
func (s *AuthService) ExchangeCodeForGoogleUser(ctx context.Context, code string) (*GoogleUserInfo, error) {
	// Use IPv4 httpClient in oauth2 context
	ctx = context.WithValue(ctx, oauth2.HTTPClient, s.httpClient)

	//.Exchange converts authorization code into a token
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("Exchange auth code failed: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("Creating user info failed: %w", err)
	}
	// we r sending google access token into our authorization header
	req.Header.Set("Authorization", "Bearer "+token.AccessToken) //Bearer ejy

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Fetching user info failed: %w", err)
	}
	//prevents resource leaks
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("Google user info returned status %d: %s", resp.StatusCode, string(body))
	}
	//decode google json resp into this struct GoogleUserInfo
	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("Decoding user info failed: %w", err)
	}
	if strings.TrimSpace(userInfo.Email) == "" {
		return nil, fmt.Errorf("google userinfo didnt return any email")
	}
	return &userInfo, nil
}

// db sy utha rhy h yeh user(receiving)
func (s *AuthService) SignJWT(user *models.User) (string, error) {
	//ading custom data which our token is going to  hold
	expiresAt := time.Now().Add(time.Duration(s.config.JWTExpiresInHours) * time.Hour)
	claims := AuthClaims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID, //bcz its unique
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("Sign jwt error")
	}
	return signed, nil
}
func (s *AuthService) ParseJWT(tokenString string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{},
		func(token *jwt.Token) (any, error) {
			return []byte(s.config.JWTSecret), nil
		})
	if err != nil {
		return nil, fmt.Errorf("parsing jwt failed %w", err)
	}
	claims, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("Invalid jwt token")
	}
	return claims, nil
}
func (s *AuthService) ClearAuthCookie(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     s.config.AuthCookieName,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: s.config.CookieSameSite,
		Domain:   s.config.CookieDomain,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}
