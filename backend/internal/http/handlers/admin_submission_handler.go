package handlers

import (
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"
	"context"
	"errors"
	"log"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
)

type AdminSubmissionHandler struct {
	submissionRepo *repositories.SubmissionRepository
	emailService   *services.EmailService
}
type UpdateAdminStatusRequest struct {
	AdminStatus string `json:"admin_status"`
}

func NewAdminSubmissionHandler(
	submissionRepo *repositories.SubmissionRepository,
	emailService *services.EmailService,
) *AdminSubmissionHandler {
	return &AdminSubmissionHandler{
		submissionRepo: submissionRepo,
		emailService:   emailService,
	}
}

// to list all submissions
func (h *AdminSubmissionHandler) ListAllSubmissions(c fiber.Ctx) error {
	submission, err := h.submissionRepo.ListAll(context.Background())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to load submissions",
		})
	}
	return c.JSON(fiber.Map{"submissions": submission})
}

// to update status of all submissions
func (h *AdminSubmissionHandler) UpdateStatus(c fiber.Ctx) error {
	var body UpdateAdminStatusRequest
	if err := c.Bind().Body(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid admin status",
		})
	}

	adminStatus := strings.TrimSpace(body.AdminStatus)
	if !isAllowedAdminStatus(adminStatus) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid admin status",
		})
	}

	submission, err := h.submissionRepo.UpdateAdminStatus(context.Background(), c.Params("id"), adminStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"message": "Submission not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to update submission status",
		})
	}

	// If approved, send kickoff / welcome email to client asynchronously
	if adminStatus == models.AdminStatusApproved && h.emailService != nil {
		go func(sub *models.Submission) {
			if err := h.emailService.SendApprovalWelcomeEmail(sub); err != nil {
				log.Printf("[EmailService] Failed to send approval email to %s: %v", sub.ClientEmail, err)
			}
		}(submission)
	}

	return c.JSON(fiber.Map{"submission": submission})
}
func isAllowedAdminStatus(status string) bool {
	return status == models.AdminStatusPending ||
		status == models.AdminStatusApproved ||
		status == models.AdminStatusRejected
}

// Delete soft-deletes a submission from the admin queue (client record stays intact)
func (h *AdminSubmissionHandler) Delete(c fiber.Ctx) error {
	submissionID := strings.TrimSpace(c.Params("id"))
	if submissionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Submission ID is required",
		})
	}
	err := h.submissionRepo.SoftDeleteAdmin(context.Background(), submissionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"message": "Submission not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to delete submission",
		})
	}
	return c.JSON(fiber.Map{"message": "Submission removed from queue"})
}
