package io.spas.examples.fulfillment;

import io.spas.sdk.metadata.annotations.SpasService;
import org.springframework.boot.SpringApplication;
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
    id = "fulfillment-service-java",
    name = "Fulfillment Service",
    boundedContext = "fulfillment",
    version = "1.0.0",
    description = "Handles order fulfillment operations including shipment creation and status tracking"
)
public class FulfillmentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FulfillmentServiceApplication.class, args);
    }
}
