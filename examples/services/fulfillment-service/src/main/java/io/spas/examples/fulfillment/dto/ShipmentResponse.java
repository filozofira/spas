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
    private String orderId;
    private ShipmentStatus status;
    private Address destination;
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
        response.orderId = shipment.getOrderId();
        response.status = shipment.getStatus();
        response.destination = shipment.getDestination();
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
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
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
