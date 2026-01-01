package io.spas.examples.rental.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RentalRequest {
    private String customerId;
    private List<RentalItemRequest> items;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String deliveryMethod; // SHIPMENT or PICKUP
    private Address shippingAddress; // required when deliveryMethod == SHIPMENT
    private String pickupLocationId; // required when deliveryMethod == PICKUP

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public List<RentalItemRequest> getItems() { return items; }
    public void setItems(List<RentalItemRequest> items) { this.items = items; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public String getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(String deliveryMethod) { this.deliveryMethod = deliveryMethod; }

    public Address getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(Address shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getPickupLocationId() { return pickupLocationId; }
    public void setPickupLocationId(String pickupLocationId) { this.pickupLocationId = pickupLocationId; }

    public static class RentalItemRequest {
        private String productId;
        private int quantity;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public static class Address {
        private String street;
        private String city;
        private String state;
        private String postalCode;
        private String country;

        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getState() { return state; }
        public void setState(String state) { this.state = state; }

        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }
}
