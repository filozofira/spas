package io.spas.examples.basket.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;

/**
 * Event published when a new basket is created.
 */
@SpasEvent(
    type = "BasketCreated",
    version = "1.0.0",
    description = "Emitted when a user creates a new basket"
)
public class BasketCreatedEvent {
    
    private String basketId;
    private String customerId;
    private Instant createdAt;
    
    public BasketCreatedEvent() {
    }
    
    public BasketCreatedEvent(String basketId, String customerId, Instant createdAt) {
        this.basketId = basketId;
        this.customerId = customerId;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    
    public String getBasketId() {
        return basketId;
    }
    
    public void setBasketId(String basketId) {
        this.basketId = basketId;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
