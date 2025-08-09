package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/archellir/k8s-webui/internal/gitops"
)

type Server struct {
	gitopsService *gitops.Service
}

func NewServer(gitopsService *gitops.Service) *Server {
	return &Server{
		gitopsService: gitopsService,
	}
}

func (s *Server) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"Internal Server Error"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func (s *Server) respondWithError(w http.ResponseWriter, code int, message string) {
	s.respondWithJSON(w, code, map[string]string{
		"error": message,
	})
}

func (s *Server) extractIDFromPath(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}

	id := strings.TrimPrefix(path, prefix)
	if id == "" {
		return ""
	}

	// Remove any trailing path elements (like /sync)
	parts := strings.Split(id, "/")
	return parts[0]
}