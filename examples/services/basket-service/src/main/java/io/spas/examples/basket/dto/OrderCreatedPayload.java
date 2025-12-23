package io.spas.examples.basket.dto;

import java.time.Instant;

/**
 * DTO representing the payload of an order-created event from order-service.
 */
public class OrderCreatedPayload {
    
    private String orderId;
    private String customerId;
    private String referenceId;  // This will contain the basketId
    private Instant createdAt;
    
    public OrderCreatedPayload() {
    }
    
    // Getters and Setters
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
