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
 * This annotation is used to generate endpoint metadata in the offline design-time archive.
 * <p>
 * Example with Spring annotations (path inferred at runtime):
 * <pre>{@code
 * @RestController
 * @RequestMapping("/api/orders")
 * public class OrderController {
 *     @SpasCommand(
 *         name = "CreateOrder",
 *         version = "1.0.0"
 *     )
 *     @PostMapping
 *     public OrderResponse createOrder(CreateOrderRequest request) { ... }
 * }
 * }</pre>
 * <p>
 * Example with explicit path (overrides Spring annotations):
 * <pre>{@code
 * @SpasCommand(
 *     name = "CreateOrder",
 *     version = "1.0.0",
 *     path = "/api/orders",
 *     schemaRef = "schemas/endpoints/create-order.schema.json"
 * )
 * public OrderResponse createOrder(CreateOrderRequest request) { ... }
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
     * <p>
     * Optional when using Spring annotations ({@code @RequestMapping}, {@code @PostMapping}, etc.)
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

    /**
     * Optional list of event classes produced by this command.
     * The SDK resolves (type, version) from {@link SpasEvent} on those classes.
     */
    Class<?>[] produces() default {};
}
