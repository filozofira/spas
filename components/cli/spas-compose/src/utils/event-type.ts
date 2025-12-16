/**
 * CloudEvents Type Derivation Utility
 *
 * Converts service metadata (boundedContext + eventName) to full CloudEvents type format.
 * SDK publishes events with full type like "com.ecommerce.order.created"
 *
 * @see specs/009-compose-generator-fixes/research.md RT-2
 */

/**
 * Convert PascalCase event name to lowercase dot-separated format
 *
 * @example
 * "OrderCreated" → "order.created"
 * "StockReserved" → "stock.reserved"
 * "UserAccountCreated" → "user.account.created"
 *
 * @param eventName - PascalCase event name (e.g., "OrderCreated")
 * @returns lowercase dot-separated name (e.g., "order.created")
 */
export function pascalToLowerDot(eventName: string): string {
  if (!eventName || eventName.length === 0) {
    return "";
  }

  // Insert dot before each uppercase letter (except first), then lowercase all
  return eventName
    .replace(/([A-Z])/g, (_match, letter, offset) =>
      offset > 0 ? `.${letter}` : letter,
    )
    .toLowerCase();
}

/**
 * Derive full CloudEvents type from service metadata
 *
 * Format: com.{boundedContext}.{event.name.lowercase.dot.separated}
 *
 * @example
 * deriveCloudEventsType("order", "OrderCreated") → "com.order.order.created"
 * deriveCloudEventsType("inventory", "StockReserved") → "com.inventory.stock.reserved"
 *
 * @param boundedContext - Service bounded context (e.g., "order", "inventory")
 * @param eventName - PascalCase event name (e.g., "OrderCreated")
 * @returns Full CloudEvents type (e.g., "com.order.order.created")
 */
export function deriveCloudEventsType(
  boundedContext: string,
  eventName: string,
): string {
  if (!boundedContext || !eventName) {
    throw new Error(
      "Both boundedContext and eventName are required to derive CloudEvents type",
    );
  }

  const normalizedContext = boundedContext.toLowerCase().replace(/-/g, ".");
  const normalizedEvent = pascalToLowerDot(eventName);

  return `com.${normalizedContext}.${normalizedEvent}`;
}
