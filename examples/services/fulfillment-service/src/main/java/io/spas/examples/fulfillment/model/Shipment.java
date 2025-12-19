package io.spas.examples.fulfillment.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Domain model representing a shipment in the fulfillment process.
 */
public class Shipment {
    
    private String id;
    private String orderId;
    private ShipmentStatus status;
    private Address destination;
    private String trackingNumber;
    private Instant createdAt;
    private Instant updatedAt;
    
    public Shipment() {
    }
    
    /**
     * Creates a new shipment for the given order.
     */
    public static Shipment create(String orderId, Address destination) {
        Shipment shipment = new Shipment();
        shipment.id = "ship-" + UUID.randomUUID().toString().substring(0, 8);
        shipment.orderId = orderId;
        shipment.status = ShipmentStatus.PENDING;
        shipment.destination = destination;
        shipment.createdAt = Instant.now();
        shipment.updatedAt = shipment.createdAt;
        return shipment;
    }
    
    /**
     * Updates the shipment status and optionally generates a tracking number.
     */
    public void updateStatus(ShipmentStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        
        // Generate tracking number when status transitions to SHIPPED
        if (newStatus == ShipmentStatus.SHIPPED && this.trackingNumber == null) {
            this.trackingNumber = "TRACK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
    
    // Getters and Setters
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
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
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Shipment shipment = (Shipment) o;
        return Objects.equals(id, shipment.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Shipment{" +
               "id='" + id + '\'' +
               ", orderId='" + orderId + '\'' +
               ", status=" + status +
               ", destination=" + destination +
               ", trackingNumber='" + trackingNumber + '\'' +
               ", createdAt=" + createdAt +
               ", updatedAt=" + updatedAt +
               '}';
    }
}
