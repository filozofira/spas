package io.spas.examples.basket.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Domain model representing a shopping basket.
 */
public class Basket {
    
    private String id;
    private String customerId;
    private List<BasketItem> items;
    private BasketStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    
    public Basket() {
        this.items = new ArrayList<>();
    }
    
    /**
     * Factory method to create a new basket.
     */
    public static Basket create(String customerId) {
        Basket basket = new Basket();
        basket.id = "bas-" + UUID.randomUUID().toString().substring(0, 8);
        basket.customerId = customerId;
        basket.items = new ArrayList<>();
        basket.status = BasketStatus.OPEN;
        basket.createdAt = Instant.now();
        basket.updatedAt = Instant.now();
        return basket;
    }
    
    /**
     * Add an item to the basket.
     */
    public void addItem(String productId, int quantity) {
        BasketItem existingItem = items.stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .orElse(null);
        
        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            items.add(new BasketItem(productId, quantity));
        }
        
        this.updatedAt = Instant.now();
    }
    
    /**
     * Remove an item from the basket.
     */
    public boolean removeItem(String productId) {
        boolean removed = items.removeIf(item -> item.getProductId().equals(productId));
        if (removed) {
            this.updatedAt = Instant.now();
        }
        return removed;
    }
    
    /**
     * Mark an item as unavailable (when stock-depleted event received).
     */
    public void markItemUnavailable(String productId) {
        items.stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .ifPresent(item -> item.setAvailable(false));
        
        this.updatedAt = Instant.now();
    }
    
    /**
     * Update basket status.
     */
    public void updateStatus(BasketStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Clear all items from the basket.
     */
    public void clearItems() {
        this.items.clear();
        this.updatedAt = Instant.now();
    }
    
    // Getters and Setters
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public List<BasketItem> getItems() {
        return items;
    }
    
    public void setItems(List<BasketItem> items) {
        this.items = items;
    }
    
    public BasketStatus getStatus() {
        return status;
    }
    
    public void setStatus(BasketStatus status) {
        this.status = status;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
