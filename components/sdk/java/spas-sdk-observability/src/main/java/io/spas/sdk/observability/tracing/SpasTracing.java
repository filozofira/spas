package io.spas.sdk.observability.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.zipkin.ZipkinSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.ResourceAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Core SPAS tracing configuration using OpenTelemetry with Zipkin exporter.
 * 
 * <p>This class provides factory methods to create and configure OpenTelemetry
 * tracing infrastructure for SPAS services. It mirrors the functionality of
 * the .NET Spas.Sdk.Observability.Tracing.OpenTelemetryExtensions class.</p>
 * 
 * <p>Example usage:</p>
 * <pre>{@code
 * OpenTelemetry openTelemetry = SpasTracing.create("my-service", "http://zipkin:9411/api/v2/spans");
 * Tracer tracer = SpasTracing.getTracer(openTelemetry);
 * }</pre>
 */
public final class SpasTracing {
    
    private static final Logger logger = LoggerFactory.getLogger(SpasTracing.class);
    
    /** Default Zipkin endpoint URL */
    public static final String DEFAULT_ZIPKIN_ENDPOINT = "http://localhost:9411/api/v2/spans";
    
    /** Instrumentation scope name for SPAS SDK tracing */
    public static final String INSTRUMENTATION_SCOPE_NAME = "io.spas.sdk.observability";
    
    /** Instrumentation scope name for SPAS SDK events */
    public static final String EVENTS_INSTRUMENTATION_SCOPE_NAME = "io.spas.sdk.events";
    
    private SpasTracing() {
        // Prevent instantiation
    }
    
    /**
     * Creates an OpenTelemetry instance configured with Zipkin exporter.
     * 
     * @param serviceName the name of the service for tracing
     * @param zipkinEndpoint the Zipkin endpoint URL
     * @return configured OpenTelemetry instance
     */
    public static OpenTelemetry create(String serviceName, String zipkinEndpoint) {
        if (serviceName == null || serviceName.isEmpty()) {
            throw new IllegalArgumentException("Service name cannot be null or empty");
        }
        
        String endpoint = zipkinEndpoint != null ? zipkinEndpoint : DEFAULT_ZIPKIN_ENDPOINT;
        
        logger.info("Configuring SPAS tracing for service '{}' with Zipkin endpoint: {}", 
                serviceName, endpoint);

        // Create Zipkin exporter
        ZipkinSpanExporter zipkinExporter = ZipkinSpanExporter.builder()
            .setEndpoint(endpoint)
            .build();
        
        // Create resource with service information
        Resource resource = Resource.getDefault()
                .merge(Resource.create(Attributes.builder()
                        .put(ResourceAttributes.SERVICE_NAME, serviceName)
                        .put(ResourceAttributes.DEPLOYMENT_ENVIRONMENT, 
                                getEnvironment())
                        .build()));
        
        // Create tracer provider with batch span processor
        SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
                .addSpanProcessor(BatchSpanProcessor.builder(zipkinExporter).build())
                .setResource(resource)
                .build();
        
        // Build and register OpenTelemetry SDK
        OpenTelemetrySdk openTelemetry = OpenTelemetrySdk.builder()
                .setTracerProvider(tracerProvider)
                .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
                .build();
        
        // Register shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(tracerProvider::close));
        
        logger.info("SPAS tracing configured successfully for service '{}'", serviceName);
        
        return openTelemetry;
    }
    
    /**
     * Creates an OpenTelemetry instance with the default Zipkin endpoint.
     * 
     * @param serviceName the name of the service for tracing
     * @return configured OpenTelemetry instance
     */
    public static OpenTelemetry create(String serviceName) {
        return create(serviceName, DEFAULT_ZIPKIN_ENDPOINT);
    }
    
    /**
     * Gets a tracer for the SPAS SDK instrumentation scope.
     * 
     * @param openTelemetry the OpenTelemetry instance
     * @return tracer for SPAS SDK
     */
    public static Tracer getTracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer(INSTRUMENTATION_SCOPE_NAME);
    }
    
    /**
     * Gets a tracer for the SPAS SDK events instrumentation scope.
     * 
     * @param openTelemetry the OpenTelemetry instance
     * @return tracer for SPAS SDK events
     */
    public static Tracer getEventsTracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer(EVENTS_INSTRUMENTATION_SCOPE_NAME);
    }
    
    /**
     * Gets the deployment environment from system properties or environment variables.
     * 
     * @return the deployment environment (defaults to "development")
     */
    private static String getEnvironment() {
        String env = System.getenv("SPAS_ENVIRONMENT");
        if (env == null || env.isEmpty()) {
            env = System.getProperty("spas.environment");
        }
        if (env == null || env.isEmpty()) {
            env = System.getenv("SPRING_PROFILES_ACTIVE");
        }
        return env != null && !env.isEmpty() ? env : "development";
    }
}
