package repositories

import (
	"backend/internal/models"
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

type UpsertUserInput struct {
	Email     string
	Name      string
	AvatarURL string
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) UpsertByEmail(ctx context.Context, input UpsertUserInput) (*models.User, error) {

	var user models.User

	err := r.db.QueryRow(ctx, `
		INSERT INTO users (email, name, avatar_url, role)
		VALUES ($1, $2, $3, 'user')
		ON CONFLICT (email)
		DO UPDATE SET
			name = EXCLUDED.name,
			avatar_url = EXCLUDED.avatar_url
		RETURNING id, email, COALESCE(name, ''), COALESCE(avatar_url, ''), role, created_at
	`,
		strings.TrimSpace(input.Email),
		strings.TrimSpace(input.Name),
		strings.TrimSpace(input.AvatarURL),
	).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Role,
		&user.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("upsert user by email failed")
	}

	return &user, nil

}

func (r *UserRepository) FindByID(ctx context.Context, userID string) (*models.User, error) {
	var user models.User

	err := r.db.QueryRow(ctx, `
	SELECT id, email, COALESCE(name, ''), COALESCE(avatar_url, ''), role, created_at
		FROM users
		WHERE id = $1
	`, strings.TrimSpace(userID)).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Role,
		&user.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("find user by id failed")
	}

	return &user, nil
}
