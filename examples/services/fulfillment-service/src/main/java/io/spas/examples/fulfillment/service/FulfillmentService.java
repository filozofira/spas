package io.spas.examples.fulfillment.service;

import io.spas.examples.fulfillment.dto.OrderConfirmedPayload;
import io.spas.examples.fulfillment.events.ShipmentCreatedEvent;
import io.spas.examples.fulfillment.events.ShipmentStatusChangedEvent;
import io.spas.examples.fulfillment.model.Address;
import io.spas.examples.fulfillment.model.Shipment;
import io.spas.examples.fulfillment.model.ShipmentStatus;
import io.spas.examples.fulfillment.repository.ShipmentRepository;
import io.spas.sdk.events.EventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

/**
 * Business logic for fulfillment operations.
 */
@Service
public class FulfillmentService {
    
    private static final Logger log = LoggerFactory.getLogger(FulfillmentService.class);
    
    private final ShipmentRepository shipmentRepository;
    private final EventPublisher eventPublisher;
    
    public FulfillmentService(ShipmentRepository shipmentRepository, EventPublisher eventPublisher) {
        this.shipmentRepository = shipmentRepository;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * Create a shipment for an order.
     * This is Flow 1 - uses the same trace context from the incoming request.
     * 
     * @param orderId The order ID
     * @param customerId The customer ID
     * @param shippingAddress The shipping address
     * @return The created shipment
     * @throws IllegalStateException if shipment already exists for this order
     */
    public Shipment createShipment(String orderId, String customerId, Address shippingAddress) {
        log.info("Creating shipment for order: {}", orderId);
        
        // Idempotency check - don't create duplicate shipments for the same order
        if (shipmentRepository.existsByOrderId(orderId)) {
            log.warn("Shipment already exists for order: {}. Returning existing.", orderId);
            throw new IllegalStateException("Shipment already exists for order: " + orderId);
        }
        
        // Create new shipment
        Shipment shipment = Shipment.create(orderId, shippingAddress);
        shipmentRepository.save(shipment);
        
        log.info("Created shipment {} for order {} with status {}", 
                 shipment.getId(), orderId, shipment.getStatus());
        
        // Publish shipment-created event (Flow 1 - same trace context)
        publishShipmentCreated(shipment);
        
        return shipment;
    }
    
    /**
     * @deprecated Use {@link #createShipment(String, String, Address)} instead.
     */
    @Deprecated
    public Shipment processOrderConfirmed(OrderConfirmedPayload payload) {
        return createShipment(payload.getOrderId(), payload.getCustomerId(), payload.getShippingAddress());
    }
    
    /**
     * Update the status of a shipment.
     * This is Flow 2 - triggers a new trace context.
     * 
     * @param shipmentId The shipment ID
     * @param newStatus The new status
     * @return The updated shipment
     */
    public Shipment updateShipmentStatus(String shipmentId, ShipmentStatus newStatus) {
        log.info("Updating shipment {} to status {}", shipmentId, newStatus);
        
        Shipment shipment = shipmentRepository.findById(shipmentId)
            .orElseThrow(() -> new ShipmentNotFoundException("Shipment not found: " + shipmentId));
        
        ShipmentStatus previousStatus = shipment.getStatus();
        shipment.updateStatus(newStatus);
        shipmentRepository.save(shipment);
        
        log.info("Shipment {} status updated from {} to {}. TrackingNumber: {}", 
                 shipmentId, previousStatus, newStatus, shipment.getTrackingNumber());
        
        // Publish shipment-status-changed event (Flow 2 - new trace context)
        publishShipmentStatusChanged(shipment);
        
        return shipment;
    }
    
    /**
     * Get a shipment by ID.
     */
    public Optional<Shipment> getShipment(String shipmentId) {
        return shipmentRepository.findById(shipmentId);
    }
    
    /**
     * Get all shipments.
     */
    public Collection<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }
    
    /**
     * Get a shipment by order ID.
     */
    public Optional<Shipment> getShipmentByOrderId(String orderId) {
        return shipmentRepository.findByOrderId(orderId);
    }
    
    /**
     * Publish shipment-created event to sidecar.
     */
    private void publishShipmentCreated(Shipment shipment) {
        ShipmentCreatedEvent event = new ShipmentCreatedEvent(
            shipment.getId(),
            shipment.getOrderId(),
            shipment.getDestination(),
            shipment.getStatus(),
            shipment.getCreatedAt()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published shipment-created event for shipment: {}", shipment.getId());
        } catch (Exception e) {
            log.error("Failed to publish shipment-created event for shipment: {}", shipment.getId(), e);
            // In production, consider retry logic or dead-letter queue
        }
    }
    
    /**
     * Publish shipment-status-changed event to sidecar.
     */
    private void publishShipmentStatusChanged(Shipment shipment) {
        ShipmentStatusChangedEvent event = new ShipmentStatusChangedEvent(
            shipment.getId(),
            shipment.getOrderId(),
            shipment.getStatus(),
            shipment.getTrackingNumber(),
            shipment.getUpdatedAt()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published shipment-status-changed event for shipment: {} with status: {}", 
                     shipment.getId(), shipment.getStatus());
        } catch (Exception e) {
            log.error("Failed to publish shipment-status-changed event for shipment: {}", 
                      shipment.getId(), e);
            // In production, consider retry logic or dead-letter queue
        }
    }
    
    /**
     * Exception thrown when a shipment is not found.
     */
    public static class ShipmentNotFoundException extends RuntimeException {
        public ShipmentNotFoundException(String message) {
            super(message);
        }
    }
}
