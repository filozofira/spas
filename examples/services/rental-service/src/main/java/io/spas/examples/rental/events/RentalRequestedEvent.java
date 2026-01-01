package io.spas.examples.rental.events;

import io.spas.sdk.metadata.annotations.SpasEvent;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@SpasEvent(type = "RentalRequested", version = "1.0", description = "Emitted when a new rental is requested")
public class RentalRequestedEvent {
    private UUID rentalId;
    private String customerId;
    private List<RentalItem> items;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public RentalRequestedEvent() {}

    public RentalRequestedEvent(UUID rentalId, String customerId, List<RentalItem> items, LocalDateTime startDate, LocalDateTime endDate) {
        this.rentalId = rentalId;
        this.customerId = customerId;
        this.items = items;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public UUID getRentalId() { return rentalId; }
    public String getCustomerId() { return customerId; }
    public List<RentalItem> getItems() { return items; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }

    public static class RentalItem {
        private String productId;
        private int quantity;

        public RentalItem() {}
        public RentalItem(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public String getProductId() { return productId; }
        public int getQuantity() { return quantity; }
    }
}
