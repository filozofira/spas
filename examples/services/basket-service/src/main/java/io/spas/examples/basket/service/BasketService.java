package io.spas.examples.basket.service;

import io.spas.examples.basket.dto.OrderCreatedPayload;
import io.spas.examples.basket.dto.StockDepletedPayload;
import io.spas.examples.basket.events.BasketCreatedEvent;
import io.spas.examples.basket.events.CheckoutInitiatedEvent;
import io.spas.examples.basket.events.ItemAddedEvent;
import io.spas.examples.basket.events.ItemRemovedEvent;
import io.spas.examples.basket.model.Address;
import io.spas.examples.basket.model.Basket;
import io.spas.examples.basket.model.BasketItem;
import io.spas.examples.basket.model.BasketStatus;
import io.spas.examples.basket.repository.BasketRepository;
import io.spas.sdk.events.EventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Business logic for basket operations.
 */
@Service
public class BasketService {
    
    private static final Logger log = LoggerFactory.getLogger(BasketService.class);
    
    private final BasketRepository basketRepository;
    private final EventPublisher eventPublisher;
    
    public BasketService(BasketRepository basketRepository, EventPublisher eventPublisher) {
        this.basketRepository = basketRepository;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * Create a new basket.
     */
    public Basket createBasket(String customerId) {
        log.info("Creating basket for customer: {}", customerId);
        
        Basket basket = Basket.create(customerId);
        basketRepository.save(basket);
        
        log.info("Created basket {} for customer {}", basket.getId(), customerId);
        
        // Publish basket-created event
        publishBasketCreated(basket);
        
        return basket;
    }
    
    /**
     * Add an item to a basket.
     */
    public Basket addItem(String basketId, String productId, int quantity) {
        log.info("Adding item {} (qty: {}) to basket {}", productId, quantity, basketId);
        
        Basket basket = basketRepository.findById(basketId)
            .orElseThrow(() -> new BasketNotFoundException("Basket not found: " + basketId));
        
        if (basket.getStatus() != BasketStatus.OPEN) {
            throw new IllegalStateException("Cannot add items to basket in status: " + basket.getStatus());
        }
        
        basket.addItem(productId, quantity);
        basketRepository.save(basket);
        
        log.info("Added item {} to basket {}", productId, basketId);
        
        // Publish item-added event
        publishItemAdded(basket, productId, quantity);
        
        return basket;
    }
    
    /**
     * Remove an item from a basket.
     */
    public Basket removeItem(String basketId, String productId) {
        log.info("Removing item {} from basket {}", productId, basketId);
        
        Basket basket = basketRepository.findById(basketId)
            .orElseThrow(() -> new BasketNotFoundException("Basket not found: " + basketId));
        
        if (basket.getStatus() != BasketStatus.OPEN) {
            throw new IllegalStateException("Cannot remove items from basket in status: " + basket.getStatus());
        }
        
        boolean removed = basket.removeItem(productId);
        if (!removed) {
            throw new ItemNotFoundException("Item not found in basket: " + productId);
        }
        
        basketRepository.save(basket);
        
        log.info("Removed item {} from basket {}", productId, basketId);
        
        // Publish item-removed event
        publishItemRemoved(basket, productId);
        
        return basket;
    }
    
    /**
     * Initiate checkout for a basket.
     */
    public Basket initiateCheckout(String basketId, Address shippingAddress) {
        log.info("Initiating checkout for basket: {}", basketId);
        
        Basket basket = basketRepository.findById(basketId)
            .orElseThrow(() -> new BasketNotFoundException("Basket not found: " + basketId));
        
        if (basket.getStatus() != BasketStatus.OPEN) {
            throw new IllegalStateException("Cannot checkout basket in status: " + basket.getStatus());
        }
        
        if (basket.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot checkout empty basket");
        }
        
        basket.updateStatus(BasketStatus.CHECKOUT);
        basketRepository.save(basket);
        
        log.info("Checkout initiated for basket {}", basketId);
        
        // Publish checkout-initiated event
        publishCheckoutInitiated(basket, shippingAddress);
        
        return basket;
    }
    
    /**
     * Get a basket by ID.
     */
    public Optional<Basket> getBasket(String basketId) {
        return basketRepository.findById(basketId);
    }
    
    /**
     * Get all baskets (for demo purposes).
     */
    public Collection<Basket> getAllBaskets() {
        return basketRepository.findAll();
    }
    
    /**
     * Handle stock-depleted event from inventory-service.
     */
    public void handleStockDepleted(StockDepletedPayload payload) {
        log.info("Handling stock-depleted for product: {}", payload.getProductId());
        
        // Mark the product as unavailable in all open baskets containing it
        basketRepository.findAll().stream()
            .filter(basket -> basket.getStatus() == BasketStatus.OPEN)
            .filter(basket -> basket.getItems().stream()
                .anyMatch(item -> item.getProductId().equals(payload.getProductId())))
            .forEach(basket -> {
                basket.markItemUnavailable(payload.getProductId());
                basketRepository.save(basket);
                log.info("Marked product {} as unavailable in basket {}", 
                         payload.getProductId(), basket.getId());
            });
    }
    
    /**
     * Handle order-created event from order-service.
     */
    public void handleOrderCreated(OrderCreatedPayload payload) {
        log.info("Handling order-created for order: {}", payload.getOrderId());
        
        // Clear the basket identified by referenceId (basketId)
        if (payload.getReferenceId() != null) {
            basketRepository.findById(payload.getReferenceId()).ifPresent(basket -> {
                basket.clearItems();
                basket.updateStatus(BasketStatus.ORDERED);
                basketRepository.save(basket);
                log.info("Cleared basket {} after order creation", basket.getId());
            });
        }
    }
    
    /**
     * Publish basket-created event to sidecar.
     */
    private void publishBasketCreated(Basket basket) {
        BasketCreatedEvent event = new BasketCreatedEvent(
            basket.getId(),
            basket.getCustomerId(),
            basket.getCreatedAt()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published basket-created event for basket: {}", basket.getId());
        } catch (Exception e) {
            log.error("Failed to publish basket-created event for basket: {}", basket.getId(), e);
        }
    }
    
    /**
     * Publish item-added event to sidecar.
     */
    private void publishItemAdded(Basket basket, String productId, int quantity) {
        ItemAddedEvent event = new ItemAddedEvent(
            basket.getId(),
            basket.getCustomerId(),
            productId,
            quantity,
            Instant.now()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published item-added event for basket: {}", basket.getId());
        } catch (Exception e) {
            log.error("Failed to publish item-added event for basket: {}", basket.getId(), e);
        }
    }
    
    /**
     * Publish item-removed event to sidecar.
     */
    private void publishItemRemoved(Basket basket, String productId) {
        ItemRemovedEvent event = new ItemRemovedEvent(
            basket.getId(),
            basket.getCustomerId(),
            productId,
            Instant.now()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published item-removed event for basket: {}", basket.getId());
        } catch (Exception e) {
            log.error("Failed to publish item-removed event for basket: {}", basket.getId(), e);
        }
    }
    
    /**
     * Publish checkout-initiated event to sidecar.
     */
    private void publishCheckoutInitiated(Basket basket, Address shippingAddress) {
        List<CheckoutInitiatedEvent.CheckoutItem> checkoutItems = basket.getItems().stream()
            .map(item -> new CheckoutInitiatedEvent.CheckoutItem(item.getProductId(), item.getQuantity()))
            .collect(Collectors.toList());
        
        CheckoutInitiatedEvent event = new CheckoutInitiatedEvent(
            basket.getId(),
            basket.getCustomerId(),
            checkoutItems,
            shippingAddress,
            Instant.now()
        );
        
        try {
            eventPublisher.publish(event);
            log.info("Published checkout-initiated event for basket: {}", basket.getId());
        } catch (Exception e) {
            log.error("Failed to publish checkout-initiated event for basket: {}", basket.getId(), e);
        }
    }
    
    /**
     * Exception thrown when a basket is not found.
     */
    public static class BasketNotFoundException extends RuntimeException {
        public BasketNotFoundException(String message) {
            super(message);
        }
    }
    
    /**
     * Exception thrown when an item is not found.
     */
    public static class ItemNotFoundException extends RuntimeException {
        public ItemNotFoundException(String message) {
            super(message);
        }
    }
}
