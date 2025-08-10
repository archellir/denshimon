# Multi-stage build for production
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY frontend/ .
RUN pnpm run build

# Go builder stage
FROM golang:1.24-alpine AS backend-builder

# Install build dependencies for CGO (SQLite)
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .
# Copy built frontend assets for embedding
COPY --from=frontend-builder /app/frontend/dist ./cmd/server/spa/

RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o denshimon cmd/server/main.go

# Final minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl
WORKDIR /app

# Create non-root user and data directory
RUN addgroup -g 1001 -S denshimon && \
    adduser -u 1001 -S denshimon -G denshimon && \
    mkdir -p /app/data && \
    chown -R denshimon:denshimon /app/data

# Copy the binary
COPY --from=backend-builder /app/denshimon .
RUN chown denshimon:denshimon denshimon

USER denshimon

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./denshimon"]