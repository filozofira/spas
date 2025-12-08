package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
)

// DummyApp represents the SPAS service receiving requests from middleware
type DummyApp struct {
	receivedMessages []map[string]interface{}
}

// HandleInboundEvent processes inbound events from DAPR subscription
func (app *DummyApp) HandleInboundEvent(w http.ResponseWriter, r *http.Request) {
	log.Printf("[App] Received inbound event: %s %s", r.Method, r.RequestURI)

	bodyBytes, _ := io.ReadAll(r.Body)
	var payload map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		log.Printf("[App] Failed to parse payload: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("[App] Payload received: %+v", payload)

	// Verify transformation marker exists
	if transformed, ok := payload["transformed_inbound"].(bool); ok && transformed {
		log.Printf("[App] ✓ Inbound transformation confirmed (transformed_inbound=true)")
	} else {
		log.Printf("[App] ✗ WARNING: No transformation marker found!")
	}

	app.receivedMessages = append(app.receivedMessages, payload)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}

// HandlePublish simulates the app publishing an event (would call DAPR)
func (app *DummyApp) HandlePublish(w http.ResponseWriter, r *http.Request) {
	log.Printf("[App] Publishing event: %s %s", r.Method, r.RequestURI)

	bodyBytes, _ := io.ReadAll(r.Body)
	var payload map[string]interface{}
	json.Unmarshal(bodyBytes, &payload)

	log.Printf("[App] Publishing payload: %+v", payload)

	// In a real scenario, this would call DAPR publish API
	// For now, we just log it
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "published"})
}

// GetStats returns received messages for verification
func (app *DummyApp) GetStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"messagesReceived": len(app.receivedMessages),
		"messages":         app.receivedMessages,
	})
}

func main() {
	app := &DummyApp{
		receivedMessages: []map[string]interface{}{},
	}

	http.HandleFunc("/inbound", app.HandleInboundEvent)
	http.HandleFunc("/publish", app.HandlePublish)
	http.HandleFunc("/stats", app.GetStats)

	log.Println("[App] Starting on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("App failed to start: %v", err)
	}
}
