# Multi-stage build for minimal production image
FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy frontend files
COPY ../frontend/package.json ../frontend/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY ../frontend/ ./
RUN pnpm run build

# Go backend builder
FROM golang:1.24-alpine AS backend-builder

# Install git for go modules
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o server ./cmd/server

# Final production image
FROM scratch

# Copy CA certificates for HTTPS requests
COPY --from=backend-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=backend-builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy built backend binary
COPY --from=backend-builder /app/server /app/server

# Copy built frontend static files
COPY --from=frontend-builder /app/dist /app/static

# Create non-root user (using numeric IDs for scratch image)
USER 65534:65534

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/app/server", "-health-check"]

# Run the binary
ENTRYPOINT ["/app/server"]