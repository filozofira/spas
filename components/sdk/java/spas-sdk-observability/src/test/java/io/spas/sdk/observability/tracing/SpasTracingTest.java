package io.spas.sdk.observability.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SpasTracing.
 */
class SpasTracingTest {
    
    @Test
    void create_withValidServiceName_returnsOpenTelemetry() {
        // Act
        OpenTelemetry otel = SpasTracing.create("test-service", "http://localhost:9411/api/v2/spans");
        
        // Assert
        assertNotNull(otel);
    }
    
    @Test
    void create_withNullServiceName_throwsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> SpasTracing.create(null, "http://localhost:9411/api/v2/spans"));
    }
    
    @Test
    void create_withEmptyServiceName_throwsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> SpasTracing.create("", "http://localhost:9411/api/v2/spans"));
    }
    
    @Test
    void create_withNullZipkinEndpoint_usesDefault() {
        // Act
        OpenTelemetry otel = SpasTracing.create("test-service", null);
        
        // Assert - should not throw, uses default endpoint
        assertNotNull(otel);
    }
    
    @Test
    void create_withServiceNameOnly_usesDefaultEndpoint() {
        // Act
        OpenTelemetry otel = SpasTracing.create("test-service");
        
        // Assert
        assertNotNull(otel);
    }
    
    @Test
    void getTracer_returnsTracer() {
        // Arrange
        OpenTelemetry otel = SpasTracing.create("test-service");
        
        // Act
        Tracer tracer = SpasTracing.getTracer(otel);
        
        // Assert
        assertNotNull(tracer);
    }
    
    @Test
    void getEventsTracer_returnsTracer() {
        // Arrange
        OpenTelemetry otel = SpasTracing.create("test-service");
        
        // Act
        Tracer tracer = SpasTracing.getEventsTracer(otel);
        
        // Assert
        assertNotNull(tracer);
    }
    
    @Test
    void defaultZipkinEndpoint_hasCorrectValue() {
        assertEquals("http://localhost:9411/api/v2/spans", SpasTracing.DEFAULT_ZIPKIN_ENDPOINT);
    }
    
    @Test
    void instrumentationScopeName_hasCorrectValue() {
        assertEquals("io.spas.sdk.observability", SpasTracing.INSTRUMENTATION_SCOPE_NAME);
    }
}
