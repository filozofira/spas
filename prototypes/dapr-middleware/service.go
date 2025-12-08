package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
)

var (
	receivedMessages []map[string]interface{}
	mu               sync.Mutex
)

// EventPayload represents a CloudEvent from DAPR
type EventPayload struct {
	DataContentType string                 `json:"datacontenttype"`
	Source          string                 `json:"source"`
	SpecVersion     string                 `json:"specversion"`
	Type            string                 `json:"type"`
	ID              string                 `json:"id"`
	Data            map[string]interface{} `json:"data"`
}

// HandleOrderEvent processes inbound order events from DAPR subscription
func HandleOrderEvent(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Service] Received event on %s", r.RequestURI)

	bodyBytes, _ := io.ReadAll(r.Body)
	var event EventPayload
	if err := json.Unmarshal(bodyBytes, &event); err != nil {
		log.Printf("[Service] Failed to parse event: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("[Service] Event type: %s", event.Type)
	log.Printf("[Service] Event data: %+v", event.Data)

	// Check for transformation marker
	mu.Lock()
	receivedMessages = append(receivedMessages, event.Data)
	mu.Unlock()

	if transformed, ok := event.Data["transformed_inbound"].(bool); ok && transformed {
		log.Printf("[Service] ✓ TRANSFORMATION DETECTED: transformed_inbound=true")
		log.Printf("[Service] ✓ Middleware executed AFTER subscription routing (correct!)")
	} else {
		log.Printf("[Service] ✗ WARNING: No transformation marker. Middleware may not have run.")
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}

// GetStats returns received events for verification
func GetStats(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"eventsReceived": len(receivedMessages),
		"events":         receivedMessages,
	})
}

// Health endpoint for DAPR
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	http.HandleFunc("/events/order", HandleOrderEvent)
	http.HandleFunc("/stats", GetStats)
	http.HandleFunc("/health", Health)

	log.Println("[Service] Starting on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("Service failed to start: %v", err)
	}
}
