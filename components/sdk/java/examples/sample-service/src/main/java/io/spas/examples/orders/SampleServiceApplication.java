package io.spas.examples.orders;

import io.spas.sdk.metadata.annotations.SpasService;
import io.spas.sdk.metadata.model.Protocol;
import io.spas.sdk.spring.EnableSpas;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Sample SPAS service demonstrating all SDK features:
 * - @SpasCommand/@SpasQuery annotations for endpoint contracts
 * - @SpasEvent annotation for event contracts
 * - Automatic spas.json generation via annotation processor
 * - Event publishing to sidecar with trace context propagation
 * - Identity context propagation (x-user-id, x-tenant-id)
 * 
 * This reference implementation shows:
 * 1. Compile-time metadata generation (spas.json)
 * 2. Runtime event publishing to sidecar
 * 3. W3C Trace Context propagation
 * 4. Spring Boot auto-configuration
 */
@SpasService(
    id = "sample-service",
    name = "Sample Service",
    version = "1.0.0",
    description = "Reference implementation demonstrating SPAS SDK features",
    boundedContext = "examples",
    protocol = Protocol.HTTP,
    license = "Apache-2.0",
    capabilities = {"orders", "events"}
)
@SpringBootApplication
@EnableSpas
public class SampleServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SampleServiceApplication.class, args);
    }
}
