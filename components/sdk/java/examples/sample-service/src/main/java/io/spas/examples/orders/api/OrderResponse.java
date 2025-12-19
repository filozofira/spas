package io.spas.examples.orders.api;

import java.math.BigDecimal;

/**
 * Response DTO for order operations.
 * Returned by both CreateOrder command and GetOrder query.
 */
public record OrderResponse(
    String orderId,
    String customerId,
    String status,
    BigDecimal total
) {}
