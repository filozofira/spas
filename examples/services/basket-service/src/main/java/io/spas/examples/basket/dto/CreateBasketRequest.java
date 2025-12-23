package io.spas.examples.basket.dto;

/**
 * Request DTO for creating a basket.
 */
public class CreateBasketRequest {
    
    private String customerId;
    
    public CreateBasketRequest() {
    }
    
    public CreateBasketRequest(String customerId) {
        this.customerId = customerId;
    }
    
    // Getters and Setters
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
}
