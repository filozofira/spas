/**
 * Unit tests for JsonataValidator
 */

import { JsonataValidator } from "../../../src/services/jsonata-validator.js";

describe("JsonataValidator", () => {
  const validator = new JsonataValidator();

  describe("validateSyntax()", () => {
    it("should validate correct JSONata expression", () => {
      // Arrange
      const validExpression = `
{
  "orderId": orderId,
  "items": items.{ "sku": productId, "qty": quantity }
}
`;

      // Act
      const result = validator.validateSyntax(validExpression);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid JSONata syntax", () => {
      // Arrange
      const invalidExpression = "{ invalid syntax [ unclosed";

      // Act
      const result = validator.validateSyntax(invalidExpression);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate complex JSONata with conditionals", () => {
      // Arrange
      const complexExpression = `
{
  "priority": status = "urgent" ? "high" : "normal",
  "total": $sum(items.price)
}
`;

      // Act
      const result = validator.validateSyntax(complexExpression);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate JSONata with function calls", () => {
      // Arrange
      const funcExpression = `
{
  "id": $uuid(),
  "timestamp": $now()
}
`;

      // Act
      const result = validator.validateSyntax(funcExpression);

      // Assert
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateFile()", () => {
    it("should validate .jsonata file extension", () => {
      // Arrange
      const validPath =
        "transformations/order-service/inbound-order-created.jsonata";
      const invalidPath = "transformations/order-service/transform.json";

      // Act & Assert
      expect(validator.isValidFilename(validPath)).toBe(true);
      expect(validator.isValidFilename(invalidPath)).toBe(false);
    });
  });
});
