package io.spas.sdk.observability.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

/**
 * Spring Boot auto-configuration for SPAS tracing with OpenTelemetry and Zipkin.
 * 
 * <p>This auto-configuration is enabled by default and can be disabled by setting
 * {@code spas.tracing.enabled=false} in your application properties.</p>
 * 
 * <p>The configuration automatically:</p>
 * <ul>
 *   <li>Creates an OpenTelemetry instance configured with Zipkin exporter</li>
 *   <li>Registers a servlet filter for HTTP request tracing</li>
 *   <li>Provides a Tracer bean for manual span creation</li>
 * </ul>
 */
@AutoConfiguration
@ConditionalOnClass(OpenTelemetry.class)
@ConditionalOnProperty(prefix = "spas.tracing", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(SpasTracingProperties.class)
public class SpasTracingAutoConfiguration {
    
    private static final Logger logger = LoggerFactory.getLogger(SpasTracingAutoConfiguration.class);
    
    @Value("${spas.service.id:${spring.application.name:unknown-service}}")
    private String serviceName;
    
    @Value("${SERVICE_NAME:}")
    private String serviceNameEnv;
    
    /**
     * Creates the OpenTelemetry instance with Zipkin exporter.
     */
    @Bean
    @ConditionalOnMissingBean
    public OpenTelemetry openTelemetry(SpasTracingProperties properties) {
        String effectiveServiceName = resolveServiceName();
        String zipkinEndpoint = resolveZipkinEndpoint(properties);
        
        logger.info("Configuring SPAS tracing for service '{}' with Zipkin: {}", 
                effectiveServiceName, zipkinEndpoint);
        
        return SpasTracing.create(effectiveServiceName, zipkinEndpoint);
    }
    
    /**
     * Creates a Tracer for the SPAS SDK instrumentation scope.
     */
    @Bean
    @ConditionalOnMissingBean
    public Tracer spasTracer(OpenTelemetry openTelemetry) {
        return SpasTracing.getTracer(openTelemetry);
    }
    
    /**
     * Registers the tracing filter for HTTP request instrumentation.
     */
    @Bean
    @ConditionalOnMissingBean(name = "spasTracingFilterRegistration")
    public FilterRegistrationBean<TracingFilter> spasTracingFilterRegistration(OpenTelemetry openTelemetry) {
        FilterRegistrationBean<TracingFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new TracingFilter(openTelemetry));
        registration.addUrlPatterns("/*");
        registration.setName("spasTracingFilter");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        logger.debug("Registered SPAS tracing filter");
        return registration;
    }
    
    private String resolveServiceName() {
        // Priority: SERVICE_NAME env var > spas.service.id > spring.application.name
        if (serviceNameEnv != null && !serviceNameEnv.isEmpty()) {
            return serviceNameEnv;
        }
        return serviceName;
    }
    
    private String resolveZipkinEndpoint(SpasTracingProperties properties) {
        // Check environment variables first
        String envUrl = System.getenv("ZIPKIN_URL");
        if (envUrl != null && !envUrl.isEmpty()) {
            // Ensure endpoint path is included
            if (!envUrl.contains("/api/v2/spans")) {
                envUrl = envUrl.replaceAll("/+$", "") + "/api/v2/spans";
            }
            return envUrl;
        }
        
        envUrl = System.getenv("SPAS_ZIPKIN_URL");
        if (envUrl != null && !envUrl.isEmpty()) {
            if (!envUrl.contains("/api/v2/spans")) {
                envUrl = envUrl.replaceAll("/+$", "") + "/api/v2/spans";
            }
            return envUrl;
        }
        
        return properties.getZipkinEndpoint();
    }
}
