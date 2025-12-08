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

// DaprMiddleware intercepts DAPR pub/sub delivery to the service
type DaprMiddleware struct {
	serviceURL string
}

// ServeHTTP implements the middleware handler
func (dm *DaprMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("[Middleware] Intercepted %s %s", r.Method, r.RequestURI)

	// Check if this is a subscription delivery from DAPR
	if strings.Contains(r.RequestURI, "/events/") {
		log.Printf("[Middleware] Detected subscription event delivery")

		// Read and modify the event payload
		bodyBytes, _ := io.ReadAll(r.Body)
		var event map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &event); err == nil {
			log.Printf("[Middleware] Original event data: %+v", event)

			// Extract data field and add transformation marker
			if dataField, ok := event["data"].(map[string]interface{}); ok {
				dataField["transformed_inbound"] = true
				dataField["middleware_timestamp"] = "2025-12-08T00:00:00Z"
				log.Printf("[Middleware] ✓ Transformed event data: %+v", dataField)

				// Re-marshal and update body
				transformedBody, _ := json.Marshal(event)
				r.Body = io.NopCloser(bytes.NewBuffer(transformedBody))
				r.ContentLength = int64(len(transformedBody))
			}
		}
	}

	// Forward to actual service
	u, _ := url.Parse(dm.serviceURL)
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.ServeHTTP(w, r)
}

func main() {
	serviceURL := "http://spas-service:8081"

	middleware := &DaprMiddleware{
		serviceURL: serviceURL,
	}

	log.Println("[Middleware] Starting on :8080, forwarding to", serviceURL)
	if err := http.ListenAndServe(":8080", middleware); err != nil {
		log.Fatalf("Middleware failed to start: %v", err)
	}
}
