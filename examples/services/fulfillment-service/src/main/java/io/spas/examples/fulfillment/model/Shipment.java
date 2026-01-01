package io.spas.examples.fulfillment.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Domain model representing a shipment in the fulfillment process.
 */
public class Shipment {
    
    private String id;
    private String referenceId;
    private ShipmentStatus status;
    private Address destination;
    private String deliveryMethod;
    private String pickupLocationId;
    private String trackingNumber;
    private Instant createdAt;
    private Instant updatedAt;
    
    public Shipment() {
    }
    
    /**
     * Creates a new shipment for the given order.
     */
    public static Shipment create(String referenceId, Address destination, String deliveryMethod, String pickupLocationId) {
        Shipment shipment = new Shipment();
        shipment.id = "ship-" + UUID.randomUUID().toString().substring(0, 8);
        shipment.referenceId = referenceId;
        shipment.status = ShipmentStatus.PENDING;
        shipment.destination = destination;
        shipment.deliveryMethod = deliveryMethod;
        shipment.pickupLocationId = pickupLocationId;
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
               ", referenceId='" + referenceId + '\'' +
               ", status=" + status +
               ", destination=" + destination +
               ", trackingNumber='" + trackingNumber + '\'' +
               ", createdAt=" + createdAt +
               ", updatedAt=" + updatedAt +
               '}';
    }
}
