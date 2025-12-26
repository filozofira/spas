package io.spas.sdk.spring;

import io.spas.sdk.core.config.SpasConfiguration;
import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.events.EventPublisher;
import io.spas.sdk.events.EventPublisherConfig;
import io.spas.sdk.metadata.generation.MetadataGenerationConstants;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;

import java.nio.file.Path;

/**
 * Spring Boot auto-configuration for SPAS SDK.
 * 
 * Registers:
 * - SpasContextFilter: Extracts trace/identity context from HTTP headers
 * - SpasMetadataController: Exposes /_spas/metadata endpoint
 * - EventPublisher: Publishes events to sidecar
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

    @Bean
    public SpasMetadataArchiveGenerator spasMetadataArchiveGenerator() {
        return new SpasMetadataArchiveGenerator();
    }

    @Bean
    @ConditionalOnProperty(name = MetadataGenerationConstants.GENERATE_METADATA_PROPERTY, havingValue = "true")
    public ApplicationRunner spasGenerateMetadataRunner(
        SpasMetadataArchiveGenerator generator,
        ConfigurableApplicationContext applicationContext) {
        return args -> {
            Path zipPath = generator.writeArchiveFromSystemProperties();
            if (zipPath == null) {
                throw new IllegalStateException("Unable to generate metadata archive: zip path was null");
            }

            int exitCode = SpringApplication.exit(applicationContext, () -> 0);
            System.exit(exitCode);
        };
    }
    
    /**
     * Registers EventPublisher bean.
     * <p>
     * Sidecar URL resolution priority:
     * <ol>
     *   <li>spas.sidecar.url</li>
     *   <li>spas.sidecar.host + spas.sidecar.port</li>
     *   <li>Environment convention via {@link SpasConfiguration}</li>
     * </ol>
     */
    @Bean
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
     * Priority: url > host:port > env convention
     */
    private String resolveSidecarUrl(SpasProperties properties) {
        SpasConfiguration config = new SpasConfiguration();
        SpasProperties.Sidecar sidecar = properties.getSidecar();
        
        if (sidecar.getUrl() != null && !sidecar.getUrl().isBlank()) {
            return sidecar.getUrl();
        }
        
        if (sidecar.getHost() != null && !sidecar.getHost().isBlank()) {
            String host = sidecar.getHost().trim();
            int port = sidecar.getPort() != null ? sidecar.getPort() : 7000;
            return String.format("http://%s:%d", host, port);
        }

        return config.getSidecarUrl().toString();
    }
}
