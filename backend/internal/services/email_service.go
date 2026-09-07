package services

import (
	"backend/internal/config"
	"backend/internal/models"
	"crypto/tls"
	"fmt"
	"html"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"
)

type EmailService struct {
	host       string
	port       string
	user       string
	pass       string
	from       string
	meetingURL string
}

func NewEmailService(cfg config.Config) *EmailService {
	from := strings.TrimSpace(cfg.SMTPFrom)
	if from == "" {
		from = strings.TrimSpace(cfg.SMTPUser)
	}
	if from == "" {
		from = "no-reply@onboarding.local"
	}

	// For Gmail: SMTP_USER is the login email. If not set separately, fall back to SMTP_FROM.
	user := strings.TrimSpace(cfg.SMTPUser)
	if user == "" {
		user = from
	}

	return &EmailService{
		host:       strings.TrimSpace(cfg.SMTPHost),
		port:       strings.TrimSpace(cfg.SMTPPort),
		user:       user,
		pass:       strings.TrimSpace(cfg.SMTPPass),
		from:       from,
		meetingURL: strings.TrimSpace(cfg.MeetingURL),
	}
}

func (s *EmailService) SendApprovalWelcomeEmail(sub *models.Submission) error {
	if sub == nil || strings.TrimSpace(sub.ClientEmail) == "" {
		return fmt.Errorf("client email is missing")
	}

	clientName := html.EscapeString(strings.TrimSpace(sub.ClientName))
	if clientName == "" {
		clientName = "there"
	}

	servicePackage := html.EscapeString(strings.TrimSpace(sub.ServicePackage))
	projectGoal := html.EscapeString(strings.TrimSpace(sub.ProjectGoal))
	desiredTimeline := html.EscapeString(strings.TrimSpace(sub.DesiredTimeline))

	subject := fmt.Sprintf("Great news! We'd love to work with you — Let's schedule a kickoff meeting (%s)", sub.ClientName)

	meetingSection := ""
	if s.meetingURL != "" {
		meetingSection = fmt.Sprintf(`
			<div style="margin: 28px 0; text-align: center;">
				<a href="%s" style="background-color: #16a34a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					📅 Schedule Kickoff Meeting
				</a>
				<p style="margin-top: 12px; font-size: 13px; color: #6b7280;">Or simply reply to this email with 2-3 convenient dates and times that work for you.</p>
			</div>
		`, html.EscapeString(s.meetingURL))
	} else {
		meetingSection = `
			<div style="background-color: #f3f4f6; border-left: 4px solid #16a34a; padding: 16px 20px; margin: 24px 0; border-radius: 2px;">
				<p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Next Step: Schedule a Kickoff Meeting</p>
				<p style="margin: 6px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
					Please reply directly to this email with <strong>2 to 3 convenient dates and times</strong> that suit your schedule this week, and we will send over a calendar invite!
				</p>
			</div>
		`
	}

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>%s</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
	<table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 16px;">
		<tr>
			<td align="center">
				<table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
					<!-- Header Banner -->
					<tr>
						<td style="background-color: #111827; padding: 28px 36px; text-align: left;">
							<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.025em;">
								Onboarding Proposal Accepted 🎉
							</h1>
						</td>
					</tr>

					<!-- Content Area -->
					<tr>
						<td style="padding: 36px;">
							<p style="font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
								Hi <strong>%s</strong>,
							</p>
							<p style="font-size: 15px; margin: 0 0 20px 0; line-height: 1.6; color: #374151;">
								Great news! Our team has reviewed your onboarding request and we are thrilled to confirm that <strong>we would love to work with you</strong> on this project.
							</p>

							<!-- Proposal Details Box -->
							<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 20px; margin: 24px 0;">
								<p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Project Details</p>
								<table width="100%%" style="font-size: 14px;">
									<tr>
										<td style="padding: 4px 0; color: #64748b; width: 120px;"><strong>Package:</strong></td>
										<td style="padding: 4px 0; color: #0f172a; font-weight: 500;">%s</td>
									</tr>
									<tr>
										<td style="padding: 4px 0; color: #64748b;"><strong>Timeline:</strong></td>
										<td style="padding: 4px 0; color: #0f172a; font-weight: 500;">%s</td>
									</tr>
									<tr>
										<td style="padding: 4px 0; color: #64748b; vertical-align: top;"><strong>Goal:</strong></td>
										<td style="padding: 4px 0; color: #0f172a;">%s</td>
									</tr>
								</table>
							</div>

							<!-- Meeting Scheduling Section -->
							%s

							<p style="font-size: 14px; margin: 24px 0 0 0; line-height: 1.6; color: #4b5563;">
								During this meeting, we will walk through deliverables, milestones, access requirements, and finalize the roadmap so we can hit the ground running.
							</p>

							<p style="font-size: 14px; margin: 28px 0 0 0; line-height: 1.6; color: #374151;">
								Looking forward to building something exceptional together!<br>
								<strong>The Team</strong>
							</p>
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>
</body>
</html>`, subject, clientName, servicePackage, desiredTimeline, projectGoal, meetingSection)

	// If SMTP password is not configured, log formatted notification to console
	if s.pass == "" {
		log.Printf("\n=======================================================\n"+
			"✉️  [CLIENT WELCOME EMAIL - APPROVAL NOTIFICATION]\n"+
			"To: %s\n"+
			"Subject: %s\n"+
			"Status: LOGGED TO CONSOLE (To send real Gmail, configure SMTP_PASS in backend/.env)\n"+
			"=======================================================",
			sub.ClientEmail, subject)
		return nil
	}

	// Send via SMTP
	log.Printf("[EmailService] Sending welcome email to %s via Gmail SMTP (%s)...", sub.ClientEmail, s.from)
	if err := s.sendSMTP(sub.ClientEmail, subject, htmlBody); err != nil {
		log.Printf("\n=======================================================\n"+
			"❌ [CLIENT WELCOME EMAIL - FAILED TO SEND]\n"+
			"To: %s\n"+
			"Error: %v\n"+
			"=======================================================",
			sub.ClientEmail, err)
		return err
	}

	log.Printf("\n=======================================================\n"+
		"✉️  [CLIENT WELCOME EMAIL - SENT SUCCESSFULLY]\n"+
		"From: %s\n"+
		"To: %s\n"+
		"Subject: %s\n"+
		"Status: ✅ DELIVERED TO GMAIL SMTP SERVER\n"+
		"=======================================================",
		s.from, sub.ClientEmail, subject)
	return nil
}

func (s *EmailService) sendSMTP(toEmail, subject, bodyHTML string) error {
	addr := net.JoinHostPort(s.host, s.port)
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("Onboarding <%s>", s.from)
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["Date"] = time.Now().Format(time.RFC1123Z)
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"UTF-8\""

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n" + bodyHTML)

	// Port 587 uses STARTTLS
	if s.port == "587" {
		client, err := smtp.Dial(addr)
		if err != nil {
			return fmt.Errorf("smtp dial %s failed: %w", addr, err)
		}
		defer client.Close()

		tlsConfig := &tls.Config{
			ServerName: s.host,
		}

		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("start tls failed: %w", err)
		}

		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth failed: %w", err)
		}

		if err := client.Mail(s.from); err != nil {
			return fmt.Errorf("mail from failed: %w", err)
		}
		if err := client.Rcpt(toEmail); err != nil {
			return fmt.Errorf("rcpt to failed: %w", err)
		}

		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("data writer failed: %w", err)
		}
		if _, err := w.Write([]byte(msg.String())); err != nil {
			return fmt.Errorf("write email body failed: %w", err)
		}
		if err := w.Close(); err != nil {
			return fmt.Errorf("close email data failed: %w", err)
		}

		return client.Quit()
	}

	// Standard fallback
	return smtp.SendMail(addr, auth, s.from, []string{toEmail}, []byte(msg.String()))
}
