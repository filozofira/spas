package io.spas.sdk.events;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * HTTP client wrapper for communicating with the SPAS sidecar.
 */
public final class SidecarClient {
    private final HttpClient httpClient;
    private final String baseUrl;
    private final Duration timeout;
    
    public SidecarClient(String baseUrl, Duration timeout) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.timeout = timeout;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(timeout)
            .build();
    }
    
    /**
     * Posts an event to the sidecar's /publish endpoint.
     * 
     * @param eventJson the event payload as JSON
     * @param headers the headers to include (traceparent, x-service-name, etc.)
     * @throws SidecarUnavailableException if the sidecar is unreachable
     * @throws SpasPublishException if the sidecar returns an error response
     */
    public void postEvent(String eventJson, java.util.Map<String, String> headers) {
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/publish"))
                .timeout(timeout)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(eventJson));
            
            // Add custom headers
            headers.forEach(requestBuilder::header);
            
            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new SpasPublishException(
                    String.format("Sidecar returned error: %d %s", 
                        response.statusCode(), response.body()));
            }
            
        } catch (IOException e) {
            throw new SidecarUnavailableException(
                "Failed to connect to sidecar at " + baseUrl, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SidecarUnavailableException(
                "Request to sidecar was interrupted", e);
        }
    }
}
