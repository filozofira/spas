package io.spas.examples.fulfillment.model;

/**
 * Shipment status enumeration representing the logistics lifecycle.
 */
public enum ShipmentStatus {
    /**
     * Shipment has been created but not yet processed.
     */
    PENDING,
    
    /**
     * Shipment is being picked, packed, or prepared.
     */
    PROCESSING,
    
    /**
     * Shipment has been handed to carrier with tracking number.
     */
    SHIPPED,
    
    /**
     * Shipment is in transit to destination.
     */
    IN_TRANSIT,
    
    /**
     * Shipment has been delivered to customer.
     */
    DELIVERED,
    
    /**
     * Shipment has been cancelled.
     */
    CANCELLED
}
