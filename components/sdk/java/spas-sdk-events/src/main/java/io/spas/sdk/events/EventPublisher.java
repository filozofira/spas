package io.spas.sdk.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.spas.sdk.core.config.SpasConfiguration;
import io.spas.sdk.core.context.SpasContext;
import io.spas.sdk.core.context.SpasTrace;
import io.spas.sdk.core.util.KebabCaseConverter;
import io.spas.sdk.metadata.annotations.SpasEvent;

import java.util.HashMap;
import java.util.Map;

/**
 * Publishes events to the SPAS sidecar with proper headers and context propagation.
 */
public final class EventPublisher {
    private final SidecarClient sidecarClient;
    private final ObjectMapper objectMapper;
    private final String serviceName;
    
    public EventPublisher(EventPublisherConfig config) {
        this(config, new SpasConfiguration().getServiceName());
    }
    
    /**
     * Constructor with explicit service name.
     * 
     * @param config event publisher configuration
     * @param serviceName service name for x-service-name header
     */
    public EventPublisher(EventPublisherConfig config, String serviceName) {
        this.sidecarClient = new SidecarClient(config.getSidecarUrl(), config.getTimeout());
        ObjectMapper mapper = new ObjectMapper();
        // Register modules like jackson-datatype-jsr310 (Instant/LocalDateTime) when present.
        mapper.findAndRegisterModules();
        // Prefer ISO-8601 strings over numeric timestamps.
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper = mapper;
        this.serviceName = serviceName;
    }
    
    /**
     * Publishes an event to the sidecar.
     * 
     * @param event the event object (must be annotated with @SpasEvent)
     * @throws EventAnnotationMissingException if the event class lacks @SpasEvent
     * @throws SpasPublishException if publishing fails
     */
    public void publish(Object event) {
        // Validate @SpasEvent annotation
        SpasEvent annotation = event.getClass().getAnnotation(SpasEvent.class);
        if (annotation == null) {
            throw new EventAnnotationMissingException(
                String.format("Event class %s must be annotated with @SpasEvent", 
                    event.getClass().getName()));
        }
        
        // Extract event metadata
        String eventType = annotation.type();
        String eventName = KebabCaseConverter.toKebabCase(eventType);
        
        // Serialize event payload
        String eventJson;
        try {
            eventJson = objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            throw new SpasPublishException("Failed to serialize event to JSON", e);
        }
        
        // Build headers
        Map<String, String> headers = new HashMap<>();
        headers.put("x-service-name", serviceName);
        headers.put("x-event-name", eventName);
        
        // Add trace context (generate if not available)
        SpasTrace trace = SpasTrace.current();
        if (trace != null) {
            headers.put("traceparent", trace.toTraceparent());
            trace.getTraceState().ifPresent(state -> headers.put("tracestate", state));
        } else {
            // Generate new trace if not in context
            trace = SpasTrace.generate();
            headers.put("traceparent", trace.toTraceparent());
        }
        
        // Add correlation context (auto-generate correlation-id if not available)
        SpasContext context = SpasContext.current();
        String correlationId;
        if (context != null) {
            correlationId = context.getCorrelationId();
            context.getUserId().ifPresent(userId -> headers.put("x-user-id", userId));
            context.getTenantId().ifPresent(tenantId -> headers.put("x-tenant-id", tenantId));
        } else {
            // Auto-generate correlation-id if no context (matches .NET SDK behavior)
            correlationId = java.util.UUID.randomUUID().toString();
        }
        headers.put("x-correlation-id", correlationId);
        
        // Publish to sidecar
        sidecarClient.postEvent(eventJson, headers);
    }
}
