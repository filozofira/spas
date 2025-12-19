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
 * This annotation is processed at compile-time to generate endpoint metadata.
 * <p>
 * Example:
 * <pre>{@code
 * @SpasCommand(
 *     name = "CreateOrder",
 *     version = "1.0.0",
 *     methodPath = "POST /api/orders",
 *     schemaRef = "schemas/create-order.json",
 *     consistency = ConsistencyLevel.ACID
 * )
 * public OrderResponse createOrder(CreateOrderRequest request) {
 *     // ...
 * }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface SpasCommand {
    /**
     * Command name (will be converted to kebab-case in metadata).
     */
    String name();
    
    /**
     * Command version (semantic versioning recommended).
     */
    String version();
    
    /**
     * HTTP method and path (e.g., "POST /api/orders") or gRPC method path.
     */
    String methodPath();
    
    /**
     * URI reference to request/response schema.
     */
    String schemaRef();
    
    /**
     * Consistency level for this command (default: ACID).
     */
    ConsistencyLevel consistency() default ConsistencyLevel.ACID;
}
