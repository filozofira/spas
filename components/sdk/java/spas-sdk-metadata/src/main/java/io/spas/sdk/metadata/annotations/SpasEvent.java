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
 * Example with explicit schemaRef:
 * <pre>{@code
 * @SpasEvent(
 *     type = "OrderCreated",
 *     version = "1.0.0",
 *     schemaRef = "schemas/events/order-created.schema.json"
 * )
 * public class OrderCreatedEvent { ... }
 * }</pre>
 * <p>
 * Example with auto-generated schemaRef (recommended):
 * <pre>{@code
 * @SpasEvent(
 *     type = "OrderCreated",
 *     version = "1.0.0"
 * )
 * public class OrderCreatedEvent { ... }
 * // Auto-generates: schemas/events/order-created-event.schema.json
 * }</pre>
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)  // RUNTIME retention for event publishing
public @interface SpasEvent {
    /**
     * Event type name (will be converted to kebab-case in metadata, headers, and schema path).
     */
    String type();
    
    /**
     * Event schema version (semantic versioning recommended).
     */
    String version();
    
    /**
     * URI reference to event schema.
     * If empty (default), auto-generates as: schemas/events/{kebab-case-event-payload-type}.schema.json
     * (falls back to {@code type} if the payload type cannot be resolved).
     */
    String schemaRef() default "";
}
