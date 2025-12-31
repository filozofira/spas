package io.spas.examples.basket.controller;

import io.spas.examples.basket.dto.AddItemRequest;
import io.spas.examples.basket.dto.BasketResponse;
import io.spas.examples.basket.dto.CheckoutRequest;
import io.spas.examples.basket.dto.CreateBasketRequest;
import io.spas.examples.basket.dto.OrderCreatedPayload;
import io.spas.examples.basket.dto.StockDepletedPayload;
import io.spas.examples.basket.events.BasketCreatedEvent;
import io.spas.examples.basket.events.CheckoutInitiatedEvent;
import io.spas.examples.basket.events.ItemAddedEvent;
import io.spas.examples.basket.events.ItemRemovedEvent;
import io.spas.examples.basket.model.Basket;
import io.spas.examples.basket.service.BasketService;
import io.spas.examples.basket.service.BasketService.BasketNotFoundException;
import io.spas.examples.basket.service.BasketService.ItemNotFoundException;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for basket operations.
 * Provides endpoints for managing shopping baskets.
 */
@RestController
@RequestMapping("/api/baskets")
public class BasketController {
    
    private static final Logger log = LoggerFactory.getLogger(BasketController.class);
    
    private final BasketService basketService;
    
    public BasketController(BasketService basketService) {
        this.basketService = basketService;
    }
    
    /**
     * Create a new basket.
     */
    @SpasCommand(
        name = "CreateBasket",
        version = "1.0.0",

        description = "Creates a new shopping basket for a customer; emits BasketCreated event",
        produces = { BasketCreatedEvent.class }
    )
    @PostMapping
    public ResponseEntity<BasketResponse> createBasket(@RequestBody CreateBasketRequest request) {
        log.info("Creating basket for customer: {}", request.getCustomerId());
        
        if (request.getCustomerId() == null || request.getCustomerId().isBlank()) {
            log.warn("Missing customerId in request");
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Basket basket = basketService.createBasket(request.getCustomerId());
            return ResponseEntity.ok(BasketResponse.from(basket));
        } catch (Exception e) {
            log.error("Failed to create basket for customer: {}", request.getCustomerId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Add an item to a basket.
     */
    @SpasCommand(
        name = "AddItem",
        version = "1.0.0",
        description = "Adds a product to the shopping basket; emits ItemAdded event",
        produces = { ItemAddedEvent.class }
    )
    @PostMapping("/{id}/items")
    public ResponseEntity<BasketResponse> addItem(
            @PathVariable String id,
            @RequestBody AddItemRequest request) {
        
        log.info("Adding item {} to basket {}", request.getProductId(), id);
        
        if (request.getProductId() == null || request.getProductId().isBlank()) {
            log.warn("Missing productId in request");
            return ResponseEntity.badRequest().build();
        }
        
        if (request.getQuantity() <= 0) {
            log.warn("Invalid quantity: {}", request.getQuantity());
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Basket basket = basketService.addItem(id, request.getProductId(), request.getQuantity());
            return ResponseEntity.ok(BasketResponse.from(basket));
        } catch (BasketNotFoundException e) {
            log.warn("Basket not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.warn("Cannot add item to basket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Failed to add item to basket: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Remove an item from a basket.
     */
    @SpasCommand(
        name = "RemoveItem",
        version = "1.0.0",

        description = "Removes a product from the shopping basket; emits ItemRemoved event",
        produces = { ItemRemovedEvent.class }
    )
    @DeleteMapping("/{id}/items/{productId}")
    public ResponseEntity<BasketResponse> removeItem(
            @PathVariable String id,
            @PathVariable String productId) {
        
        log.info("Removing item {} from basket {}", productId, id);
        
        try {
            Basket basket = basketService.removeItem(id, productId);
            return ResponseEntity.ok(BasketResponse.from(basket));
        } catch (BasketNotFoundException e) {
            log.warn("Basket not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (ItemNotFoundException e) {
            log.warn("Item not found in basket: {}", productId);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.warn("Cannot remove item from basket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Failed to remove item from basket: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Initiate checkout for a basket.
     */
    @SpasCommand(
        name = "InitiateCheckout",
        version = "1.0.0",
        description = "Initiates checkout for a basket with shipping address; emits CheckoutInitiated event containing all order details for downstream order-service and fulfillment-service",
        produces = { CheckoutInitiatedEvent.class }
    )
    @PostMapping("/{id}/checkout")
    public ResponseEntity<BasketResponse> initiateCheckout(
            @PathVariable String id,
            @RequestBody CheckoutRequest request) {
        
        log.info("Initiating checkout for basket {}", id);
        
        if (request.getShippingAddress() == null) {
            log.warn("Missing shippingAddress in request");
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Basket basket = basketService.initiateCheckout(id, request.getShippingAddress());
            return ResponseEntity.ok(BasketResponse.from(basket));
        } catch (BasketNotFoundException e) {
            log.warn("Basket not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.warn("Cannot checkout basket: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Failed to checkout basket: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get a basket by ID.
     */
    @SpasQuery(
        name = "GetBasket",
        version = "1.0.0",
        description = "Returns basket contents including item availability status"
    )
    @GetMapping("/{id}")
    public ResponseEntity<BasketResponse> getBasket(@PathVariable String id) {
        log.info("Getting basket: {}", id);
        
        return basketService.getBasket(id)
            .map(basket -> ResponseEntity.ok(BasketResponse.from(basket)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * List all baskets (for demo purposes).
     */
    @SpasQuery(
        name = "ListBaskets",
        version = "1.0.0",
        description = "Lists all baskets (demo endpoint; returns in-memory state)"
    )
    @GetMapping
    public ResponseEntity<List<BasketResponse>> listBaskets() {
        log.info("Listing all baskets");
        
        List<BasketResponse> baskets = basketService.getAllBaskets().stream()
            .map(BasketResponse::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(baskets);
    }
    
    /**
     * Mark product as unavailable in baskets.
     * Called by sidecar when stock-depleted event is received.
     */
    @SpasCommand(
        name = "MarkProductUnavailable",
        version = "1.0.0",
        description = "Marks a product as unavailable in all open baskets when stock is depleted"
    )
    @PostMapping("/mark-unavailable")
    public ResponseEntity<Void> markProductUnavailable(@RequestBody StockDepletedPayload payload) {
        log.info("Marking product {} as unavailable due to stock depletion", payload.getProductId());
        
        try {
            basketService.handleStockDepleted(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to mark product as unavailable", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Clear basket after order creation.
     * Called by sidecar when order-created event is received.
     */
    @SpasCommand(
        name = "ClearBasket",
        version = "1.0.0",
        description = "Clears a basket after successful order creation; matches basket via referenceId"
    )
    @PostMapping("/clear")
    public ResponseEntity<Void> clearBasket(@RequestBody OrderCreatedPayload payload) {
        log.info("Clearing basket after order creation: {}", payload.getOrderId());
        
        try {
            basketService.handleOrderCreated(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to clear basket after order creation", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Exception handler for basket errors.
     */
    @ExceptionHandler({BasketNotFoundException.class, ItemNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
    
    /**
     * Error response DTO.
     */
    public static class ErrorResponse {
        private String code;
        private String message;
        
        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getMessage() {
            return message;
        }
    }
}
