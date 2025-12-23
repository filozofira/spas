package io.spas.examples.basket.model;

/**
 * Enum representing the status of a basket.
 */
public enum BasketStatus {
    OPEN,           // Basket is active and can be modified
    CHECKOUT,       // Checkout has been initiated
    ORDERED,        // Order has been created successfully
    ABANDONED       // Basket was abandoned (future use)
}
