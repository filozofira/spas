/**
 * Unit tests for CloudEvents Type Derivation Utility
 *
 * @see specs/009-compose-generator-fixes/research.md RT-2
 */

import {
  pascalToLowerDot,
  deriveCloudEventsType,
} from "../../../src/utils/event-type.js";

describe("event-type utility", () => {
  describe("pascalToLowerDot", () => {
    it("should convert simple PascalCase to lowercase dot-separated", () => {
      expect(pascalToLowerDot("OrderCreated")).toBe("order.created");
    });

    it("should convert multi-word PascalCase", () => {
      expect(pascalToLowerDot("StockReserved")).toBe("stock.reserved");
    });

    it("should handle three-word PascalCase", () => {
      expect(pascalToLowerDot("UserAccountCreated")).toBe(
        "user.account.created",
      );
    });

    it("should handle single word", () => {
      expect(pascalToLowerDot("Order")).toBe("order");
    });

    it("should return empty string for empty input", () => {
      expect(pascalToLowerDot("")).toBe("");
    });

    it("should handle already lowercase input", () => {
      expect(pascalToLowerDot("order")).toBe("order");
    });

    it("should handle consecutive uppercase letters", () => {
      expect(pascalToLowerDot("HTTPRequest")).toBe("h.t.t.p.request");
    });
  });

  describe("deriveCloudEventsType", () => {
    it("should derive correct type for order context", () => {
      expect(deriveCloudEventsType("order", "OrderCreated")).toBe(
        "com.order.order.created",
      );
    });

    it("should derive correct type for inventory context", () => {
      expect(deriveCloudEventsType("inventory", "StockReserved")).toBe(
        "com.inventory.stock.reserved",
      );
    });

    it("should handle hyphenated bounded context", () => {
      expect(
        deriveCloudEventsType("order-management", "OrderCreated"),
      ).toBe("com.order.management.order.created");
    });

    it("should handle uppercase bounded context", () => {
      expect(deriveCloudEventsType("ORDER", "OrderCreated")).toBe(
        "com.order.order.created",
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
      ).toBe("com.fulfillment.order.shipment.prepared");
    });
  });
});
