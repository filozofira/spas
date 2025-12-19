package io.spas.sdk.spring;

import io.spas.sdk.core.config.SpasConfiguration;
import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.events.EventPublisher;
import io.spas.sdk.events.EventPublisherConfig;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * Spring Boot auto-configuration for SPAS SDK.
 * 
 * Registers:
 * - SpasContextFilter: Extracts trace/identity context from HTTP headers
 * - SpasMetadataController: Exposes /_spas/metadata endpoint
 * - EventPublisher: Publishes events to sidecar (if sidecar URL configured)
 * 
 * Enabled when:
 * - SpasContext class is on classpath
 * - spas.enabled=true (default)
 */
@AutoConfiguration
@ConditionalOnClass(SpasContext.class)
@ConditionalOnProperty(prefix = "spas", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(SpasProperties.class)
public class SpasAutoConfiguration {
    
    /**
     * Registers SpasContextFilter to extract context from HTTP headers.
     */
    @Bean
    public SpasContextFilter spasContextFilter() {
        return new SpasContextFilter();
    }
    
    /**
     * Registers SpasMetadataController to expose /_spas/metadata endpoint.
     * The controller reads spas.json from classpath (generated at compile time).
     */
    @Bean
    public SpasMetadataController spasMetadataController(SpasProperties properties) {
        return new SpasMetadataController(properties);
    }
    
    /**
     * Registers EventPublisher bean if sidecar URL is configured.
     * Requires either spas.sidecar.url or spas.sidecar.host to be set.
     */
    @Bean
    @ConditionalOnProperty(prefix = "spas.sidecar", name = "url")
    public EventPublisher eventPublisher(SpasProperties properties) {
        SpasConfiguration config = new SpasConfiguration();
        String serviceName = properties.getServiceName() != null 
            ? properties.getServiceName() 
            : config.getServiceName();
        
        EventPublisherConfig publisherConfig = EventPublisherConfig.builder()
            .sidecarUrl(resolveSidecarUrl(properties))
            .timeout(properties.getSidecar().getRequestTimeout())
            .build();
        
        return new EventPublisher(publisherConfig, serviceName);
    }
    
    /**
     * Resolves sidecar URL from properties.
     * Priority: url > host:port > default localhost:8080
     */
    private String resolveSidecarUrl(SpasProperties properties) {
        SpasProperties.Sidecar sidecar = properties.getSidecar();
        
        if (sidecar.getUrl() != null && !sidecar.getUrl().isBlank()) {
            return sidecar.getUrl();
        }
        
        String host = sidecar.getHost() != null ? sidecar.getHost() : "localhost";
        int port = sidecar.getPort() != null ? sidecar.getPort() : 8080;
        
        return String.format("http://%s:%d", host, port);
    }
}
