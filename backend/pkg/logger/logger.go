// Package logger provides a centralized structured logger for the application.
package logger

import (
	"log/slog"
	"os"
)

// New creates a new structured logger with the specified level.
// The logger outputs structured JSON for better parsing and analysis.
func New(level slog.Level) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: level,
	}
	
	handler := slog.NewJSONHandler(os.Stdout, opts)
	return slog.New(handler)
}

// NewDevelopment creates a logger suitable for development with text output.
func NewDevelopment() *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}
	
	handler := slog.NewTextHandler(os.Stdout, opts)
	return slog.New(handler)
}