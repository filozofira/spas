package io.spas.examples.basket;

import io.spas.sdk.metadata.annotations.SpasService;
import org.springframework.boot.SpringApplication;
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
    description = "Manages shopping baskets for customers; publishes checkout events to trigger order creation and handles inventory updates"
)
public class BasketServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BasketServiceApplication.class, args);
    }
}
