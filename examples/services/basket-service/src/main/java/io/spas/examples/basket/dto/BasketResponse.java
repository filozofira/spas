package io.spas.examples.basket.dto;

import io.spas.examples.basket.model.Basket;
import io.spas.examples.basket.model.BasketItem;
import io.spas.examples.basket.model.BasketStatus;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for basket operations.
 */
public class BasketResponse {
    
    private String basketId;
    private String customerId;
    private List<ItemInfo> items;
    private BasketStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    
    public BasketResponse() {
    }
    
    /**
     * Factory method to create a response from a Basket domain model.
     */
    public static BasketResponse from(Basket basket) {
        BasketResponse response = new BasketResponse();
        response.basketId = basket.getId();
        response.customerId = basket.getCustomerId();
        response.items = basket.getItems().stream()
            .map(ItemInfo::from)
            .collect(Collectors.toList());
        response.status = basket.getStatus();
        response.createdAt = basket.getCreatedAt();
        response.updatedAt = basket.getUpdatedAt();
        return response;
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
    
    public List<ItemInfo> getItems() {
        return items;
    }
    
    public void setItems(List<ItemInfo> items) {
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
    
    /**
     * Nested class representing item information in the response.
     */
    public static class ItemInfo {
        private String productId;
        private int quantity;
        private boolean available;
        
        public static ItemInfo from(BasketItem item) {
            ItemInfo info = new ItemInfo();
            info.productId = item.getProductId();
            info.quantity = item.getQuantity();
            info.available = item.isAvailable();
            return info;
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
        
        public boolean isAvailable() {
            return available;
        }
        
        public void setAvailable(boolean available) {
            this.available = available;
        }
    }
}
