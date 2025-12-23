package io.spas.examples.basket.model;

import java.util.Objects;

/**
 * Represents an item in a shopping basket.
 */
public class BasketItem {
    
    private String productId;
    private int quantity;
    private boolean available;  // Set to false if stock-depleted event received
    
    public BasketItem() {
    }
    
    public BasketItem(String productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
        this.available = true;
    }
    
    // Getters and Setters
    
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
    
    public boolean isAvailable() {
        return available;
    }
    
    public void setAvailable(boolean available) {
        this.available = available;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BasketItem that = (BasketItem) o;
        return Objects.equals(productId, that.productId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(productId);
    }
    
    @Override
    public String toString() {
        return "BasketItem{" +
               "productId='" + productId + '\'' +
               ", quantity=" + quantity +
               ", available=" + available +
               '}';
    }
}
