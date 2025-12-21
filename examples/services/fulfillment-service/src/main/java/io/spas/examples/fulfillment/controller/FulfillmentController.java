package io.spas.examples.fulfillment.controller;

import io.spas.examples.fulfillment.dto.ShipmentResponse;
import io.spas.examples.fulfillment.dto.UpdateStatusRequest;
import io.spas.examples.fulfillment.model.Shipment;
import io.spas.examples.fulfillment.service.FulfillmentService;
import io.spas.examples.fulfillment.service.FulfillmentService.ShipmentNotFoundException;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for fulfillment operations.
 * Provides endpoints for querying and managing shipments.
 */
@RestController
@RequestMapping("/api/fulfillments")
public class FulfillmentController {
    
    private static final Logger log = LoggerFactory.getLogger(FulfillmentController.class);
    
    private final FulfillmentService fulfillmentService;
    
    public FulfillmentController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }
    
    /**
     * Get a shipment by ID.
     */
    @SpasQuery(
        name = "GetShipment",
        version = "1.0.0",
        path = "/api/fulfillments/{id}",
        description = "Returns shipment details by shipmentId"
        // Auto-generates: schemas/endpoints/get-shipment.schema.json
    )
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentResponse> getShipment(@PathVariable String id) {
        log.info("Getting shipment: {}", id);
        
        return fulfillmentService.getShipment(id)
            .map(shipment -> ResponseEntity.ok(ShipmentResponse.from(shipment)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * List all shipments.
     */
    @SpasQuery(
        name = "ListShipments",
        version = "1.0.0",
        path = "/api/fulfillments",
        description = "Lists all known shipments (demo endpoint; may return in-memory state)"
        // Auto-generates: schemas/endpoints/list-shipments.schema.json
    )
    @GetMapping
    public ResponseEntity<List<ShipmentResponse>> listShipments() {
        log.info("Listing all shipments");
        
        List<ShipmentResponse> shipments = fulfillmentService.getAllShipments().stream()
            .map(ShipmentResponse::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(shipments);
    }
    
    /**
     * Update shipment status.
     * This triggers Flow 2 - a new trace is started for this operation.
     */
    @SpasCommand(
        name = "UpdateShipmentStatus",
        version = "1.0.0",
        path = "/api/fulfillments/{id}/status",
        description = "Updates a shipment's status (e.g., packed/shipped/delivered); emits ShipmentStatusChanged on success"
        // Auto-generates: schemas/endpoints/update-shipment-status.schema.json
    )
    @PostMapping("/{id}/status")
    public ResponseEntity<ShipmentResponse> updateShipmentStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request) {
        
        log.info("Updating shipment {} to status {}", id, request.getStatus());
        
        if (request.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Shipment shipment = fulfillmentService.updateShipmentStatus(id, request.getStatus());
            return ResponseEntity.ok(ShipmentResponse.from(shipment));
        } catch (ShipmentNotFoundException e) {
            log.warn("Shipment not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get shipment by order ID.
     */
    @SpasQuery(
        name = "GetShipmentByOrderId",
        version = "1.0.0",
        path = "/api/fulfillments/by-order/{orderId}",
        description = "Finds the shipment associated with a given orderId"
        // Auto-generates: schemas/endpoints/get-shipment-by-order-id.schema.json
    )
    @GetMapping("/by-order/{orderId}")
    public ResponseEntity<ShipmentResponse> getShipmentByOrderId(@PathVariable String orderId) {
        log.info("Getting shipment for order: {}", orderId);
        
        return fulfillmentService.getShipmentByOrderId(orderId)
            .map(shipment -> ResponseEntity.ok(ShipmentResponse.from(shipment)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Exception handler for ShipmentNotFoundException.
     */
    @ExceptionHandler(ShipmentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleShipmentNotFound(ShipmentNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
    
    /**
     * Error response DTO.
     */
    public static class ErrorResponse {
        private String code;
        private String message;
        
        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getMessage() {
            return message;
        }
    }
}
