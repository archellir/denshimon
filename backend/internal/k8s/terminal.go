package k8s

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
)

// TerminalSession represents a WebSocket terminal session
type TerminalSession struct {
	conn      *websocket.Conn
	sizeChan  chan *remotecommand.TerminalSize
	doneChan  chan struct{}
	ctx       context.Context
	cancel    context.CancelFunc
}

// TerminalMessage represents messages sent over WebSocket
type TerminalMessage struct {
	Type string      `json:"type"` // "data", "resize", "close"
	Data interface{} `json:"data"`
}

// TerminalSize represents terminal dimensions
type TerminalSize struct {
	Rows uint16 `json:"rows"`
	Cols uint16 `json:"cols"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Add proper origin checking for production
		return true
	},
}

// NewTerminalSession creates a new terminal session
func NewTerminalSession(w http.ResponseWriter, r *http.Request, clientset kubernetes.Interface, config *rest.Config) (*TerminalSession, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to upgrade WebSocket connection: %w", err)
	}

	ctx, cancel := context.WithCancel(r.Context())
	
	session := &TerminalSession{
		conn:     conn,
		sizeChan: make(chan *remotecommand.TerminalSize, 10),
		doneChan: make(chan struct{}),
		ctx:      ctx,
		cancel:   cancel,
	}

	return session, nil
}

// HandlePodExec handles WebSocket-based pod execution
func (c *Client) HandlePodExec(w http.ResponseWriter, r *http.Request) {
	// Extract parameters
	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")
	containerName := r.URL.Query().Get("container")
	command := r.URL.Query().Get("command")

	if namespace == "" || podName == "" {
		http.Error(w, "namespace and pod parameters are required", http.StatusBadRequest)
		return
	}

	if command == "" {
		command = "/bin/bash"
	}

	// Check if pod exists
	pod, err := c.clientset.CoreV1().Pods(namespace).Get(r.Context(), podName, metav1.GetOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to get pod: %v", err), http.StatusNotFound)
		return
	}

	// If no container specified, use the first one
	if containerName == "" && len(pod.Spec.Containers) > 0 {
		containerName = pod.Spec.Containers[0].Name
	}

	// Create terminal session
	session, err := NewTerminalSession(w, r, c.clientset, c.config)
	if err != nil {
		slog.Error("Failed to create terminal session", "error", err)
		http.Error(w, "Failed to create terminal session", http.StatusInternalServerError)
		return
	}

	// Start the exec session
	go session.handleExec(c, namespace, podName, containerName, []string{command})
	
	// Handle WebSocket messages
	session.handleWebSocketMessages()
}

// handleExec starts the kubectl exec session
func (ts *TerminalSession) handleExec(client *Client, namespace, podName, containerName string, command []string) {
	defer ts.close()

	// Create the exec request
	req := ts.getExecRequest(client, namespace, podName, containerName, command)
	
	executor, err := remotecommand.NewSPDYExecutor(ts.getRestConfig(client), "POST", req.URL())
	if err != nil {
		ts.sendError(fmt.Sprintf("Failed to create executor: %v", err))
		return
	}

	// Execute with streams
	err = executor.Stream(remotecommand.StreamOptions{
		Stdin:             ts,
		Stdout:            ts,
		Stderr:            ts,
		Tty:               true,
		TerminalSizeQueue: ts,
	})

	if err != nil {
		ts.sendError(fmt.Sprintf("Execution failed: %v", err))
	}
}

// handleWebSocketMessages processes incoming WebSocket messages
func (ts *TerminalSession) handleWebSocketMessages() {
	defer ts.close()

	for {
		select {
		case <-ts.ctx.Done():
			return
		default:
			var msg TerminalMessage
			if err := ts.conn.ReadJSON(&msg); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					slog.Error("WebSocket read error", "error", err)
				}
				return
			}

			switch msg.Type {
			case "data":
				// Send input to terminal
				if _, ok := msg.Data.(string); ok {
					// Input will be handled by the Read method
					select {
					case <-ts.ctx.Done():
						return
					default:
						// Store input for Read method to consume
						// This is handled by the WebSocket Read implementation
					}
				}
			case "resize":
				// Handle terminal resize
				if sizeData, ok := msg.Data.(map[string]interface{}); ok {
					if rows, ok := sizeData["rows"].(float64); ok {
						if cols, ok := sizeData["cols"].(float64); ok {
							ts.resize(uint16(rows), uint16(cols))
						}
					}
				}
			case "close":
				return
			}
		}
	}
}

// Implement io.Reader for stdin
func (ts *TerminalSession) Read(p []byte) (int, error) {
	// Read data from WebSocket and pass to kubectl exec
	var msg TerminalMessage
	if err := ts.conn.ReadJSON(&msg); err != nil {
		return 0, err
	}

	if msg.Type == "data" {
		if data, ok := msg.Data.(string); ok {
			n := copy(p, []byte(data))
			return n, nil
		}
	}

	return 0, io.EOF
}

// Implement io.Writer for stdout/stderr
func (ts *TerminalSession) Write(p []byte) (int, error) {
	// Send output to WebSocket client
	msg := TerminalMessage{
		Type: "data",
		Data: string(p),
	}

	if err := ts.conn.WriteJSON(msg); err != nil {
		return 0, err
	}

	return len(p), nil
}

// Implement remotecommand.TerminalSizeQueue
func (ts *TerminalSession) Next() *remotecommand.TerminalSize {
	select {
	case size := <-ts.sizeChan:
		return size
	case <-ts.doneChan:
		return nil
	}
}

// resize sends a terminal resize event
func (ts *TerminalSession) resize(rows, cols uint16) {
	select {
	case ts.sizeChan <- &remotecommand.TerminalSize{
		Width:  cols,
		Height: rows,
	}:
	case <-ts.doneChan:
	}
}

// sendError sends an error message to the client
func (ts *TerminalSession) sendError(message string) {
	msg := TerminalMessage{
		Type: "error",
		Data: message,
	}
	ts.conn.WriteJSON(msg)
}

// close terminates the terminal session
func (ts *TerminalSession) close() {
	ts.cancel()
	close(ts.doneChan)
	ts.conn.Close()
}

// getExecRequest creates the exec request
func (ts *TerminalSession) getExecRequest(client *Client, namespace, podName, containerName string, command []string) *rest.Request {
	return client.clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec").
		VersionedParams(&v1.PodExecOptions{
			Container: containerName,
			Command:   command,
			Stdin:     true,
			Stdout:    true,
			Stderr:    true,
			TTY:       true,
		}, scheme.ParameterCodec)
}

// getRestConfig returns the REST config
func (ts *TerminalSession) getRestConfig(client *Client) *rest.Config {
	return client.config
}

// HandlePodPortForward handles port forwarding requests
func (c *Client) HandlePodPortForward(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")
	localPort := r.URL.Query().Get("localPort")
	remotePort := r.URL.Query().Get("remotePort")

	if namespace == "" || podName == "" || localPort == "" || remotePort == "" {
		http.Error(w, "namespace, pod, localPort, and remotePort parameters are required", http.StatusBadRequest)
		return
	}

	// TODO: Implement port forwarding
	// This requires setting up a port forwarding tunnel
	// and managing the connection lifecycle

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "port forwarding not yet implemented"}`))
}

