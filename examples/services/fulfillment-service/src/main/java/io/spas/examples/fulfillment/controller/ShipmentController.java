package io.spas.examples.fulfillment.controller;

import io.spas.examples.fulfillment.dto.CreateShipmentRequest;
import io.spas.examples.fulfillment.dto.ShipmentResponse;
import io.spas.examples.fulfillment.events.ShipmentCreatedEvent;
import io.spas.examples.fulfillment.model.Shipment;
import io.spas.examples.fulfillment.service.FulfillmentService;
import io.spas.sdk.metadata.annotations.SpasCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for shipment creation.
 * Receives transformed order-confirmed events from the SPAS sidecar.
 */
@RestController
@RequestMapping("/shipments")
public class ShipmentController {
    
    private static final Logger log = LoggerFactory.getLogger(ShipmentController.class);
    
    private final FulfillmentService fulfillmentService;
    
    public ShipmentController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }
    
    /**
     * Create a new shipment for an order.
     * Called by sidecar when order-confirmed event is received.
     */
    @SpasCommand(
        name = "CreateShipment",
        version = "1.0.0",
        description = "Creates a shipment for a confirmed order using the destination address; emits ShipmentCreated when successful",
        produces = { ShipmentCreatedEvent.class }
        // Auto-generates: schemas/endpoints/create-shipment.schema.json
    )
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(@RequestBody CreateShipmentRequest request) {
        log.info("Creating shipment for reference: {}", request.getReferenceId());

        if (request.getReferenceId() == null || request.getReferenceId().isBlank()) {
            log.warn("Missing referenceId in request");
            return ResponseEntity.badRequest().build();
        }
        
        String deliveryMethod = request.getDeliveryMethod();
        if (deliveryMethod == null || deliveryMethod.isBlank()) {
            deliveryMethod = "SHIPMENT";
        }

        if ("SHIPMENT".equalsIgnoreCase(deliveryMethod) && request.getShippingAddress() == null) {
            log.warn("Missing shippingAddress for SHIPMENT reference: {}", request.getReferenceId());
            return ResponseEntity.badRequest().build();
        }

        if ("PICKUP".equalsIgnoreCase(deliveryMethod)) {
            if (request.getPickupLocationId() == null || request.getPickupLocationId().isBlank()) {
                log.warn("Missing pickupLocationId for PICKUP reference: {}", request.getReferenceId());
                return ResponseEntity.badRequest().build();
            }
        }
        
        try {
            Shipment shipment = fulfillmentService.createShipment(
                request.getReferenceId(),
                request.getCustomerId(),
                request.getShippingAddress(),
                deliveryMethod,
                request.getPickupLocationId()
            );
            
            log.info("Created shipment {} for reference {}", shipment.getId(), request.getReferenceId());
            return ResponseEntity.ok(ShipmentResponse.from(shipment));
            
        } catch (IllegalStateException e) {
            // Idempotency: shipment already exists for this order
            log.info("Shipment already exists for reference: {}", request.getReferenceId());
            return fulfillmentService.getShipmentByReferenceId(request.getReferenceId())
                .map(shipment -> ResponseEntity.ok(ShipmentResponse.from(shipment)))
                .orElse(ResponseEntity.internalServerError().build());
        } catch (Exception e) {
            log.error("Failed to create shipment for reference: {}", request.getReferenceId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
