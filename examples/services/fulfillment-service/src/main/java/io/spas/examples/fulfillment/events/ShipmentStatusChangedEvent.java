package io.spas.examples.fulfillment.events;

import io.spas.examples.fulfillment.model.ShipmentStatus;
import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;

/**
 * Event published when a shipment status changes.
 * This event is part of Flow 2 (Shipment Status Update) and initiates a new trace context
 * separate from the original order creation flow.
 */
@SpasEvent(
    type = "ShipmentStatusChanged",
    version = "1.0.0",
    description = "Emitted whenever a shipment's status changes; signals progress through the fulfillment lifecycle"
    // Auto-generates: schemas/events/shipment-status-changed.schema.json
)
public class ShipmentStatusChangedEvent {
    
    private String shipmentId;
    private String orderId;
    private ShipmentStatus status;
    private String trackingNumber;
    private Instant updatedAt;
    
    public ShipmentStatusChangedEvent() {
    }
    
    public ShipmentStatusChangedEvent(String shipmentId, String orderId, ShipmentStatus status,
                                       String trackingNumber, Instant updatedAt) {
        this.shipmentId = shipmentId;
        this.orderId = orderId;
        this.status = status;
        this.trackingNumber = trackingNumber;
        this.updatedAt = updatedAt;
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
    
    public String getTrackingNumber() {
        return trackingNumber;
    }
    
    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
