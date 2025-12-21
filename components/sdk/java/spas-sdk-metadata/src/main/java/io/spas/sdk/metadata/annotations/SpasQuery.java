package io.spas.sdk.metadata.annotations;

import io.spas.sdk.metadata.model.QueryConsistencyLevel;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method as a SPAS Query endpoint (read operation).
 * <p>
 * Queries are read-only operations that do not modify state.
 * This annotation is used at runtime by the /_spas/metadata endpoint to generate endpoint metadata.
 * <p>
 * Example with explicit schemaRef:
 * <pre>{@code
 * @SpasQuery(
 *     name = "GetOrderById",
 *     version = "1.0.0",
 *     path = "/api/orders/{id}",
 *     schemaRef = "schemas/endpoints/order.schema.json"
 * )
 * public OrderResponse getOrder(String id) { ... }
 * }</pre>
 * <p>
 * Example with auto-generated schemaRef (recommended):
 * <pre>{@code
 * @SpasQuery(
 *     name = "GetOrderById",
 *     version = "1.0.0",
 *     path = "/api/orders/{id}"
 * )
 * public OrderResponse getOrder(String id) { ... }
 * // Auto-generates: schemas/endpoints/get-order-by-id.schema.json
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SpasQuery {
    /**
     * Query name (will be converted to kebab-case in metadata and schema path).
     */
    String name();
    
    /**
     * Query version (semantic versioning recommended).
     */
    String version();
    
    /**
     * HTTP route path (e.g., "/api/orders/{id}") or gRPC method path.
     * Do not include HTTP verb - use the appropriate HTTP mapping annotation instead.
     */
    String path();
    
    /**
     * URI reference to response schema.
     * If empty (default), auto-generates as: schemas/endpoints/{kebab-case-name}.schema.json
     */
    String schemaRef() default "";
    
    /**
     * Consistency level for this query (default: EVENTUAL).
     */
    QueryConsistencyLevel consistency() default QueryConsistencyLevel.EVENTUAL;
}
