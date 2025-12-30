package io.spas.examples.fulfillment;

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
 * Fulfillment Service - A SPAS-compliant service demonstrating the Java SDK.
 * 
 * This service handles order fulfillment operations (pick, pack, ship) after
 * inventory is reserved, completing the order-to-shipment flow in the 
 * e-commerce choreography.
 */
@SpringBootApplication
@SpasService(
    id = "fulfillment-service",
    name = "Fulfillment Service",
    boundedContext = "fulfillment",
    version = "1.0.0",
    description = "Creates and tracks shipments for confirmed orders; publishes shipment lifecycle events for downstream services",
    capabilities = {"shipment-creation", "shipment-tracking"}
)
public class FulfillmentServiceApplication {

    public static void main(String[] args) {
        SpasServiceRunner.run(FulfillmentServiceApplication.class, args, options -> {
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
