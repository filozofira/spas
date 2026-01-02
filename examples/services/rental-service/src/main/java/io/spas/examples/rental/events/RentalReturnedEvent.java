package io.spas.examples.rental.events;

import io.spas.sdk.metadata.annotations.SpasEvent;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@SpasEvent(type = "RentalReturned", version = "1.0", description = "Emitted when rental items are returned")
public class RentalReturnedEvent {
    private UUID rentalId;
    private List<ReturnedItem> items;
    private LocalDateTime returnedAt;

    public RentalReturnedEvent() {}

    public RentalReturnedEvent(UUID rentalId, List<ReturnedItem> items, LocalDateTime returnedAt) {
        this.rentalId = rentalId;
        this.items = items;
        this.returnedAt = returnedAt;
    }

    public UUID getRentalId() { return rentalId; }
    public List<ReturnedItem> getItems() { return items; }
    public LocalDateTime getReturnedAt() { return returnedAt; }

    public static class ReturnedItem {
        private String productId;
        private int quantity;

        public ReturnedItem() {}
        public ReturnedItem(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public String getProductId() { return productId; }
        public int getQuantity() { return quantity; }
    }
}
