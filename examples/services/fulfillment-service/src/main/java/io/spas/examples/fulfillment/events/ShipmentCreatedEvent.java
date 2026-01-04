package io.spas.examples.fulfillment.events;

import io.spas.examples.fulfillment.model.Address;
import io.spas.examples.fulfillment.model.ShipmentStatus;
import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;

/**
 * Event published when a new shipment is created for an order.
 * This event is part of Flow 1 (Order Fulfillment) and uses the same trace context
 * as the incoming order-confirmed event.
 */
@SpasEvent(
    type = "ShipmentCreated",
    version = "1.0.0",
    description = "Emitted after a shipment is created for a fulfillment request; indicates fulfillment has started"
    // Auto-generates: schemas/events/shipment-created.schema.json
)
public class ShipmentCreatedEvent {
    
    private String shipmentId;
    private String referenceId;
    private Address destination;
    private ShipmentStatus status;
    private Instant createdAt;
    
    public ShipmentCreatedEvent() {
    }
    
    public ShipmentCreatedEvent(String shipmentId, String referenceId, Address destination, 
                                 ShipmentStatus status, Instant createdAt) {
        this.shipmentId = shipmentId;
        this.referenceId = referenceId;
        this.destination = destination;
        this.status = status;
        this.createdAt = createdAt;
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
    
    public Address getDestination() {
        return destination;
    }
    
    public void setDestination(Address destination) {
        this.destination = destination;
    }
    
    public ShipmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
