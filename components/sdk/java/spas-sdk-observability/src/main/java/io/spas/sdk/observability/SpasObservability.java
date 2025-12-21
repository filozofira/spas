package io.spas.sdk.observability;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanBuilder;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.spas.sdk.observability.tracing.SpasTracing;

import java.util.function.Supplier;

/**
 * High-level observability utilities for SPAS services.
 * 
 * <p>Provides convenient methods for common tracing patterns:</p>
 * <ul>
 *   <li>Wrapping operations in spans</li>
 *   <li>Creating child spans</li>
 *   <li>Adding events and attributes to the current span</li>
 * </ul>
 * 
 * <p>Example usage:</p>
 * <pre>{@code
 * // Wrap an operation in a span
 * String result = SpasObservability.traced(tracer, "process-order", () -> {
 *     // Your code here
 *     return processOrder(orderId);
 * });
 * 
 * // Add event to current span
 * SpasObservability.addEvent("Order validated");
 * 
 * // Add attribute to current span
 * SpasObservability.setAttribute("order.id", orderId);
 * }</pre>
 */
public final class SpasObservability {
    
    private SpasObservability() {
        // Prevent instantiation
    }
    
    /**
     * Executes a supplier within a traced span.
     * 
     * @param tracer the tracer to use
     * @param spanName the name of the span
     * @param supplier the supplier to execute
     * @param <T> the return type
     * @return the result of the supplier
     */
    public static <T> T traced(Tracer tracer, String spanName, Supplier<T> supplier) {
        Span span = tracer.spanBuilder(spanName)
                .setSpanKind(SpanKind.INTERNAL)
                .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            return supplier.get();
        } catch (Exception e) {
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }
    
    /**
     * Executes a runnable within a traced span.
     * 
     * @param tracer the tracer to use
     * @param spanName the name of the span
     * @param runnable the runnable to execute
     */
    public static void traced(Tracer tracer, String spanName, Runnable runnable) {
        traced(tracer, spanName, () -> {
            runnable.run();
            return null;
        });
    }
    
    /**
     * Executes a supplier within a traced span with custom span kind.
     * 
     * @param tracer the tracer to use
     * @param spanName the name of the span
     * @param kind the span kind
     * @param supplier the supplier to execute
     * @param <T> the return type
     * @return the result of the supplier
     */
    public static <T> T traced(Tracer tracer, String spanName, SpanKind kind, Supplier<T> supplier) {
        Span span = tracer.spanBuilder(spanName)
                .setSpanKind(kind)
                .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            return supplier.get();
        } catch (Exception e) {
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }
    
    /**
     * Adds an event to the current span.
     * 
     * @param eventName the name of the event
     */
    public static void addEvent(String eventName) {
        Span.current().addEvent(eventName);
    }
    
    /**
     * Sets a string attribute on the current span.
     * 
     * @param key the attribute key
     * @param value the attribute value
     */
    public static void setAttribute(String key, String value) {
        Span.current().setAttribute(key, value);
    }
    
    /**
     * Sets a long attribute on the current span.
     * 
     * @param key the attribute key
     * @param value the attribute value
     */
    public static void setAttribute(String key, long value) {
        Span.current().setAttribute(key, value);
    }
    
    /**
     * Sets a boolean attribute on the current span.
     * 
     * @param key the attribute key
     * @param value the attribute value
     */
    public static void setAttribute(String key, boolean value) {
        Span.current().setAttribute(key, value);
    }
    
    /**
     * Records an exception on the current span.
     * 
     * @param exception the exception to record
     */
    public static void recordException(Throwable exception) {
        Span.current().recordException(exception);
    }
    
    /**
     * Gets the current trace ID, or null if no span is active.
     * 
     * @return the trace ID or null
     */
    public static String getCurrentTraceId() {
        Span span = Span.current();
        if (span != null && span.getSpanContext().isValid()) {
            return span.getSpanContext().getTraceId();
        }
        return null;
    }
    
    /**
     * Gets the current span ID, or null if no span is active.
     * 
     * @return the span ID or null
     */
    public static String getCurrentSpanId() {
        Span span = Span.current();
        if (span != null && span.getSpanContext().isValid()) {
            return span.getSpanContext().getSpanId();
        }
        return null;
    }
}
