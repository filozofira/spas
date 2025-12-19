package io.spas.sdk.spring;

import org.springframework.context.annotation.Import;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Enables SPAS SDK integration in Spring Boot applications.
 * 
 * Add this annotation to your @Configuration or @SpringBootApplication class:
 * 
 * <pre>
 * {@code
 * @SpringBootApplication
 * @EnableSpas
 * public class MyApplication {
 *     public static void main(String[] args) {
 *         SpringApplication.run(MyApplication.class, args);
 *     }
 * }
 * }
 * </pre>
 * 
 * This imports SpasAutoConfiguration which registers:
 * - SpasContextFilter: Extracts trace/identity context from headers
 * - EventPublisher: Publishes events to sidecar (if configured)
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SpasAutoConfiguration.class)
public @interface EnableSpas {
}
