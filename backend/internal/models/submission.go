package models

import "time"

const (
	ReadinessStatusReady       = "ready"
	ReadinessStatusMissingInfo = "missing_info"
	AdminStatusPending         = "pending"
	AdminStatusApproved        = "approved"
	AdminStatusRejected        = "rejected"
)

type Submission struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"user_id"`
	ClientName            string    `json:"client_name"`
	ClientEmail           string    `json:"client_email"`
	ServicePackage        string    `json:"service_package"`
	ProjectGoal           string    `json:"project_goal"`
	DesiredTimeline       string    `json:"desired_timeline"`
	AssetsProvided        string    `json:"assets_provided"`
	ReadinessStatus       string    `json:"readiness_status"`
	MissingItems          []string  `json:"missing_items"`
	AISummary             string    `json:"ai_summary"`
	RecommendedNextAction string    `json:"recommended_next_action"`
	AdminStatus           string    `json:"admin_status"`
	AssetFiles            []string  `json:"asset_files"`
	AssetLinks            []string  `json:"asset_links"`
	BriefFiles            []string  `json:"brief_files"`
	BriefLinks            []string  `json:"brief_links"`
	BriefLink             string    `json:"brief_link"`
	IsDraft               bool      `json:"is_draft"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}
