package io.spas.sdk.events;

import java.time.Duration;

/**
 * Configuration for the EventPublisher.
 */
public final class EventPublisherConfig {
    private final String sidecarUrl;
    private final Duration timeout;
    private final int maxRetries;
    
    private EventPublisherConfig(String sidecarUrl, Duration timeout, int maxRetries) {
        this.sidecarUrl = sidecarUrl;
        this.timeout = timeout;
        this.maxRetries = maxRetries;
    }
    
    public String getSidecarUrl() {
        return sidecarUrl;
    }
    
    public Duration getTimeout() {
        return timeout;
    }
    
    public int getMaxRetries() {
        return maxRetries;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static final class Builder {
        private String sidecarUrl;
        private Duration timeout = Duration.ofSeconds(5);
        private int maxRetries = 0;  // no retries by default
        
        private Builder() {}
        
        public Builder sidecarUrl(String sidecarUrl) {
            this.sidecarUrl = sidecarUrl;
            return this;
        }
        
        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }
        
        public Builder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }
        
        public EventPublisherConfig build() {
            if (sidecarUrl == null || sidecarUrl.isEmpty()) {
                throw new IllegalArgumentException("sidecarUrl is required");
            }
            if (timeout == null || timeout.isNegative() || timeout.isZero()) {
                throw new IllegalArgumentException("timeout must be positive");
            }
            if (maxRetries < 0) {
                throw new IllegalArgumentException("maxRetries cannot be negative");
            }
            
            return new EventPublisherConfig(sidecarUrl, timeout, maxRetries);
        }
    }
}
