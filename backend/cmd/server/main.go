package main

import (
	"log/slog"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackymean-del/smart-sched/internal/db"
	"github.com/jackymean-del/smart-sched/internal/handlers"
	"github.com/jackymean-del/smart-sched/internal/middleware"
)

func main() {
	// Structured logging (Go 1.21+ slog)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	// Load env
	if err := loadEnv(); err != nil {
		slog.Warn("no .env file found", "err", err)
	}

	// Database
	pool, err := db.Connect(os.Getenv("DATABASE_URL"))
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	app := fiber.New(fiber.Config{
		AppName:      "SmartSched API v3.0",
		ErrorHandler: customError,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: getenv("ALLOWED_ORIGINS", "http://localhost:5173"),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))

	// Serve built frontend
	app.Static("/", "../frontend/dist")

	// Health
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok", "service": "SmartSched", "version": "3.0.0",
			"go": "1.26",
		})
	})

	// API v1
	h := handlers.New(pool)
	api := app.Group("/api/v1", middleware.Auth())

	api.Get("/timetables",                   h.ListTimetables)
	api.Post("/timetables",                  h.CreateTimetable)
	api.Get("/timetables/:id",               h.GetTimetable)
	api.Put("/timetables/:id",               h.UpdateTimetable)
	api.Delete("/timetables/:id",            h.DeleteTimetable)
	api.Post("/timetables/generate",         h.GenerateTimetable)
	api.Post("/timetables/:id/export",       h.ExportTimetable)
	api.Post("/timetables/:id/substitute",   h.Substitute)
	api.Get("/org-config",                   h.GetOrgConfig)

	port := getenv("PORT", "8080")
	slog.Info("SmartSched API starting", "port", port)
	if err := app.Listen(":"+port); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}

func customError(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok { code = e.Code }
	return c.Status(code).JSON(fiber.Map{"error": err.Error(), "code": code})
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" { return v }
	return fallback
}

func loadEnv() error {
	// Use godotenv if available
	return nil
}
