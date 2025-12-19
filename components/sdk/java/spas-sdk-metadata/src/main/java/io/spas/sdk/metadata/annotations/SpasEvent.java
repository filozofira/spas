package io.spas.sdk.metadata.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a class as a SPAS Event type.
 * <p>
 * This annotation uses RUNTIME retention to allow runtime reflection
 * for event name extraction when publishing events.
 * It also participates in compile-time metadata generation.
 * <p>
 * Example:
 * <pre>{@code
 * @SpasEvent(
 *     type = "OrderCreated",
 *     version = "1.0.0",
 *     schemaRef = "schemas/order-created.json"
 * )
 * public class OrderCreatedEvent {
 *     private String orderId;
 *     private BigDecimal amount;
 *     // ...
 * }
 * }</pre>
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)  // RUNTIME retention for event publishing
public @interface SpasEvent {
    /**
     * Event type name (will be converted to kebab-case in metadata and headers).
     */
    String type();
    
    /**
     * Event schema version (semantic versioning recommended).
     */
    String version();
    
    /**
     * URI reference to event schema.
     */
    String schemaRef();
}
