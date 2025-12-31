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
 * This annotation is used to generate endpoint metadata in the offline design-time archive.
 * <p>
 * Example with Spring annotations (path inferred at runtime):
 * <pre>{@code
 * @RestController
 * @RequestMapping("/api/orders")
 * public class OrderController {
 *     @SpasQuery(
 *         name = "GetOrderById",
 *         version = "1.0.0"
 *     )
 *     @GetMapping("/{id}")
 *     public OrderResponse getOrder(@PathVariable String id) { ... }
 * }
 * }</pre>
 * <p>
 * Example with explicit path (overrides Spring annotations):
 * <pre>{@code
 * @SpasQuery(
 *     name = "GetOrderById",
 *     version = "1.0.0",
 *     path = "/api/orders/{id}",
 *     schemaRef = "schemas/endpoints/order.schema.json"
 * )
 * public OrderResponse getOrder(String id) { ... }
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
     * <p>
     * Optional when using Spring annotations ({@code @RequestMapping}, {@code @GetMapping}, etc.)
     * which will be used to infer the path at runtime via {@code --generate-metadata}.
     * The runtime generator combines class-level {@code @RequestMapping} with method-level
     * HTTP mapping annotations to determine the full path.
     * <p>
     * Required when compile-time generation is explicitly enabled via
     * {@code -Aspas.generateSpasJson=true}, as the compile-time processor cannot infer
     * paths from Spring annotations.
     * <p>
     * If both explicit path and Spring annotations are present, the explicit path takes precedence.
     * <p>
     * Do not include HTTP verb - use the appropriate HTTP mapping annotation instead.
     */
    String path() default "";
    
    /**
     * URI reference to response schema.
     * If empty (default), auto-generates as: schemas/endpoints/{kebab-case-name}.schema.json
     */
    String schemaRef() default "";

    /**
     * Optional plain-text description of the endpoint's purpose and behavior.
     */
    String description() default "";
    
    /**
     * Consistency level for this query (default: EVENTUAL).
     */
    QueryConsistencyLevel consistency() default QueryConsistencyLevel.EVENTUAL;
}
