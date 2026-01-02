package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.Address;

/**
 * Request DTO for creating a shipment.
 * This is the transformed payload the sidecar sends when routing order-confirmed events.
 */
public class CreateShipmentRequest {
    
    private String referenceId;
    private String customerId;
    private Address shippingAddress;
    private String deliveryMethod; // SHIPMENT or PICKUP
    private String pickupLocationId; // required when deliveryMethod == PICKUP
    
    public CreateShipmentRequest() {
    }
    
    public CreateShipmentRequest(String referenceId, String customerId, Address shippingAddress,
                                 String deliveryMethod, String pickupLocationId) {
        this.referenceId = referenceId;
        this.customerId = customerId;
        this.shippingAddress = shippingAddress;
        this.deliveryMethod = deliveryMethod;
        this.pickupLocationId = pickupLocationId;
    }
    
    // Getters and Setters
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
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

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    public String getPickupLocationId() {
        return pickupLocationId;
    }

    public void setPickupLocationId(String pickupLocationId) {
        this.pickupLocationId = pickupLocationId;
    }
}
