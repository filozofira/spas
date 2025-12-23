package io.spas.examples.basket.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;

/**
 * Event published when an item is removed from a basket.
 */
@SpasEvent(
    type = "ItemRemoved",
    version = "1.0.0",
    description = "Emitted when a product is removed from a shopping basket"
)
public class ItemRemovedEvent {
    
    private String basketId;
    private String customerId;
    private String productId;
    private Instant removedAt;
    
    public ItemRemovedEvent() {
    }
    
    public ItemRemovedEvent(String basketId, String customerId, String productId, Instant removedAt) {
        this.basketId = basketId;
        this.customerId = customerId;
        this.productId = productId;
        this.removedAt = removedAt;
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
    
    public String getProductId() {
        return productId;
    }
    
    public void setProductId(String productId) {
        this.productId = productId;
    }
    
    public Instant getRemovedAt() {
        return removedAt;
    }
    
    public void setRemovedAt(Instant removedAt) {
        this.removedAt = removedAt;
    }
}
