package io.spas.examples.basket;

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
 * Basket Service - A SPAS-compliant service demonstrating the Java SDK.
 * 
 * This service manages shopping baskets in an e-commerce flow, handling
 * item additions/removals and checkout initiation.
 */
@SpringBootApplication
@SpasService(
    id = "basket-service",
    name = "Basket Service",
    boundedContext = "shopping",
    version = "1.0.0",
    description = "Manages shopping baskets for customers; publishes checkout events to trigger order creation and handles inventory updates",
    capabilities = {"basket-management", "checkout-initiation"}
)
public class BasketServiceApplication {

    public static void main(String[] args) {
        SpasServiceRunner.run(BasketServiceApplication.class, args, options -> {
            options.setConsistency(new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.EVENTUAL));
            options.setNetwork(new Network(java.util.List.of("localhost:6379")));
            options.setSecurity(new Security(
                new Authentication(AuthType.JWT, java.util.List.of("baskets.read", "baskets.write")),
                java.util.List.of(DataClassification.INTERNAL)
            ));
            options.setLicense("MIT");
        });
    }
}
