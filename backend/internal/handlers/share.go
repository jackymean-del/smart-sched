package handlers

import (
	"encoding/json"
	"log/slog"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// CreateShare stores a self-contained timetable snapshot and returns a public
// token. Registered under the authenticated API group — only signed-in users
// can create a share link.
func (h *Handler) CreateShare(c fiber.Ctx) error {
	var body struct {
		Title   string          `json:"title"`
		Payload json.RawMessage `json:"payload"`
	}
	if err := c.Bind().JSON(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	title := strings.TrimSpace(body.Title)
	if title == "" {
		title = "Timetable"
	}
	if len(body.Payload) == 0 || len(body.Payload) > 2_000_000 {
		return fiber.NewError(fiber.StatusBadRequest, "payload missing or too large")
	}

	token := strings.ReplaceAll(uuid.NewString(), "-", "")

	var createdBy any
	if uid, ok := c.Locals("user_id").(string); ok && uid != "" {
		createdBy = uid
	}

	_, err := h.db.Exec(c.Context(), `
		INSERT INTO shared_timetables (token, title, payload, created_by)
		VALUES ($1, $2, $3, $4)`,
		token, title, string(body.Payload), createdBy,
	)
	if err != nil {
		slog.Error("share: insert failed", "err", err)
		return fiber.NewError(fiber.StatusInternalServerError, "could not create share link")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"token": token})
}

// GetShare returns a shared timetable snapshot by token. Public — no auth.
func (h *Handler) GetShare(c fiber.Ctx) error {
	token := c.Params("token")
	if token == "" {
		return fiber.NewError(fiber.StatusBadRequest, "missing token")
	}

	var title string
	var payload []byte
	err := h.db.QueryRow(c.Context(), `
		SELECT title, payload FROM shared_timetables
		WHERE token = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
		token,
	).Scan(&title, &payload)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "this share link is invalid or has expired")
	}

	// Best-effort view counter — never block the response on it.
	_, _ = h.db.Exec(c.Context(), `UPDATE shared_timetables SET views = views + 1 WHERE token = $1`, token)

	return c.JSON(fiber.Map{"title": title, "timetable": json.RawMessage(payload)})
}
