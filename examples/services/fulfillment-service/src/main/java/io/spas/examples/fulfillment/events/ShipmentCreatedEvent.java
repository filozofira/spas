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
    description = "Emitted after a shipment is created for a confirmed order; indicates fulfillment has started"
    // Auto-generates: schemas/events/shipment-created.schema.json
)
public class ShipmentCreatedEvent {
    
    private String shipmentId;
    private String orderId;
    private Address destination;
    private ShipmentStatus status;
    private Instant createdAt;
    
    public ShipmentCreatedEvent() {
    }
    
    public ShipmentCreatedEvent(String shipmentId, String orderId, Address destination, 
                                 ShipmentStatus status, Instant createdAt) {
        this.shipmentId = shipmentId;
        this.orderId = orderId;
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
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
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
