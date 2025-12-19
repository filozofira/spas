package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.ShipmentStatus;

/**
 * DTO for updating shipment status via REST API.
 */
public class UpdateStatusRequest {
    
    private ShipmentStatus status;
    
    public UpdateStatusRequest() {
    }
    
    public UpdateStatusRequest(ShipmentStatus status) {
        this.status = status;
    }
    
    public ShipmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }
}
