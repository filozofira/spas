package io.spas.examples.basket.dto;

import io.spas.examples.basket.model.Address;

/**
 * Request DTO for initiating checkout.
 */
public class CheckoutRequest {
    
    private Address shippingAddress;
    
    public CheckoutRequest() {
    }
    
    public CheckoutRequest(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    // Getters and Setters
    
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
}
