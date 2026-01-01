package io.spas.examples.rental.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RentalRequest {
    private String customerId;
    private List<RentalItemRequest> items;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public List<RentalItemRequest> getItems() { return items; }
    public void setItems(List<RentalItemRequest> items) { this.items = items; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public static class RentalItemRequest {
        private String productId;
        private int quantity;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}
