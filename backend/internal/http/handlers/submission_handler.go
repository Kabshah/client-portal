package handlers

// whenever  i login i should only see submissions created by me
// to get details of a particular submission i will be able to see details correctly
import (
	"backend/internal/http/middleware"
	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/services"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/mail"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
)

// allowed file extensions for uploads
var allowedExtensions = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
	".webp": true, ".pdf": true, ".docx": true, ".pptx": true,
	".xlsx": true, ".txt": true, ".mp4": true,
}

type SubmissionHandler struct {
	submissionRepo *repositories.SubmissionRepository
	n8nService     *services.N8NService
}

func NewSubmissionHandler(submissionRepo *repositories.SubmissionRepository, n8nService *services.N8NService) *SubmissionHandler {
	return &SubmissionHandler{
		submissionRepo: submissionRepo,
		n8nService:     n8nService,
	}
}

func (h *SubmissionHandler) Create(c fiber.Ctx) error {
	currentUser, ok := middleware.CurrentUserFromContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized",
		})
	}

	// ── Parse multipart form ────────────────────────────────────────────────
	// Parse text fields directly via FormValue
	clientName := strings.TrimSpace(c.FormValue("client_name"))
	clientEmail := strings.TrimSpace(strings.ToLower(c.FormValue("client_email")))
	servicePackage := strings.TrimSpace(c.FormValue("service_package"))
	projectGoal := strings.TrimSpace(c.FormValue("project_goal"))
	desiredTimeline := strings.TrimSpace(c.FormValue("desired_timeline"))
	assetsProvided := strings.TrimSpace(c.FormValue("assets_provided"))
	briefLink := strings.TrimSpace(c.FormValue("brief_link"))

	isDraft := c.FormValue("is_draft") == "true" || c.FormValue("is_draft") == "1"

	// ── Validation ────────────────────────────────────────────────────────
	if isDraft {
		if clientName == "" {
			clientName = "Draft Proposal"
		}
		if clientEmail == "" {
			clientEmail = currentUser.Email
		}
		if servicePackage == "" {
			servicePackage = "Website / Landing Page"
		}
		if assetsProvided == "" {
			assetsProvided = "Not Ready"
		}
	} else {
		// Strict validation for submitted proposals
		if clientName == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "client name is required"})
		}
		if clientEmail == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "client email is required"})
		}
		if _, err := mail.ParseAddress(clientEmail); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "client email is invalid"})
		}
		if servicePackage == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "service package is required"})
		}
		if projectGoal == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "project goal is required"})
		}
		if desiredTimeline == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "desired timeline is required"})
		}
		if assetsProvided == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "asset readiness is required"})
		}
	}

	// ── Ensure uploads directory exists ────────────────────────────────────
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Printf("Failed to create uploads dir: %v", err)
	}

	// ── Handle uploaded files (asset_files and brief_files) ─────────────────
	assetFilePaths := []string{}
	briefFilePaths := []string{}
	mf, err := c.MultipartForm()
	if err == nil && mf != nil {
		// Asset files (multi)
		if files, ok := mf.File["asset_files"]; ok {
			for _, fh := range files {
				ext := strings.ToLower(filepath.Ext(fh.Filename))
				if !allowedExtensions[ext] {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"message": fmt.Sprintf("File type %s is not allowed", ext),
					})
				}
				unique := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(fh.Filename))
				dest := filepath.Join("./uploads", unique)
				if err := c.SaveFile(fh, dest); err != nil {
					log.Printf("Failed to save asset file %s: %v", fh.Filename, err)
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"message": "Failed to save uploaded asset file",
					})
				}
				assetFilePaths = append(assetFilePaths, "/uploads/"+unique)
			}
		}

		// Brief files (multi: "brief_files" and "brief_file")
		var allBriefFiles []*multipart.FileHeader
		if files, ok := mf.File["brief_files"]; ok {
			allBriefFiles = append(allBriefFiles, files...)
		}
		if files, ok := mf.File["brief_file"]; ok {
			allBriefFiles = append(allBriefFiles, files...)
		}
		for _, fh := range allBriefFiles {
			ext := strings.ToLower(filepath.Ext(fh.Filename))
			if !allowedExtensions[ext] {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"message": fmt.Sprintf("Brief file type %s is not allowed", ext),
				})
			}
			unique := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(fh.Filename))
			dest := filepath.Join("./uploads", unique)
			if err := c.SaveFile(fh, dest); err != nil {
				log.Printf("Failed to save brief file: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"message": "Failed to save uploaded brief file",
				})
			}
			briefFilePaths = append(briefFilePaths, "/uploads/"+unique)
		}
	}

	// ── Parse link lists ────────────────────────────────────────────────────
	assetLinks := parseStringList(c, mf, "asset_links")
	briefLinks := parseStringList(c, mf, "brief_links")
	if singleBrief := strings.TrimSpace(c.FormValue("brief_link")); singleBrief != "" {
		found := false
		for _, bl := range briefLinks {
			if bl == singleBrief {
				found = true
				break
			}
		}
		if !found {
			briefLinks = append(briefLinks, singleBrief)
		}
	}

	if len(briefLinks) > 0 {
		briefLink = briefLinks[0]
	} else if len(briefFilePaths) > 0 {
		briefLink = briefFilePaths[0]
	}

	// ── Handle Draft Save ───────────────────────────────────────────────────
	if isDraft {
		submission, err := h.submissionRepo.Create(context.Background(), repositories.CreateSubmissionInput{
			UserID:                currentUser.ID,
			ClientName:            clientName,
			ClientEmail:           clientEmail,
			ServicePackage:        servicePackage,
			ProjectGoal:           projectGoal,
			DesiredTimeline:       desiredTimeline,
			AssetsProvided:        assetsProvided,
			ReadinessStatus:       models.ReadinessStatusMissingInfo,
			MissingItems:          []string{},
			AISummary:             "Draft proposal. Complete details and submit to receive AI evaluation.",
			RecommendedNextAction: "Submit proposal when ready to proceed with client onboarding.",
			AssetFiles:            assetFilePaths,
			AssetLinks:            assetLinks,
			BriefFiles:            briefFilePaths,
			BriefLinks:            briefLinks,
			BriefLink:             briefLink,
			IsDraft:               true,
		})
		if err != nil {
			log.Printf("Save draft in DB error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "Failed to save draft in database.",
			})
		}
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"submission": submission,
		})
	}

	// ── Build n8n input ─────────────────────────────────────────────────────
	form := services.N8NReadinessInput{
		ClientName:      clientName,
		ClientEmail:     clientEmail,
		ServicePackage:  servicePackage,
		ProjectGoal:     projectGoal,
		DesiredTimeline: desiredTimeline,
		AssetsProvided:  assetsProvided,
		AssetFiles:      assetFilePaths,
		AssetLinks:      assetLinks,
		BriefFiles:      briefFilePaths,
		BriefLinks:      briefLinks,
		BriefLink:       briefLink,
	}

	readiness, err := h.n8nService.CheckReadiness(context.Background(), form)
	if err != nil {
		log.Printf("n8n CheckReadiness error: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"message": "n8n checkReadiness failed: " + err.Error(),
		})
	}

	submission, err := h.submissionRepo.Create(context.Background(),
		*services.ReadinessToCreateSubmissionInput(currentUser.ID, form, readiness))

	if err != nil {
		log.Printf("Create submission in DB error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to save submission in database.",
		})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"submission": submission,
	})
}

