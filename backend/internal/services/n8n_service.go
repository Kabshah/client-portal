package services

import (
	"backend/internal/config"
	"backend/internal/repositories"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type N8NService struct {
	webhookURL string
	httpClient *http.Client
}
type N8NReadinessInput struct {
	ClientName      string   `json:"client_name"`
	ClientEmail     string   `json:"client_email"`
	ServicePackage  string   `json:"service_package"`
	ProjectGoal     string   `json:"project_goal"`
	DesiredTimeline string   `json:"desired_timeline"`
	AssetsProvided  string   `json:"assets_provided"`
	AssetFiles      []string `json:"asset_files"`
	AssetLinks      []string `json:"asset_links"`
	BriefFiles      []string `json:"brief_files"`
	BriefLinks      []string `json:"brief_links"`
	BriefLink       string   `json:"brief_link"`
}
type N8NReadinessResult struct {
	ReadinessStatus       string `json:"readiness_status"`
	MissingItems          any    `json:"missing_items"`
	AISummary             string `json:"ai_summary"`
	RecommendedNextAction string `json:"recommended_next_action"`
}

func NewN8NService(cfg config.Config) *N8NService {
	return &N8NService{
		webhookURL: strings.TrimSpace(cfg.N8NWebhookURL),
		httpClient: &http.Client{
			Timeout: time.Duration(30) * time.Second,
		},
	}
}
func (s *N8NService) CheckReadiness(ctx context.Context, input N8NReadinessInput) (*N8NReadinessResult, error) {
	if s.webhookURL == "" {
		return nil, fmt.Errorf("Webhook url is missing")
	}
	//converting our input to json bcz we are going to send it back to n8n
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("Json marshal failed")
	}
	//bytes.Newreader is going to conv json bytes into request body
	//it is creating post req using webhook url
	// configure http request object in memory
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, s.webhookURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("N8N request failed")
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Accept", "application/json")
	//it is going to send http request to the n8n webhook actually yeh line krr rahi h
	// it performs actual network operation
	response, err := s.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("calling n8n webhook: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		//n8n didnt successfully process this request
		//reading only first 2048 bytes from response body
		responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return nil, fmt.Errorf("n8n returned status %d:%s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}
	var result N8NReadinessResult
	//iss struct k format ma decode krny klia
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("Decode n8n response failed: %w", err)
	}
	return &result, nil
}

// submission ko db store krna h toh uska input leny klia
func ReadinessToCreateSubmissionInput(userID string, form N8NReadinessInput, result *N8NReadinessResult) *repositories.CreateSubmissionInput {
	missingItems := []string{}
	readinessStatus := "missing_info"
	aiSummary := "AI evaluation completed."
	recommendedNextAction := "Review project details."

	if result != nil {
		missingItems = parseMissingItems(result.MissingItems)

		status := strings.ToLower(strings.TrimSpace(result.ReadinessStatus))
		status = strings.ReplaceAll(status, " ", "_")
		status = strings.ReplaceAll(status, "-", "_")
		if status == "ready" || status == "missing_info" {
			readinessStatus = status
		} else if len(missingItems) == 0 {
			readinessStatus = "ready"
		} else {
			readinessStatus = "missing_info"
		}

		if strings.TrimSpace(result.AISummary) != "" {
			aiSummary = strings.TrimSpace(result.AISummary)
		}
		if strings.TrimSpace(result.RecommendedNextAction) != "" {
			recommendedNextAction = strings.TrimSpace(result.RecommendedNextAction)
		}
	}

	return &repositories.CreateSubmissionInput{
		UserID:                userID,
		ClientName:            form.ClientName,
		ClientEmail:           form.ClientEmail,
		ServicePackage:        form.ServicePackage,
		ProjectGoal:           form.ProjectGoal,
		DesiredTimeline:       form.DesiredTimeline,
		AssetsProvided:        form.AssetsProvided,
		ReadinessStatus:       readinessStatus,
		MissingItems:          missingItems,
		AISummary:             aiSummary,
		RecommendedNextAction: recommendedNextAction,
		AssetFiles:            form.AssetFiles,
		AssetLinks:            form.AssetLinks,
		BriefFiles:            form.BriefFiles,
		BriefLinks:            form.BriefLinks,
		BriefLink:             form.BriefLink,
		IsDraft:               false,
	}
}

func parseMissingItems(raw any) []string {
	var items []string
	if raw == nil {
		return []string{}
	}
	switch v := raw.(type) {
	case []any:
		for _, el := range v {
			if str, ok := el.(string); ok {
				str = strings.TrimSpace(str)
				if str != "" {
					items = append(items, str)
				}
			} else if el != nil {
				str := strings.TrimSpace(fmt.Sprint(el))
				if str != "" {
					items = append(items, str)
				}
			}
		}
	case []string:
		for _, str := range v {
			str = strings.TrimSpace(str)
			if str != "" {
				items = append(items, str)
			}
		}
	case string:
		v = strings.TrimSpace(v)
		if v != "" {
			for _, item := range strings.Split(v, ",") {
				trimmed := strings.TrimSpace(item)
				if trimmed != "" {
					items = append(items, trimmed)
				}
			}
		}
	}
	if items == nil {
		items = []string{}
	}
	return items
}
