package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.Address;
import org.jetbrains.annotations.Nullable;

/**
 * Request DTO for creating a shipment.
 * This is the transformed payload the sidecar sends when routing order-confirmed events.
 * 
 * <p>Demonstrates @Nullable usage for optional fields:</p>
 * <ul>
 *   <li><b>Required fields</b> (in schema's "required" array): referenceId, customerId, deliveryMethod</li>
 *   <li><b>Optional fields</b> (nullable in schema): shippingAddress, pickupLocationId, specialInstructions</li>
 * </ul>
 * 
 * <p>The generated JSON Schema will include a "required" array with non-nullable property names,
 * enabling AI-assisted choreography validation to verify mandatory field mappings.</p>
 */
public class CreateShipmentRequest {
    
    private String referenceId;
    private String customerId;
    @Nullable
    private Address shippingAddress; // Optional - null when deliveryMethod == PICKUP
    private String deliveryMethod; // SHIPMENT or PICKUP
    @Nullable
    private String pickupLocationId; // Optional - null when deliveryMethod == SHIPMENT
    @Nullable
    private String specialInstructions; // Optional - free-form delivery instructions
    
    public CreateShipmentRequest() {
    }
    
    public CreateShipmentRequest(String referenceId, String customerId, @Nullable Address shippingAddress,
                                 String deliveryMethod, @Nullable String pickupLocationId,
                                 @Nullable String specialInstructions) {
        this.referenceId = referenceId;
        this.customerId = customerId;
        this.shippingAddress = shippingAddress;
        this.deliveryMethod = deliveryMethod;
        this.pickupLocationId = pickupLocationId;
        this.specialInstructions = specialInstructions;
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
    
    @Nullable
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(@Nullable Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    @Nullable
    public String getPickupLocationId() {
        return pickupLocationId;
    }

    public void setPickupLocationId(@Nullable String pickupLocationId) {
        this.pickupLocationId = pickupLocationId;
    }

    @Nullable
    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(@Nullable String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }
}
