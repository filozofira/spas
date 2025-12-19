package io.spas.examples.fulfillment.dto;

import io.spas.examples.fulfillment.model.Address;

import java.util.List;

/**
 * DTO representing the payload of an order-confirmed event from order-service.
 */
public class OrderConfirmedPayload {
    
    private String orderId;
    private String customerId;
    private List<OrderItem> items;
    private Address shippingAddress;
    private Double total;
    
    public OrderConfirmedPayload() {
    }
    
    // Getters and Setters
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public List<OrderItem> getItems() {
        return items;
    }
    
    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
    
    public Address getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public Double getTotal() {
        return total;
    }
    
    public void setTotal(Double total) {
        this.total = total;
    }
    
    /**
     * Nested class representing an order line item.
     */
    public static class OrderItem {
        private String productId;
        private int quantity;
        
        public OrderItem() {
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
