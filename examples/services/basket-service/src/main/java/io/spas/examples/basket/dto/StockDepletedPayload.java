package io.spas.examples.basket.dto;

import java.time.Instant;

/**
 * DTO representing the payload of a stock-depleted event from inventory-service.
 */
public class StockDepletedPayload {
    
    private String productId;
    private String orderId;
    private int requestedQuantity;
    private int availableQuantity;
    private Instant timestamp;
    
    public StockDepletedPayload() {
    }
    
    // Getters and Setters
    
    public String getProductId() {
        return productId;
    }
    
    public void setProductId(String productId) {
        this.productId = productId;
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public int getRequestedQuantity() {
        return requestedQuantity;
    }
    
    public void setRequestedQuantity(int requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }
    
    public int getAvailableQuantity() {
        return availableQuantity;
    }
    
    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }
    
    public Instant getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
