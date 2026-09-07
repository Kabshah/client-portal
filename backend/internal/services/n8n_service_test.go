package services

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestReadinessToCreateSubmissionInput_ArrayMissingItems(t *testing.T) {
	jsonPayload := `{
		"readiness_status": "missing_info",
		"missing_items": ["Detailed requirements", "Design files"],
		"ai_summary": "Client needs more details.",
		"recommended_next_action": "Follow up with client."
	}`

	var result N8NReadinessResult
	err := json.Unmarshal([]byte(jsonPayload), &result)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	form := N8NReadinessInput{
		ClientName:      "Ali",
		ClientEmail:     "ali@example.com",
		ServicePackage:  "Standard",
		ProjectGoal:     "Web dev",
		DesiredTimeline: "1 month",
		AssetsProvided:  "Logo",
	}

	input := ReadinessToCreateSubmissionInput("user-123", form, &result)

	expectedMissing := []string{"Detailed requirements", "Design files"}
	if !reflect.DeepEqual(input.MissingItems, expectedMissing) {
		t.Errorf("expected %v, got %v", expectedMissing, input.MissingItems)
	}

	if input.ReadinessStatus != "missing_info" {
		t.Errorf("expected 'missing_info', got %v", input.ReadinessStatus)
	}
}

func TestReadinessToCreateSubmissionInput_StringMissingItems(t *testing.T) {
	jsonPayload := `{
		"readiness_status": "ready",
		"missing_items": "None, N/A",
		"ai_summary": "All good.",
		"recommended_next_action": "Proceed."
	}`

	var result N8NReadinessResult
	err := json.Unmarshal([]byte(jsonPayload), &result)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	form := N8NReadinessInput{
		ClientName: "Ali",
	}

	input := ReadinessToCreateSubmissionInput("user-123", form, &result)
	expectedMissing := []string{"None", "N/A"}
	if !reflect.DeepEqual(input.MissingItems, expectedMissing) {
		t.Errorf("expected %v, got %v", expectedMissing, input.MissingItems)
	}
	if input.ReadinessStatus != "ready" {
		t.Errorf("expected 'ready', got %v", input.ReadinessStatus)
	}
}
