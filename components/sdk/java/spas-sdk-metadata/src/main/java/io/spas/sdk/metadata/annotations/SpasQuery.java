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
 * This annotation is processed at compile-time to generate endpoint metadata.
 * <p>
 * Example:
 * <pre>{@code
 * @SpasQuery(
 *     name = "GetOrderById",
 *     version = "1.0.0",
 *     methodPath = "GET /api/orders/{id}",
 *     schemaRef = "schemas/order.json",
 *     consistency = QueryConsistencyLevel.EVENTUAL
 * )
 * public OrderResponse getOrder(String id) {
 *     // ...
 * }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface SpasQuery {
    /**
     * Query name (will be converted to kebab-case in metadata).
     */
    String name();
    
    /**
     * Query version (semantic versioning recommended).
     */
    String version();
    
    /**
     * HTTP method and path (e.g., "GET /api/orders/{id}") or gRPC method path.
     */
    String methodPath();
    
    /**
     * URI reference to response schema.
     */
    String schemaRef();
    
    /**
     * Consistency level for this query (default: EVENTUAL).
     */
    QueryConsistencyLevel consistency() default QueryConsistencyLevel.EVENTUAL;
}
