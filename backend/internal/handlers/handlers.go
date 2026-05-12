package handlers

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct{ db *pgxpool.Pool }

func New(db *pgxpool.Pool) *Handler { return &Handler{db: db} }

func (h *Handler) ListTimetables(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	_ = userID
	// TODO: SELECT * FROM timetables WHERE user_id = $1
	return c.JSON(fiber.Map{"timetables": []fiber.Map{}, "total": 0})
}

func (h *Handler) CreateTimetable(c fiber.Ctx) error {
	var body struct {
		Name    string `json:"name"`
		OrgType string `json:"org_type"`
		Country string `json:"country"`
		Config  any    `json:"config"`
	}
	if err := c.Bind().JSON(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}
	// TODO: INSERT INTO timetables
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id": uuid.New().String(), "name": body.Name,
		"org_type": body.OrgType, "country": body.Country,
		"created_at": time.Now().UTC(),
	})
}

func (h *Handler) GetTimetable(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"id": c.Params("id")})
}

func (h *Handler) UpdateTimetable(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"id": c.Params("id"), "updated": true})
}

func (h *Handler) DeleteTimetable(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"id": c.Params("id"), "deleted": true})
}

func (h *Handler) GenerateTimetable(c fiber.Ctx) error {
	var req struct {
		OrgType  string `json:"org_type"`
		Country  string `json:"country"`
		Sections []any  `json:"sections"`
		Staff    []any  `json:"staff"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request")
	}
	jobID := uuid.New().String()
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"job_id": jobID, "status": "queued",
		"estimated_seconds": 5,
		"poll_url": "/api/v1/jobs/" + jobID,
	})
}

func (h *Handler) ExportTimetable(c fiber.Ctx) error {
	format := c.Query("format", "xlsx")
	return c.JSON(fiber.Map{
		"id": c.Params("id"), "format": format,
		"download_url": "/exports/" + c.Params("id") + "." + format,
	})
}

func (h *Handler) Substitute(c fiber.Ctx) error {
	var req struct {
		AbsentStaff string `json:"absent_staff"`
		Day         string `json:"day"`
	}
	c.Bind().JSON(&req)
	return c.JSON(fiber.Map{
		"timetable_id": c.Params("id"),
		"absent": req.AbsentStaff, "day": req.Day,
		"suggestions": []fiber.Map{},
	})
}

func (h *Handler) GetOrgConfig(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"org_type": c.Query("org_type", "school"),
		"country":  c.Query("country", "IN"),
		"norms": fiber.Map{"max_periods_week": 36, "max_periods_day": 6, "hours_week": 40},
	})
}
