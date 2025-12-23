package io.spas.examples.basket.events;

import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;

/**
 * Event published when an item is added to a basket.
 */
@SpasEvent(
    type = "ItemAdded",
    version = "1.0.0",
    description = "Emitted when a product is added to a shopping basket"
)
public class ItemAddedEvent {
    
    private String basketId;
    private String customerId;
    private String productId;
    private int quantity;
    private Instant addedAt;
    
    public ItemAddedEvent() {
    }
    
    public ItemAddedEvent(String basketId, String customerId, String productId, int quantity, Instant addedAt) {
        this.basketId = basketId;
        this.customerId = customerId;
        this.productId = productId;
        this.quantity = quantity;
        this.addedAt = addedAt;
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
    
    public int getQuantity() {
        return quantity;
    }
    
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
    
    public Instant getAddedAt() {
        return addedAt;
    }
    
    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
