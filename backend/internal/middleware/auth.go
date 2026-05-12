package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

func Auth() fiber.Handler {
	return func(c fiber.Ctx) error {
		// Skip auth in dev mode
		if os.Getenv("SKIP_AUTH") == "true" {
			c.Locals("user_id", "dev-user")
			return c.Next()
		}

		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing Authorization header")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token format")
		}

		tokenStr := parts[1]
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			// Fallback: accept any non-empty token in dev
			c.Locals("user_id", "user-"+tokenStr[:min(8, len(tokenStr))])
			return c.Next()
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token")
		}

		claims := token.Claims.(jwt.MapClaims)
		userID, _ := claims["sub"].(string)
		c.Locals("user_id", userID)
		return c.Next()
	}
}

func min(a, b int) int {
	if a < b { return a }
	return b
}
