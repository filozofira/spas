package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// TransformingMiddleware intercepts HTTP requests/responses for transformation
type TransformingMiddleware struct {
	targetURL string
}

// NewTransformingMiddleware creates a new middleware instance
func NewTransformingMiddleware(targetURL string) *TransformingMiddleware {
	return &TransformingMiddleware{
		targetURL: targetURL,
	}
}

// ServeHTTP implements http.Handler to intercept requests
func (tm *TransformingMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Middleware] Intercepted %s %s", r.Method, r.RequestURI)

	// Clone the request body for inspection
	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Log inbound payload
	var inboundPayload map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &inboundPayload); err == nil {
		log.Printf("[Middleware] Inbound payload: %+v", inboundPayload)
	}

	// Transform inbound payload (add marker for proof of transformation)
	var transformedPayload map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &transformedPayload); err != nil {
		log.Printf("[Middleware] Failed to unmarshal payload: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// INBOUND TRANSFORMATION: Add transformed_inbound marker
	transformedPayload["transformed_inbound"] = true
	transformedPayload["middleware_timestamp"] = "2025-12-08T00:00:00Z"

	transformedBody, _ := json.Marshal(transformedPayload)
	log.Printf("[Middleware] Transformed inbound payload: %s", string(transformedBody))

	// Create a new request to forward to the actual app
	targetReq, _ := http.NewRequest(r.Method, tm.targetURL+r.RequestURI, bytes.NewBuffer(transformedBody))
	targetReq.Header = r.Header
	targetReq.Header.Set("Content-Type", "application/json")

	// Execute request to actual app and capture response
	client := &http.Client{}
	targetResp, err := client.Do(targetReq)
	if err != nil {
		log.Printf("[Middleware] Error forwarding request: %v", err)
		http.Error(w, "Service unavailable", http.StatusBadGateway)
		return
	}
	defer targetResp.Body.Close()

	// Copy response back to client
	for key, values := range targetResp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(targetResp.StatusCode)
	io.Copy(w, targetResp.Body)

	log.Printf("[Middleware] Response sent with status %d", targetResp.StatusCode)
}

// ReverseProxyMiddleware uses httputil.ReverseProxy for outbound transformation
func ReverseProxyMiddleware(targetURL string) http.Handler {
	u, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(u)

	// Customize the director to log and inspect
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		log.Printf("[ReverseProxy] Intercepted %s %s", req.Method, req.RequestURI)

		// Read and inspect body
		bodyBytes, _ := io.ReadAll(req.Body)
		var payload map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &payload); err == nil {
			log.Printf("[ReverseProxy] Request payload: %+v", payload)
		}

		// OUTBOUND TRANSFORMATION: Mark for proof
		var transformedPayload map[string]interface{}
		json.Unmarshal(bodyBytes, &transformedPayload)
		transformedPayload["transformed_outbound"] = true
		transformedPayload["middleware_timestamp"] = "2025-12-08T00:00:00Z"

		transformedBody, _ := json.Marshal(transformedPayload)
		log.Printf("[ReverseProxy] Transformed outbound payload: %s", string(transformedBody))

		req.Body = io.NopCloser(bytes.NewBuffer(transformedBody))
		req.ContentLength = int64(len(transformedBody))

		originalDirector(req)
	}

	return proxy
}

// InterceptHandler wraps a handler to log and transform responses
func InterceptHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[Intercept] Request: %s %s", r.Method, r.RequestURI)

		// Check if this is a publish request to DAPR
		if strings.Contains(r.RequestURI, "/publish") || strings.Contains(r.RequestURI, "v1/publish") {
			bodyBytes, _ := io.ReadAll(r.Body)
			var payload map[string]interface{}
			json.Unmarshal(bodyBytes, &payload)

			// Transform outbound
			payload["transformed_outbound"] = true
			payload["middleware_timestamp"] = "2025-12-08T00:00:00Z"

			transformedBody, _ := json.Marshal(payload)
			log.Printf("[Intercept] Outbound publish transformed: %s", string(transformedBody))

			r.Body = io.NopCloser(bytes.NewBuffer(transformedBody))
			r.ContentLength = int64(len(transformedBody))
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	appTargetURL := "http://localhost:8081"

	// Middleware listens on port 8080 and forwards to the actual app on 8081
	middleware := NewTransformingMiddleware(appTargetURL)

	log.Println("[Middleware] Starting on :8080, forwarding to", appTargetURL)
	if err := http.ListenAndServe(":8080", middleware); err != nil {
		log.Fatalf("Middleware failed to start: %v", err)
	}
}
