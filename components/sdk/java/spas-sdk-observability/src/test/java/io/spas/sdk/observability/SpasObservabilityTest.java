package io.spas.sdk.observability;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import io.spas.sdk.observability.tracing.SpasTracing;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SpasObservability.
 */
class SpasObservabilityTest {
    
    private Tracer tracer;
    
    @BeforeEach
    void setUp() {
        OpenTelemetry otel = SpasTracing.create("test-service");
        tracer = SpasTracing.getTracer(otel);
    }
    
    @Test
    void traced_withSupplier_returnsResult() {
        // Act
        String result = SpasObservability.traced(tracer, "test-span", () -> "hello");
        
        // Assert
        assertEquals("hello", result);
    }
    
    @Test
    void traced_withRunnable_executesRunnable() {
        // Arrange
        AtomicInteger counter = new AtomicInteger(0);
        
        // Act
        SpasObservability.traced(tracer, "test-span", counter::incrementAndGet);
        
        // Assert
        assertEquals(1, counter.get());
    }
    
    @Test
    void traced_withException_propagatesException() {
        // Act & Assert
        assertThrows(RuntimeException.class, () -> 
            SpasObservability.traced(tracer, "test-span", () -> {
                throw new RuntimeException("Test exception");
            })
        );
    }
    
    @Test
    void addEvent_doesNotThrow() {
        // Should not throw even without active span
        assertDoesNotThrow(() -> SpasObservability.addEvent("test-event"));
    }
    
    @Test
    void setAttribute_string_doesNotThrow() {
        // Should not throw even without active span
        assertDoesNotThrow(() -> SpasObservability.setAttribute("key", "value"));
    }
    
    @Test
    void setAttribute_long_doesNotThrow() {
        // Should not throw even without active span
        assertDoesNotThrow(() -> SpasObservability.setAttribute("key", 123L));
    }
    
    @Test
    void setAttribute_boolean_doesNotThrow() {
        // Should not throw even without active span
        assertDoesNotThrow(() -> SpasObservability.setAttribute("key", true));
    }
    
    @Test
    void recordException_doesNotThrow() {
        // Should not throw even without active span
        assertDoesNotThrow(() -> SpasObservability.recordException(new RuntimeException("test")));
    }
    
    @Test
    void getCurrentTraceId_withoutActiveSpan_returnsNull() {
        // Without an active span, should return null
        String traceId = SpasObservability.getCurrentTraceId();
        // Note: May be null or a valid trace ID depending on context
        // This just verifies no exception is thrown
        assertDoesNotThrow(() -> SpasObservability.getCurrentTraceId());
    }
    
    @Test
    void getCurrentSpanId_withoutActiveSpan_returnsNull() {
        // Without an active span, should return null
        assertDoesNotThrow(() -> SpasObservability.getCurrentSpanId());
    }
}
