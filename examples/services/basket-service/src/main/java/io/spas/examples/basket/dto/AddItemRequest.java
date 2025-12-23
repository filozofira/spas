package io.spas.examples.basket.dto;

/**
 * Request DTO for adding an item to a basket.
 */
public class AddItemRequest {
    
    private String productId;
    private int quantity;
    
    public AddItemRequest() {
    }
    
    public AddItemRequest(String productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
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
}
