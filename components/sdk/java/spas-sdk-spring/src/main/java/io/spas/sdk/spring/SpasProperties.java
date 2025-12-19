package io.spas.sdk.spring;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Configuration properties for SPAS SDK Spring integration.
 * Binds to 'spas' prefix in application.yml/properties.
 */
@ConfigurationProperties(prefix = "spas")
public class SpasProperties {
    
    /**
     * Service name for metadata and tracing.
     * If not set, attempts to read from SERVICE_NAME environment variable.
     */
    private String serviceName;
    
    /**
     * Enable/disable SPAS SDK features.
     */
    private boolean enabled = true;
    
    /**
     * Sidecar configuration for event publishing.
     */
    private Sidecar sidecar = new Sidecar();
    
    /**
     * Metadata endpoint configuration.
     */
    private Metadata metadata = new Metadata();
    
    public String getServiceName() {
        return serviceName;
    }
    
    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public Sidecar getSidecar() {
        return sidecar;
    }
    
    public void setSidecar(Sidecar sidecar) {
        this.sidecar = sidecar;
    }
    
    public Metadata getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Metadata metadata) {
        this.metadata = metadata;
    }
    
    /**
     * Sidecar connection configuration.
     */
    public static class Sidecar {
        /**
         * Full sidecar URL (e.g., http://localhost:8080).
         * Takes precedence over host/port if set.
         */
        private String url;
        
        /**
         * Sidecar hostname (default: localhost).
         */
        private String host;
        
        /**
         * Sidecar port (default: 8080).
         */
        private Integer port = 8080;
        
        /**
         * Connection timeout (default: 5s).
         */
        private Duration connectTimeout = Duration.ofSeconds(5);
        
        /**
         * Request timeout (default: 30s).
         */
        private Duration requestTimeout = Duration.ofSeconds(30);
        
        public String getUrl() {
            return url;
        }
        
        public void setUrl(String url) {
            this.url = url;
        }
        
        public String getHost() {
            return host;
        }
        
        public void setHost(String host) {
            this.host = host;
        }
        
        public Integer getPort() {
            return port;
        }
        
        public void setPort(Integer port) {
            this.port = port;
        }
        
        public Duration getConnectTimeout() {
            return connectTimeout;
        }
        
        public void setConnectTimeout(Duration connectTimeout) {
            this.connectTimeout = connectTimeout;
        }
        
        public Duration getRequestTimeout() {
            return requestTimeout;
        }
        
        public void setRequestTimeout(Duration requestTimeout) {
            this.requestTimeout = requestTimeout;
        }
    }
    
    /**
     * Metadata endpoint configuration.
     */
    public static class Metadata {
        /**
         * Enable/disable the /_spas/metadata endpoint.
         * Default: true
         */
        private boolean enabled = true;
        
        /**
         * Restrict metadata endpoint to specific environment.
         * Set to "*" to allow all environments.
         * Default: development (dev-only)
         */
        private String allowedEnvironment = "development";
        
        /**
         * Path for the metadata endpoint.
         * Default: /_spas/metadata
         */
        private String path = "/_spas/metadata";
        
        public boolean isEnabled() {
            return enabled;
        }
        
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
        
        public String getAllowedEnvironment() {
            return allowedEnvironment;
        }
        
        public void setAllowedEnvironment(String allowedEnvironment) {
            this.allowedEnvironment = allowedEnvironment;
        }
        
        public String getPath() {
            return path;
        }
        
        public void setPath(String path) {
            this.path = path;
        }
    }
}
