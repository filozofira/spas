package io.spas.examples.orders.api;

import io.spas.examples.orders.events.OrderCreatedEvent;
import io.spas.sdk.events.EventPublisher;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST controller demonstrating SPAS SDK annotations.
 * 
 * Commands (@SpasCommand):
 * - Mutate state
 * - Publish events
 * - Generate endpoint contracts in spas.json
 * 
 * Queries (@SpasQuery):
 * - Read-only operations
 * - No state changes
 * - Generate endpoint contracts in spas.json
 * 
 * Metadata is generated offline into a design-time archive.
 * (Compile-time generation is optional and disabled by default.)
 * The EventPublisher automatically propagates trace context (traceparent) and identity
 * context (x-user-id, x-tenant-id, x-correlation-id) to the sidecar.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final EventPublisher eventPublisher;
    private final ConcurrentHashMap<String, OrderResponse> orders = new ConcurrentHashMap<>();

    public OrderController(EventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    /**
     * Command: Creates a new order and publishes OrderCreatedEvent.
     * 
     * @SpasCommand generates endpoint contract with:
     * - name: "CreateOrder"
     * - type: "command"
     * - protocol: "http"
     * - methodPath: "/api/orders"
     * - version: "1.0"
     */
    @SpasCommand(
        name = "CreateOrder",
        version = "1.0",
        path = "/api/orders",
        produces = { OrderCreatedEvent.class }
    )
    @PostMapping
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        // Generate order ID
        String orderId = UUID.randomUUID().toString();
        String status = "CREATED";

        // Store order (in-memory for demo)
        OrderResponse order = new OrderResponse(
            orderId,
            request.customerId(),
            status,
            request.total()
        );
        orders.put(orderId, order);

        // Publish event (trace/identity context auto-propagated)
        eventPublisher.publish(new OrderCreatedEvent(
            orderId,
            request.customerId(),
            request.total(),
            status
        ));

        return order;
    }

    /**
     * Query: Retrieves an existing order by ID.
     * 
     * @SpasQuery generates endpoint contract with:
     * - name: "GetOrder"
     * - type: "query"
     * - protocol: "http"
     * - methodPath: "/api/orders/{orderId}"
     * - version: "1.0"
     */
    @SpasQuery(
        name = "GetOrder",
        version = "1.0",
        path = "/api/orders/{orderId}"
    )
    @GetMapping("/{orderId}")
    public OrderResponse getOrder(@PathVariable String orderId) {
        OrderResponse order = orders.get(orderId);
        if (order == null) {
            throw new OrderNotFoundException("Order not found: " + orderId);
        }
        return order;
    }

    /**
     * Query: Lists all orders.
     * 
     * @SpasQuery generates endpoint contract with:
     * - name: "ListOrders"
     * - type: "query"
     * - protocol: "http"
     * - methodPath: "/api/orders"
     * - version: "1.0"
     */
    @SpasQuery(
        name = "ListOrders",
        version = "1.0",
        path = "/api/orders"
    )
    @GetMapping
    public Iterable<OrderResponse> listOrders() {
        return orders.values();
    }

    /**
     * Custom exception for order not found scenarios.
     */
    @ResponseStatus(org.springframework.http.HttpStatus.NOT_FOUND)
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }
}
