package io.spas.sdk.observability.tracing;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for SPAS tracing.
 * 
 * <p>Properties can be configured in application.yml or application.properties:</p>
 * <pre>{@code
 * spas:
 *   tracing:
 *     enabled: true
 *     zipkin-endpoint: http://zipkin:9411/api/v2/spans
 *     propagate-context: true
 * }</pre>
 */
@ConfigurationProperties(prefix = "spas.tracing")
public class SpasTracingProperties {
    
    /**
     * Whether tracing is enabled. Defaults to true.
     */
    private boolean enabled = true;
    
    /**
     * The Zipkin endpoint URL for exporting traces.
     * Defaults to http://localhost:9411/api/v2/spans.
     * Can also be set via ZIPKIN_URL or SPAS_ZIPKIN_URL environment variables.
     */
    private String zipkinEndpoint = SpasTracing.DEFAULT_ZIPKIN_ENDPOINT;
    
    /**
     * Whether to propagate trace context to downstream services.
     * Defaults to true.
     */
    private boolean propagateContext = true;
    
    /**
     * Sample rate for tracing (0.0 to 1.0). 
     * 1.0 means all requests are traced. Defaults to 1.0.
     */
    private double sampleRate = 1.0;
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getZipkinEndpoint() {
        // Check environment variables for override
        String envUrl = System.getenv("ZIPKIN_URL");
        if (envUrl == null || envUrl.isEmpty()) {
            envUrl = System.getenv("SPAS_ZIPKIN_URL");
        }
        return envUrl != null && !envUrl.isEmpty() ? envUrl : zipkinEndpoint;
    }
    
    public void setZipkinEndpoint(String zipkinEndpoint) {
        this.zipkinEndpoint = zipkinEndpoint;
    }
    
    public boolean isPropagateContext() {
        return propagateContext;
    }
    
    public void setPropagateContext(boolean propagateContext) {
        this.propagateContext = propagateContext;
    }
    
    public double getSampleRate() {
        return sampleRate;
    }
    
    public void setSampleRate(double sampleRate) {
        if (sampleRate < 0.0 || sampleRate > 1.0) {
            throw new IllegalArgumentException("Sample rate must be between 0.0 and 1.0");
        }
        this.sampleRate = sampleRate;
    }
}
