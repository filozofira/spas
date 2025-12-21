package io.spas.examples.fulfillment.controller;

import io.spas.examples.fulfillment.dto.CreateShipmentRequest;
import io.spas.examples.fulfillment.dto.ShipmentResponse;
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
        path = "/shipments",
        description = "Creates a shipment for a confirmed order using the destination address; emits ShipmentCreated when successful"
        // Auto-generates: schemas/endpoints/create-shipment.schema.json
    )
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(@RequestBody CreateShipmentRequest request) {
        log.info("Creating shipment for order: {}", request.getOrderId());
        
        if (request.getOrderId() == null || request.getOrderId().isBlank()) {
            log.warn("Missing orderId in request");
            return ResponseEntity.badRequest().build();
        }
        
        if (request.getShippingAddress() == null) {
            log.warn("Missing shippingAddress for order: {}", request.getOrderId());
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Shipment shipment = fulfillmentService.createShipment(
                request.getOrderId(),
                request.getCustomerId(),
                request.getShippingAddress()
            );
            
            log.info("Created shipment {} for order {}", shipment.getId(), request.getOrderId());
            return ResponseEntity.ok(ShipmentResponse.from(shipment));
            
        } catch (IllegalStateException e) {
            // Idempotency: shipment already exists for this order
            log.info("Shipment already exists for order: {}", request.getOrderId());
            return fulfillmentService.getShipmentByOrderId(request.getOrderId())
                .map(shipment -> ResponseEntity.ok(ShipmentResponse.from(shipment)))
                .orElse(ResponseEntity.internalServerError().build());
        } catch (Exception e) {
            log.error("Failed to create shipment for order: {}", request.getOrderId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