// HandlePodLogs handles advanced log streaming with filtering
func (c *Client) HandlePodLogs(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")
	containerName := r.URL.Query().Get("container")
	follow := r.URL.Query().Get("follow") == "true"
	tailLines := r.URL.Query().Get("tailLines")
	sinceSeconds := r.URL.Query().Get("sinceSeconds")

	if namespace == "" || podName == "" {
		http.Error(w, "namespace and pod parameters are required", http.StatusBadRequest)
		return
	}

	// Set up log options
	logOptions := &v1.PodLogOptions{
		Container: containerName,
		Follow:    follow,
	}

	// Parse tail lines
	if tailLines != "" {
		// Parse and set tail lines
	}

	// Parse since seconds
	if sinceSeconds != "" {
		// Parse and set since seconds
	}

	// Get log stream
	logStream, err := c.clientset.CoreV1().Pods(namespace).GetLogs(podName, logOptions).Stream(r.Context())
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to get log stream: %v", err), http.StatusInternalServerError)
		return
	}
	defer logStream.Close()

	// Set headers for streaming
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Stream logs to client
	if _, err := io.Copy(w, logStream); err != nil {
		slog.Error("Failed to stream logs", "error", err)
	}
}

// HandleFileUpload handles file upload to pods
func (c *Client) HandleFileUpload(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement file upload using kubectl cp equivalent
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "file upload not yet implemented"}`))
}

// HandleFileDownload handles file download from pods  
func (c *Client) HandleFileDownload(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement file download using kubectl cp equivalent
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "file download not yet implemented"}`))
}