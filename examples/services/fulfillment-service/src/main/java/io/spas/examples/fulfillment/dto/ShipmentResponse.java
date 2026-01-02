package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.Address;
import io.spas.examples.fulfillment.model.Shipment;
import io.spas.examples.fulfillment.model.ShipmentStatus;

import java.time.Instant;

/**
 * DTO for shipment responses in REST API.
 */
public class ShipmentResponse {
    
    private String shipmentId;
    private String referenceId;
    private ShipmentStatus status;
    private Address destination;
    private String deliveryMethod;
    private String pickupLocationId;
    private String trackingNumber;
    private Instant createdAt;
    private Instant updatedAt;
    
    public ShipmentResponse() {
    }
    
    /**
     * Creates a response DTO from a Shipment domain model.
     */
    public static ShipmentResponse from(Shipment shipment) {
        ShipmentResponse response = new ShipmentResponse();
        response.shipmentId = shipment.getId();
        response.referenceId = shipment.getReferenceId();
        response.status = shipment.getStatus();
        response.destination = shipment.getDestination();
        response.deliveryMethod = shipment.getDeliveryMethod();
        response.pickupLocationId = shipment.getPickupLocationId();
        response.trackingNumber = shipment.getTrackingNumber();
        response.createdAt = shipment.getCreatedAt();
        response.updatedAt = shipment.getUpdatedAt();
        return response;
    }
    
    // Getters and Setters
    
    public String getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(String shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
    
    public ShipmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }
    
    public Address getDestination() {
        return destination;
    }
    
    public void setDestination(Address destination) {
        this.destination = destination;
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
    
    public String getTrackingNumber() {
        return trackingNumber;
    }
    
    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
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
