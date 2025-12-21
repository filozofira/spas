package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.Address;

/**
 * Request DTO for creating a shipment.
 * This is the transformed payload the sidecar sends when routing order-confirmed events.
 */
public class CreateShipmentRequest {
    
    private String orderId;
    private String customerId;
    private Address shippingAddress;
    
    public CreateShipmentRequest() {
    }
    
    public CreateShipmentRequest(String orderId, String customerId, Address shippingAddress) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.shippingAddress = shippingAddress;
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
    
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
}
