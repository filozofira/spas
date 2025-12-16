/**
 * Unit tests for CloudEvents Type Derivation Utility
 *
 * SDK format (authoritative): com.{service-name}.{event-name-kebab}
 * spas.json uses kebab-case for cross-language SDK interoperability.
 *
 * @see specs/009-compose-generator-fixes/research.md RT-2
 * @see components/sdk/dotnet/src/Spas.Sdk.Events/Publish/EventPublisher.cs
 */

import {
  pascalToKebab,
  pascalToLowerDot,
  deriveCloudEventsType,
} from "../../../src/utils/event-type.js";

describe("event-type utility", () => {
  describe("pascalToKebab", () => {
    it("should convert simple PascalCase to kebab-case", () => {
      expect(pascalToKebab("OrderCreated")).toBe("order-created");
    });

    it("should convert multi-word PascalCase", () => {
      expect(pascalToKebab("StockReserved")).toBe("stock-reserved");
    });

    it("should handle three-word PascalCase", () => {
      expect(pascalToKebab("UserAccountCreated")).toBe("user-account-created");
    });

    it("should handle single word", () => {
      expect(pascalToKebab("Order")).toBe("order");
    });

    it("should return empty string for empty input", () => {
      expect(pascalToKebab("")).toBe("");
    });

    it("should handle already lowercase input", () => {
      expect(pascalToKebab("order")).toBe("order");
    });

    it("should handle consecutive uppercase letters", () => {
      expect(pascalToKebab("HTTPRequest")).toBe("h-t-t-p-request");
    });

    it("should preserve kebab-case input", () => {
      expect(pascalToKebab("order-created")).toBe("order-created");
    });

    it("should handle multi-word kebab-case", () => {
      expect(pascalToKebab("stock-reserved")).toBe("stock-reserved");
    });
  });

  describe("pascalToLowerDot (deprecated)", () => {
    it("should convert simple PascalCase to lowercase dot-separated", () => {
      expect(pascalToLowerDot("OrderCreated")).toBe("order.created");
    });

    it("should convert kebab-case to lowercase dot-separated", () => {
      expect(pascalToLowerDot("order-created")).toBe("order.created");
    });
  });

  describe("deriveCloudEventsType", () => {
    it("should derive correct type for order context", () => {
      expect(deriveCloudEventsType("order", "OrderCreated")).toBe(
        "com.order.order-created",
      );
    });

    it("should derive correct type for inventory context", () => {
      expect(deriveCloudEventsType("inventory", "StockReserved")).toBe(
        "com.inventory.stock-reserved",
      );
    });

    it("should handle hyphenated bounded context", () => {
      expect(
        deriveCloudEventsType("order-management", "OrderCreated"),
      ).toBe("com.order-management.order-created");
    });

    it("should handle uppercase bounded context", () => {
      expect(deriveCloudEventsType("ORDER", "OrderCreated")).toBe(
        "com.order.order-created",
      );
    });

    it("should throw error for empty boundedContext", () => {
      expect(() => deriveCloudEventsType("", "OrderCreated")).toThrow(
        "Both boundedContext and eventName are required",
      );
    });

    it("should throw error for empty eventName", () => {
      expect(() => deriveCloudEventsType("order", "")).toThrow(
        "Both boundedContext and eventName are required",
      );
    });

    it("should handle multi-word event name", () => {
      expect(
        deriveCloudEventsType("fulfillment", "OrderShipmentPrepared"),
      ).toBe("com.fulfillment.order-shipment-prepared");
    });

    it("should handle already kebab-case event name from spas.json", () => {
      // spas.json uses kebab-case (normalized by SDK)
      expect(
        deriveCloudEventsType("order", "order-created"),
      ).toBe("com.order.order-created");
    });
  });
});
