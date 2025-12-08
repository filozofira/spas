package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// CloudEvent represents a DAPR CloudEvent
type CloudEvent struct {
	SpecVersion     string                 `json:"specversion"`
	Type            string                 `json:"type"`
	Source          string                 `json:"source"`
	ID              string                 `json:"id"`
	Time            string                 `json:"time"`
	DataContentType string                 `json:"datacontenttype"`
	Data            map[string]interface{} `json:"data"`
}

func main() {
	fmt.Println("=== DAPR Middleware Validation Test ===\n")

	// DAPR sidecar address
	daprURL := "http://dapr-sidecar:3500"
	client := &http.Client{Timeout: 10 * time.Second}

	// Test 1: Publish event through DAPR
	fmt.Println("[TEST 1] Publishing event through DAPR...")
	fmt.Println("Event path: dapr-sidecar:3500/v1.0/publish/pubsub/orders")

	event := CloudEvent{
		SpecVersion:     "1.0",
		Type:            "com.example.order.created",
		Source:          "order-service",
		ID:              "order-123",
		Time:            time.Now().Format(time.RFC3339),
		DataContentType: "application/json",
		Data: map[string]interface{}{
			"orderId": "12345",
			"amount":  99.99,
			"customer": "John Doe",
		},
	}

	eventBody, _ := json.Marshal(event)
	fmt.Printf("Publishing payload: %s\n\n", string(eventBody))

	publishURL := fmt.Sprintf("%s/v1.0/publish/pubsub/orders", daprURL)
	req, _ := http.NewRequest("POST", publishURL, bytes.NewBuffer(eventBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Failed to publish event: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 || resp.StatusCode == 204 {
		fmt.Printf("✓ Event published successfully (status: %d)\n", resp.StatusCode)
	} else {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("✗ Publish failed (status: %d): %s\n", resp.StatusCode, string(body))
	}

	// Wait for event to be processed
	time.Sleep(2 * time.Second)

	// Test 2: Check service received the event
	fmt.Println("\n[TEST 2] Verifying service received transformed event...")

	statsURL := "http://spas-service:8081/stats"
	statsResp, err := client.Get(statsURL)
	if err != nil {
		log.Fatalf("Failed to get service stats: %v", err)
	}
	defer statsResp.Body.Close()

	statsBody, _ := io.ReadAll(statsResp.Body)
	var stats map[string]interface{}
	json.Unmarshal(statsBody, &stats)

	if events, ok := stats["events"].([]interface{}); ok && len(events) > 0 {
		fmt.Printf("Service received %d event(s)\n", len(events))

		firstEvent := events[0].(map[string]interface{})
		fmt.Printf("First event data: %+v\n", firstEvent)

		if transformed, exists := firstEvent["transformed_inbound"]; exists && transformed.(bool) {
			fmt.Println("\n✓✓✓ SUCCESS ✓✓✓")
			fmt.Println("Middleware CORRECTLY transformed the event!")
			fmt.Println("This proves middleware executed AFTER DAPR subscription routing.")
		} else {
			fmt.Println("\n⚠️  No transformation marker found.")
			fmt.Println("This could mean:")
			fmt.Println("  1. Middleware didn't run")
			fmt.Println("  2. Middleware runs before subscription routing (wrong timing)")
			fmt.Println("  3. Middleware is not registered correctly")
		}
	} else {
		fmt.Println("\n✗ Service didn't receive any events!")
		fmt.Println("Subscription routing may not be working.")
	}

	fmt.Println("\n=== Test Complete ===")
}
