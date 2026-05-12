# Go 1.26 — latest as of May 2026
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o smartsched-api ./cmd/server

FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=builder /app/smartsched-api .
EXPOSE 8080
USER nonroot:nonroot
CMD ["./smartsched-api"]
