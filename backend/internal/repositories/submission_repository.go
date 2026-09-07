package repositories

import (
	"backend/internal/models"
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubmissionRepository struct {
	db *pgxpool.Pool
}
type CreateSubmissionInput struct {
	UserID                string
	ClientName            string
	ClientEmail           string
	ServicePackage        string
	ProjectGoal           string
	DesiredTimeline       string
	AssetsProvided        string
	ReadinessStatus       string
	MissingItems          []string
	AISummary             string
	RecommendedNextAction string
	AssetFiles            []string
	AssetLinks            []string
	BriefFiles            []string
	BriefLinks            []string
	BriefLink             string
	IsDraft               bool
}

func NewSubmissionRepository(db *pgxpool.Pool) *SubmissionRepository {
	return &SubmissionRepository{db: db}
}

// methid is for creating new submisssion
// r is giving db we r receing input & ctx and return in models kee submission file and err
func (r *SubmissionRepository) Create(ctx context.Context, input CreateSubmissionInput) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.QueryRow(ctx, `
	INSERT INTO submissions (
    user_id,
    client_name,
    client_email,
    service_package,
    project_goal,
    desired_timeline,
    assets_provided,
    readiness_status,
    missing_items,
    ai_summary,
    recommended_next_action,
    asset_files,
    brief_link,
    is_draft
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING
    id,
    user_id,
    client_name,
    client_email,
    service_package,
    project_goal,
    desired_timeline,
    assets_provided,
    readiness_status,
    missing_items,
    ai_summary,
    recommended_next_action,
    admin_status,
    asset_files,
    brief_link,
    is_draft,
    created_at,
    updated_at
	`,
		strings.TrimSpace(input.UserID),
		strings.TrimSpace(input.ClientName),
		strings.TrimSpace(strings.ToLower(input.ClientEmail)),
		strings.TrimSpace(input.ServicePackage),
		strings.TrimSpace(input.ProjectGoal),
		strings.TrimSpace(input.DesiredTimeline),
		strings.TrimSpace(input.AssetsProvided),
		strings.TrimSpace(input.ReadinessStatus),
		input.MissingItems,
		strings.TrimSpace(input.AISummary),
		strings.TrimSpace(input.RecommendedNextAction),
		input.AssetFiles,
		strings.TrimSpace(input.BriefLink),
		input.IsDraft,
	).Scan(scanSubmissionFields(&submission)...)
	//.Scan() database se aaye hue row ke columns ko Go struct ke fields mein map/copy karta hai (one by one, column order ke hisaab se).
	if err != nil {
		return nil, fmt.Errorf("Create submission failed: %w", err)
	}
	return &submission, nil
}
func scanSubmissionFields(submission *models.Submission) []any {
	return []any{
		&submission.ID,
		&submission.UserID,
		&submission.ClientName,
		&submission.ClientEmail,
		&submission.ServicePackage,
		&submission.ProjectGoal,
		&submission.DesiredTimeline,
		&submission.AssetsProvided,
		&submission.ReadinessStatus,
		&submission.MissingItems,
		&submission.AISummary,
		&submission.RecommendedNextAction,
		&submission.AdminStatus,
		&submission.AssetFiles,
		&submission.BriefLink,
		&submission.IsDraft,
		&submission.CreatedAt,
		&submission.UpdatedAt,
	}
}

// list submissions by user id

func (r *SubmissionRepository) ListByUserID(ctx context.Context, userID string) ([]models.Submission, error) {
	rows, err := r.db.Query(ctx, selectSubmissionSQL()+`
	WHERE user_id = $1
	ORDER BY created_at DESC
	`, strings.TrimSpace(userID))
	if err != nil {
		return nil, fmt.Errorf("List submission by user failed")
	}
	defer rows.Close()
	// converting database rows into slices of model.submission
	return scanSubmissions(rows)
}

func (r *SubmissionRepository) ListAll(ctx context.Context) ([]models.Submission, error) {
	rows, err := r.db.Query(ctx, selectSubmissionSQL()+`
	WHERE deleted_by_admin = false AND is_draft = false
	ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("List all submission failed.")
	}
	defer rows.Close()
	return scanSubmissions(rows)
}

// SoftDeleteAdmin marks submission as deleted from admin queue; client record stays intact
func (r *SubmissionRepository) SoftDeleteAdmin(ctx context.Context, submissionID string) error {
	tag, err := r.db.Exec(ctx, `
	UPDATE submissions
	SET deleted_by_admin = true, updated_at = NOW()
	WHERE id = $1 AND deleted_by_admin = false
	`, strings.TrimSpace(submissionID))
	if err != nil {
		return fmt.Errorf("SoftDeleteAdmin failed: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// DeleteDraft permanently removes a draft belonging to the user
func (r *SubmissionRepository) DeleteDraft(ctx context.Context, submissionID string, userID string) error {
	tag, err := r.db.Exec(ctx, `
	DELETE FROM submissions
	WHERE id = $1 AND user_id = $2 AND is_draft = true
	`, strings.TrimSpace(submissionID), strings.TrimSpace(userID))
	if err != nil {
		return fmt.Errorf("DeleteDraft failed: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// helper func for above func
func selectSubmissionSQL() string {
	return `
	SELECT
    id,
    user_id,
    client_name,
    client_email,
    service_package,
    project_goal,
    desired_timeline,
    assets_provided,
    readiness_status,
    missing_items,
    ai_summary,
    recommended_next_action,
    admin_status,
    asset_files,
    brief_link,
    is_draft,
    created_at,
    updated_at
	FROM submissions
	`
}

func scanSubmissions(rows pgx.Rows) ([]models.Submission, error) {
	submissions := make([]models.Submission, 0) //yeh type h and it starts from 0
	//it is going to move thru a result and set one row at a time
	for rows.Next() {
		var submission models.Submission //yeh type h model.submission var submission kee
		if err := rows.Scan(scanSubmissionFields(&submission)...); err != nil {
			return nil, fmt.Errorf("SCAN submission failed")
		}
		// add scanned submission into submissions struct
		submissions = append(submissions, submission)
	}
	return submissions, rows.Err() // this checks whether any error happened while looping
}

// prevents users from accessing other ppl submission only shows them their own submission
func (r *SubmissionRepository) FindByIDForUser(ctx context.Context, submissionID string, userID string) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.QueryRow(ctx, selectSubmissionSQL()+`
	WHERE id = $1 AND user_id = $2
	`, strings.TrimSpace(submissionID),
		strings.TrimSpace(userID)).Scan(scanSubmissionFields(&submission)...)
	if err != nil {
		return nil, fmt.Errorf("Find submission for user by id failed")
	}
	return &submission, nil
}

// to update status by admin
func (r *SubmissionRepository) UpdateAdminStatus(ctx context.Context, submissionID string, adminStatus string) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.QueryRow(ctx, `
	UPDATE submissions
	SET admin_status = $2, updated_at = NOW()
	WHERE id = $1
	RETURNING
	id,
    user_id,
    client_name,
    client_email,
    service_package,
    project_goal,
    desired_timeline,
    assets_provided,
    readiness_status,
    missing_items,
    ai_summary,
    recommended_next_action,
    admin_status,
    asset_files,
    brief_link,
    is_draft,
    created_at,
    updated_at
	`, strings.TrimSpace(submissionID), strings.TrimSpace(adminStatus)).Scan(
		scanSubmissionFields(&submission)...,
	)
	if err != nil {
		return nil, fmt.Errorf("Update status failed")
	}
	return &submission, nil
}
