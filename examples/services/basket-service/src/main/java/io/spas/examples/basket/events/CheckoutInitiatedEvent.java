package io.spas.examples.basket.events;

import io.spas.examples.basket.model.Address;
import io.spas.sdk.metadata.annotations.SpasEvent;

import java.time.Instant;
import java.util.List;

/**
 * Event published when checkout is initiated on a basket.
 * This is the key choreography event that triggers order creation.
 */
@SpasEvent(
    type = "CheckoutInitiated",
    version = "1.0.0",
    description = "Emitted when a customer initiates checkout; contains all order details including shipping address to enable order-service and fulfillment-service integration"
)
public class CheckoutInitiatedEvent {
    
    private String basketId;
    private String customerId;
    private List<CheckoutItem> items;
    private Address shippingAddress;
    private Instant checkoutAt;
    
    public CheckoutInitiatedEvent() {
    }
    
    public CheckoutInitiatedEvent(String basketId, String customerId, List<CheckoutItem> items, 
                                   Address shippingAddress, Instant checkoutAt) {
        this.basketId = basketId;
        this.customerId = customerId;
        this.items = items;
        this.shippingAddress = shippingAddress;
        this.checkoutAt = checkoutAt;
    }
    
    // Getters and Setters
    
    public String getBasketId() {
        return basketId;
    }
    
    public void setBasketId(String basketId) {
        this.basketId = basketId;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public List<CheckoutItem> getItems() {
        return items;
    }
    
    public void setItems(List<CheckoutItem> items) {
        this.items = items;
    }
    
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public Instant getCheckoutAt() {
        return checkoutAt;
    }
    
    public void setCheckoutAt(Instant checkoutAt) {
        this.checkoutAt = checkoutAt;
    }
    
    /**
     * Nested class representing a checkout line item.
     */
    public static class CheckoutItem {
        private String productId;
        private int quantity;
        
        public CheckoutItem() {
        }
        
        public CheckoutItem(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }
        
        public String getProductId() {
            return productId;
        }
        
        public void setProductId(String productId) {
            this.productId = productId;
        }
        
        public int getQuantity() {
            return quantity;
        }
        
        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}
