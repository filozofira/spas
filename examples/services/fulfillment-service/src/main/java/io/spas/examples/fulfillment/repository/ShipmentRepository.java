package io.spas.examples.fulfillment.repository;

import io.spas.examples.fulfillment.model.Shipment;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory repository for shipments.
 * Uses ConcurrentHashMap for thread-safe operations.
 */
@Repository
public class ShipmentRepository {
    
    private final Map<String, Shipment> shipments = new ConcurrentHashMap<>();
    private final Map<String, String> orderToShipment = new ConcurrentHashMap<>();
    
    /**
     * Save a shipment to the repository.
     */
    public Shipment save(Shipment shipment) {
        shipments.put(shipment.getId(), shipment);
        orderToShipment.put(shipment.getOrderId(), shipment.getId());
        return shipment;
    }
    
    /**
     * Find a shipment by its ID.
     */
    public Optional<Shipment> findById(String id) {
        return Optional.ofNullable(shipments.get(id));
    }
    
    /**
     * Find a shipment by order ID.
     */
    public Optional<Shipment> findByOrderId(String orderId) {
        String shipmentId = orderToShipment.get(orderId);
        if (shipmentId == null) {
            return Optional.empty();
        }
        return findById(shipmentId);
    }
    
    /**
     * Check if a shipment exists for the given order ID.
     */
    public boolean existsByOrderId(String orderId) {
        return orderToShipment.containsKey(orderId);
    }
    
    /**
     * Get all shipments.
     */
    public Collection<Shipment> findAll() {
        return shipments.values();
    }
    
    /**
     * Delete a shipment by ID.
     */
    public void deleteById(String id) {
        Shipment shipment = shipments.remove(id);
        if (shipment != null) {
            orderToShipment.remove(shipment.getOrderId());
        }
    }
    
    /**
     * Clear all shipments (useful for testing).
     */
    public void clear() {
        shipments.clear();
        orderToShipment.clear();
    }
    
    /**
     * Get the count of shipments.
     */
    public int count() {
        return shipments.size();
    }
}
