package io.spas.sdk.metadata.annotations;

import io.spas.sdk.metadata.model.Protocol;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a class as a SPAS Service and provides service-level metadata.
 * <p>
 * This annotation is the **single source of truth** for service identity (id, boundedContext, version).
 * It should be placed on the main {@code @SpringBootApplication} class.
 * <p>
 * The SDK reads this annotation during metadata generation ({@code -Dspas.generate-metadata=true})
 * to populate service identity in {@code spas.json}. Do NOT duplicate these values in 
 * {@code application.yml} - they are not used and create unnecessary redundancy.
 * <p>
 * Example:
 * <pre>{@code
 * @SpasService(
 *     id = "order-service",
 *     name = "Order Service",
 *     version = "1.0.0",
 *     description = "Manages order lifecycle",
 *     boundedContext = "sales",
 *     protocol = Protocol.HTTP
 * )
 * @SpringBootApplication
 * public class OrderServiceApplication {
 *     public static void main(String[] args) {
 *         SpringApplication.run(OrderServiceApplication.class, args);
 *     }
 * }
 * }</pre>
 * <p>
 * <strong>Configuration Notes:</strong>
 * <ul>
 *   <li>Service identity comes from this annotation only</li>
 *   <li>Runtime overrides can be specified via {@code SpasServiceOptions}</li>
 *   <li>Do NOT use {@code spas.service.id}, {@code spas.service.bounded-context}, or 
 *       {@code spas.service.version} in {@code application.yml}</li>
 * </ul>
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface SpasService {
    /**
     * Service identifier (kebab-case recommended).
     */
    String id();
    
    /**
     * Human-readable service name.
     */
    String name() default "";
    
    /**
     * Service version (semantic versioning recommended).
     */
    String version();
    
    /**
     * Service description.
     */
    String description() default "";
    
    /**
     * Domain bounded context.
     */
    String boundedContext();
    
    /**
     * Primary protocol used by the service.
     */
    Protocol protocol() default Protocol.HTTP;
    
    /**
     * License identifier (e.g., "MIT", "Apache-2.0").
     */
    String license() default "";
    
    /**
     * Service capabilities (optional).
     */
    String[] capabilities() default {};
}
