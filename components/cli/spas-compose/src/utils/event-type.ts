/**
 * CloudEvents Type Derivation Utility
 *
 * Converts service metadata (boundedContext + eventName) to full CloudEvents type format.
 * SDK publishes events with full type like "com.order.order-created"
 *
 * The SDK (authoritative) uses format: com.{service-name}.{event-name-kebab}
 * Example: "OrderCreated" → "com.sample-service.order-created"
 *
 * @see specs/009-compose-generator-fixes/research.md RT-2
 * @see components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
 */

/**
 * Convert PascalCase event name to kebab-case format (matching SDK behavior)
 *
 * @example
 * "OrderCreated" → "order-created"
 * "StockReserved" → "stock-reserved"
 * "UserAccountCreated" → "user-account-created"
 * "order-created" → "order-created" (already kebab-case)
 *
 * @param eventName - PascalCase or kebab-case event name
 * @returns kebab-case name (e.g., "order-created")
 */
export function pascalToKebab(eventName: string): string {
  if (!eventName || eventName.length === 0) {
    return "";
  }

  // If already contains hyphens (kebab-case), just lowercase
  if (eventName.includes("-")) {
    return eventName.toLowerCase();
  }

  // Insert hyphen before each uppercase letter (except first) for PascalCase
  return eventName
    .replace(/([A-Z])/g, (_match, letter, offset) =>
      offset > 0 ? `-${letter}` : letter,
    )
    .toLowerCase();
}

/**
 * @deprecated Use pascalToKebab instead - SDK uses kebab-case not dot-separated
 */
export function pascalToLowerDot(eventName: string): string {
  // For backwards compatibility, delegate to kebab then convert
  const kebab = pascalToKebab(eventName);
  return kebab.replace(/-/g, ".");
}

/**
 * Derive full CloudEvents type from service name and event name
 * Matches sidecar format: com.{service-name}.{event-name-kebab}
 *
 * @example
 * deriveCloudEventsType("order-service", "OrderCreated") → "com.order-service.order-created"
 * deriveCloudEventsType("inventory-service", "StockReserved") → "com.inventory-service.stock-reserved"
 * deriveCloudEventsType("order-service", "order-created") → "com.order-service.order-created"
 *
 * @param serviceName - Service name/ID (e.g., "order-service", "inventory-service")
 * @param eventName - PascalCase or kebab-case event name (e.g., "OrderCreated" or "order-created")
 * @returns Full CloudEvents type (e.g., "com.order-service.order-created")
 */
export function deriveCloudEventsType(
  serviceName: string,
  eventName: string,
): string {
  if (!serviceName || !eventName) {
    throw new Error(
      "Both serviceName and eventName are required to derive CloudEvents type",
    );
  }

  // Normalize service name (lowercase, keep hyphens)
  const normalizedService = serviceName.toLowerCase();
  // Convert event name to kebab-case (matching SDK behavior)
  const normalizedEvent = pascalToKebab(eventName);

  return `com.${normalizedService}.${normalizedEvent}`;
}
