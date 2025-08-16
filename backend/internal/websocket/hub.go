package websocket

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// MessageType represents different types of messages
type MessageType string

const (
	MessageTypeHeartbeat      MessageType = "heartbeat"
	MessageTypeConnection     MessageType = "connection"
	MessageTypeMetrics        MessageType = "metrics"
	MessageTypeLogs           MessageType = "logs"
	MessageTypeEvents         MessageType = "events"
	MessageTypeWorkflows      MessageType = "workflows"
	MessageTypePods           MessageType = "pods"
	MessageTypeServices       MessageType = "services"
	MessageTypeDeployments    MessageType = "deployments"
	MessageTypeAlerts         MessageType = "alerts"
	MessageTypeGiteaWebhook   MessageType = "gitea_webhook"
	MessageTypeGithubWebhook  MessageType = "github_webhook"
	MessageTypePipelineUpdate MessageType = "pipeline_update"
	MessageTypePing           MessageType = "ping"
	MessageTypePong           MessageType = "pong"
	MessageTypeNetwork        MessageType = "network"
	MessageTypeStorage        MessageType = "storage"
	MessageTypeDatabase       MessageType = "database"
	MessageTypeDatabaseStats  MessageType = "database_stats"
	MessageTypeServiceHealth  MessageType = "service_health"
	MessageTypeServiceHealthStats MessageType = "service_health_stats"
)

// Message represents a WebSocket message
type Message struct {
	Type      MessageType `json:"type"`
	Timestamp string      `json:"timestamp"`
	Data      interface{} `json:"data"`
}

// Client represents a WebSocket client
type Client struct {
	ID            string
	Conn          *websocket.Conn
	Hub           *Hub
	Send          chan Message
	UserID        string // For authentication tracking
	Subscriptions map[MessageType]bool
	mu            sync.RWMutex
}

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	slog.Info("WebSocket hub started")
	defer slog.Info("WebSocket hub stopped")

	// Start periodic cleanup and heartbeat
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-h.ctx.Done():
			return

		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			slog.Info("Client connected", "client_id", client.ID, "user_id", client.UserID, "total_clients", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			slog.Info("Client disconnected", "client_id", client.ID, "user_id", client.UserID, "total_clients", len(h.clients))

		case message := <-h.broadcast:
			h.broadcastMessage(message)

		case <-ticker.C:
			// Send ping to all clients
			h.sendPing()
		}
	}
}

// broadcastMessage sends a message to all subscribed clients
func (h *Hub) broadcastMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		client.mu.RLock()
		isSubscribed := client.Subscriptions[message.Type]
		client.mu.RUnlock()

		if isSubscribed {
			select {
			case client.Send <- message:
			default:
				// Client channel is full, close it
				close(client.Send)
				delete(h.clients, client)
				slog.Warn("Client channel full, disconnecting", "client_id", client.ID)
			}
		}
	}
}

// sendPing sends ping messages to all clients
func (h *Hub) sendPing() {
	pingMessage := Message{
		Type:      MessageTypeHeartbeat,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data:      map[string]interface{}{"heartbeat": true},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		select {
		case client.Send <- pingMessage:
		default:
			// Skip if channel is full
		}
	}
}

// Broadcast sends a message to all subscribed clients
func (h *Hub) Broadcast(messageType MessageType, data interface{}) {
	message := Message{
		Type:      messageType,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data:      data,
	}

	select {
	case h.broadcast <- message:
	default:
		slog.Warn("Broadcast channel full, dropping message", "type", messageType)
	}
}

// BroadcastToUser sends a message to specific user's clients
func (h *Hub) BroadcastToUser(userID string, messageType MessageType, data interface{}) {
	message := Message{
		Type:      messageType,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data:      data,
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.UserID == userID {
			client.mu.RLock()
			isSubscribed := client.Subscriptions[messageType]
			client.mu.RUnlock()

			if isSubscribed {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
					slog.Warn("Client channel full, disconnecting", "client_id", client.ID)
				}
			}
		}
	}
}

// GetConnectedClients returns the number of connected clients
func (h *Hub) GetConnectedClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetClientsByUser returns the number of clients for a specific user
func (h *Hub) GetClientsByUser(userID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	count := 0
	for client := range h.clients {
		if client.UserID == userID {
			count++
		}
	}
	return count
}

// Shutdown gracefully shuts down the hub
func (h *Hub) Shutdown() {
	slog.Info("Shutting down WebSocket hub")
	h.cancel()

	h.mu.Lock()
	defer h.mu.Unlock()

	// Close all client connections
	for client := range h.clients {
		close(client.Send)
		client.Conn.Close()
	}
}

// NewClient creates a new WebSocket client
func NewClient(conn *websocket.Conn, hub *Hub, userID string) *Client {
	return &Client{
		ID:            generateClientID(),
		Conn:          conn,
		Hub:           hub,
		Send:          make(chan Message, 256),
		UserID:        userID,
		Subscriptions: make(map[MessageType]bool),
	}
}

// Subscribe adds a subscription for a message type
func (c *Client) Subscribe(messageType MessageType) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Subscriptions[messageType] = true
	slog.Debug("Client subscribed", "client_id", c.ID, "type", messageType)
}

// Unsubscribe removes a subscription for a message type
func (c *Client) Unsubscribe(messageType MessageType) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.Subscriptions, messageType)
	slog.Debug("Client unsubscribed", "client_id", c.ID, "type", messageType)
}

// IsSubscribed checks if client is subscribed to a message type
func (c *Client) IsSubscribed(messageType MessageType) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Subscriptions[messageType]
}

// SendMessage sends a message directly to this client
func (c *Client) SendMessage(messageType MessageType, data interface{}) {
	message := Message{
		Type:      messageType,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data:      data,
	}

	select {
	case c.Send <- message:
	default:
		slog.Warn("Client send channel full", "client_id", c.ID)
	}
}

// ReadPump handles incoming WebSocket messages from the client
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg map[string]interface{}
		if err := c.Conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket error", "client_id", c.ID, "error", err)
			}
			break
		}

		// Handle client messages (subscriptions, pings, etc.)
		c.handleClientMessage(msg)
	}
}

// WritePump handles outgoing WebSocket messages to the client
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second) // Send ping every 54 seconds
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				slog.Error("Error writing message", "client_id", c.ID, "error", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleClientMessage processes messages from the client
func (c *Client) handleClientMessage(msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "subscribe":
		if messageType, ok := msg["message_type"].(string); ok {
			c.Subscribe(MessageType(messageType))
		}

	case "unsubscribe":
		if messageType, ok := msg["message_type"].(string); ok {
			c.Unsubscribe(MessageType(messageType))
		}

	case "ping":
		// Respond with pong
		c.SendMessage(MessageTypePong, map[string]interface{}{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})

	default:
		slog.Debug("Unknown message type from client", "client_id", c.ID, "type", msgType)
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
