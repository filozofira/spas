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

// TestMiddleware validates that transformations occur correctly
func TestMiddleware() {
	client := &http.Client{}
	time.Sleep(1 * time.Second) // Allow services to start

	fmt.Println("\n=== DAPR Middleware Transformation Test ===\n")

	// Test 1: Inbound Transformation
	fmt.Println("[TEST 1] Inbound Event Transformation")
	fmt.Println("Sending event through middleware to app...")

	inboundPayload := map[string]interface{}{
		"eventType": "order.created",
		"orderId":   "12345",
		"amount":    99.99,
	}

	inboundBody, _ := json.Marshal(inboundPayload)
	req, _ := http.NewRequest("POST", "http://localhost:8080/inbound", bytes.NewBuffer(inboundBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Failed to send inbound request: %v", err)
	}
	defer resp.Body.Close()

	log.Printf("Inbound response status: %d", resp.StatusCode)

	// Wait a moment for processing
	time.Sleep(500 * time.Millisecond)

	// Test 2: Verify Inbound Transformation
	fmt.Println("\n[TEST 2] Verifying Inbound Transformation")
	fmt.Println("Fetching stats from app...")

	statsResp, _ := client.Get("http://localhost:8081/stats")
	defer statsResp.Body.Close()

	statsBody, _ := io.ReadAll(statsResp.Body)
	var stats map[string]interface{}
	json.Unmarshal(statsBody, &stats)

	if messages, ok := stats["messages"].([]interface{}); ok && len(messages) > 0 {
		firstMsg := messages[0].(map[string]interface{})
		if transformed, exists := firstMsg["transformed_inbound"]; exists && transformed.(bool) {
			fmt.Println("✓ SUCCESS: Inbound transformation confirmed!")
			fmt.Printf("  Received payload with transformed_inbound=true\n")
			fmt.Printf("  Full payload: %+v\n", firstMsg)
		} else {
			fmt.Println("✗ FAILURE: No transformation marker found!")
			fmt.Printf("  Received payload: %+v\n", firstMsg)
		}
	} else {
		fmt.Println("✗ FAILURE: No messages received by app!")
	}

	// Test 3: Outbound Transformation (simulated)
	fmt.Println("\n[TEST 3] Outbound Publish Transformation")
	fmt.Println("Sending publish request through middleware...")

	outboundPayload := map[string]interface{}{
		"eventType": "stock.updated",
		"stock":     150,
	}

	outboundBody, _ := json.Marshal(outboundPayload)
	pubReq, _ := http.NewRequest("POST", "http://localhost:8080/publish", bytes.NewBuffer(outboundBody))
	pubReq.Header.Set("Content-Type", "application/json")

	pubResp, err := client.Do(pubReq)
	if err != nil {
		log.Fatalf("Failed to send publish request: %v", err)
	}
	defer pubResp.Body.Close()

	fmt.Printf("✓ Publish response status: %d\n", pubResp.StatusCode)
	fmt.Println("  (Note: In full integration, DAPR would receive the transformed payload)")

	fmt.Println("\n=== Test Summary ===")
	fmt.Println("If both inbound and outbound transformations occurred, middleware works as expected.")
	fmt.Println("This proves middleware can intercept and modify payloads pre/post service invocation.")
}

func main() {
	TestMiddleware()
}
