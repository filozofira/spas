package io.spas.examples.orders;

import io.spas.sdk.metadata.annotations.SpasService;
import io.spas.sdk.metadata.model.Protocol;
import io.spas.sdk.spring.EnableSpas;
import io.spas.sdk.metadata.model.Authentication;
import io.spas.sdk.metadata.model.AuthType;
import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.ConsistencyLevel;
import io.spas.sdk.metadata.model.DataClassification;
import io.spas.sdk.metadata.model.Network;
import io.spas.sdk.metadata.model.QueryConsistencyLevel;
import io.spas.sdk.metadata.model.Security;
import io.spas.sdk.spring.SpasServiceRunner;
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
        SpasServiceRunner.run(SampleServiceApplication.class, args, options -> {
            options.setConsistency(new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.EVENTUAL));
            options.setNetwork(new Network(java.util.List.of("localhost:6379")));
            options.setSecurity(new Security(
                new Authentication(AuthType.JWT, java.util.List.of("orders.read", "orders.write")),
                java.util.List.of(DataClassification.INTERNAL)
            ));
            options.setLicense("MIT");
        });
    }
}
