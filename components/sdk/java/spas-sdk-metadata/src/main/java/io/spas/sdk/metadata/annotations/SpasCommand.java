package io.spas.sdk.metadata.annotations;

import io.spas.sdk.metadata.model.ConsistencyLevel;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method as a SPAS Command endpoint (write operation).
 * <p>
 * Commands are operations that modify state and should be idempotent where possible.
 * This annotation is used at runtime by the /_spas/metadata endpoint to generate endpoint metadata.
 * <p>
 * Example with explicit schemaRef:
 * <pre>{@code
 * @SpasCommand(
 *     name = "CreateOrder",
 *     version = "1.0.0",
 *     path = "/api/orders",
 *     schemaRef = "schemas/endpoints/create-order.schema.json"
 * )
 * public OrderResponse createOrder(CreateOrderRequest request) { ... }
 * }</pre>
 * <p>
 * Example with auto-generated schemaRef (recommended):
 * <pre>{@code
 * @SpasCommand(
 *     name = "CreateOrder",
 *     version = "1.0.0",
 *     path = "/api/orders"
 * )
 * public OrderResponse createOrder(CreateOrderRequest request) { ... }
 * // Auto-generates: schemas/endpoints/create-order.schema.json
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SpasCommand {
    /**
     * Command name (will be converted to kebab-case in metadata and schema path).
     */
    String name();
    
    /**
     * Command version (semantic versioning recommended).
     */
    String version();
    
    /**
     * HTTP route path (e.g., "/api/orders") or gRPC method path.
     * Do not include HTTP verb - use the appropriate HTTP mapping annotation instead.
     */
    String path();
    
    /**
     * URI reference to request/response schema.
     * If empty (default), auto-generates as: schemas/endpoints/{kebab-case-name}.schema.json
     */
    String schemaRef() default "";

    /**
     * Optional plain-text description of the endpoint's purpose and behavior.
     */
    String description() default "";
    
    /**
     * Consistency level for this command (default: ACID).
     */
    ConsistencyLevel consistency() default ConsistencyLevel.ACID;
}
