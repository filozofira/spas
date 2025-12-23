package io.spas.examples.basket.repository;

import io.spas.examples.basket.model.Basket;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory repository for baskets.
 * Uses ConcurrentHashMap for thread-safe operations.
 */
@Repository
public class BasketRepository {
    
    private final Map<String, Basket> baskets = new ConcurrentHashMap<>();
    
    /**
     * Save a basket to the repository.
     */
    public Basket save(Basket basket) {
        baskets.put(basket.getId(), basket);
        return basket;
    }
    
    /**
     * Find a basket by its ID.
     */
    public Optional<Basket> findById(String id) {
        return Optional.ofNullable(baskets.get(id));
    }
    
    /**
     * Get all baskets.
     */
    public Collection<Basket> findAll() {
        return baskets.values();
    }
    
    /**
     * Delete a basket by ID.
     */
    public void deleteById(String id) {
        baskets.remove(id);
    }
    
    /**
     * Clear all baskets (useful for testing).
     */
    public void clear() {
        baskets.clear();
    }
    
    /**
     * Get the count of baskets.
     */
    public int count() {
        return baskets.size();
    }
}
