package io.spas.examples.rental;

import io.spas.sdk.metadata.annotations.SpasService;
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
 * Rental Service - A SPAS-compliant service demonstrating cross-domain reuse.
 * 
 * This service manages equipment rentals, demonstrating how inventory-service
 * can be reused in a fundamentally different business context (rental vs. sales).
 */
@SpringBootApplication
@SpasService(
    id = "rental-service",
    name = "Rental Service",
    boundedContext = "rental",
    version = "1.0.0",
    description = "Manages equipment rental lifecycle; publishes rental events to coordinate with inventory for reservations and returns",
    capabilities = {"rental-management"}
)
public class RentalServiceApplication {

    public static void main(String[] args) {
        SpasServiceRunner.run(RentalServiceApplication.class, args, options -> {
            options.setConsistency(new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.EVENTUAL));
            options.setNetwork(new Network(java.util.List.of("localhost:6379")));
            options.setSecurity(new Security(
                new Authentication(AuthType.JWT, java.util.List.of("rentals.read", "rentals.write")),
                java.util.List.of(DataClassification.INTERNAL)
            ));
            options.setLicense("MIT");
        });
    }
}
