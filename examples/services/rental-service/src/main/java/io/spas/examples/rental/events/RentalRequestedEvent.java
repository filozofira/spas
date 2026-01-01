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
    private String deliveryMethod;
    private Address shippingAddress;
    private String pickupLocationId;

    public RentalRequestedEvent() {}

    public RentalRequestedEvent(UUID rentalId, String customerId, List<RentalItem> items,
                                LocalDateTime startDate, LocalDateTime endDate,
                                String deliveryMethod, Address shippingAddress, String pickupLocationId) {
        this.rentalId = rentalId;
        this.customerId = customerId;
        this.items = items;
        this.startDate = startDate;
        this.endDate = endDate;
        this.deliveryMethod = deliveryMethod;
        this.shippingAddress = shippingAddress;
        this.pickupLocationId = pickupLocationId;
    }

    public UUID getRentalId() { return rentalId; }
    public String getCustomerId() { return customerId; }
    public List<RentalItem> getItems() { return items; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public String getDeliveryMethod() { return deliveryMethod; }
    public Address getShippingAddress() { return shippingAddress; }
    public String getPickupLocationId() { return pickupLocationId; }

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

    public static class Address {
        private String street;
        private String city;
        private String state;
        private String postalCode;
        private String country;

        public Address() {}

        public Address(String street, String city, String state, String postalCode, String country) {
            this.street = street;
            this.city = city;
            this.state = state;
            this.postalCode = postalCode;
            this.country = country;
        }

        public String getStreet() { return street; }
        public String getCity() { return city; }
        public String getState() { return state; }
        public String getPostalCode() { return postalCode; }
        public String getCountry() { return country; }
    }
}