func parseStringList(c fiber.Ctx, mf *multipart.Form, key string) []string {
	var result []string
	seen := make(map[string]bool)

	addItem := func(val string) {
		val = strings.TrimSpace(val)
		if val != "" && !seen[val] {
			seen[val] = true
			result = append(result, val)
		}
	}

	if mf != nil {
		if values, ok := mf.Value[key]; ok {
			for _, v := range values {
				v = strings.TrimSpace(v)
				if strings.HasPrefix(v, "[") && strings.HasSuffix(v, "]") {
					var arr []string
					if err := json.Unmarshal([]byte(v), &arr); err == nil {
						for _, item := range arr {
							addItem(item)
						}
						continue
					}
				}
				addItem(v)
			}
		}
	}

	raw := strings.TrimSpace(c.FormValue(key))
	if raw != "" {
		if strings.HasPrefix(raw, "[") && strings.HasSuffix(raw, "]") {
			var arr []string
			if err := json.Unmarshal([]byte(raw), &arr); err == nil {
				for _, item := range arr {
					addItem(item)
				}
			}
		} else {
			for _, part := range strings.Split(raw, ",") {
				addItem(part)
			}
		}
	}

	if result == nil {
		return []string{}
	}
	return result
}

// render only your submitted result
func (h *SubmissionHandler) ListMine(c fiber.Ctx) error {
	currentUser, ok := middleware.CurrentUserFromContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "unauthorized",
		})
	}
	submissions, err := h.submissionRepo.ListByUserID(context.Background(), currentUser.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to load submission",
		})
	}
	return c.JSON(fiber.Map{"submissions": submissions})
}

func (h *SubmissionHandler) GetMineByID(c fiber.Ctx) error {
	currentUser, ok := middleware.CurrentUserFromContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "unauthorized",
		})
	}
	submission, err := h.submissionRepo.FindByIDForUser(context.Background(), c.Params("id"), currentUser.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"message": "Submission not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to load submission",
		})
	}
	return c.JSON(fiber.Map{"submission": submission})
}

// DeleteDraft permanently deletes an unsubmitted draft belonging to current user
func (h *SubmissionHandler) DeleteDraft(c fiber.Ctx) error {
	currentUser, ok := middleware.CurrentUserFromContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "unauthorized",
		})
	}

	draftID := strings.TrimSpace(c.Params("id"))
	if draftID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "draft id is required",
		})
	}

	err := h.submissionRepo.DeleteDraft(context.Background(), draftID, currentUser.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"message": "Draft not found or cannot be deleted",
			})
		}
		log.Printf("DeleteDraft error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to delete draft",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Draft deleted successfully",
		"id":      draftID,
	})
}