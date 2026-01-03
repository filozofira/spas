using Spas.Sdk.Metadata.Attributes;

namespace ProductService.Models.Events;

/// <summary>
/// Event emitted when a product is successfully removed from the catalog.
/// Includes the full product details for audit purposes.
/// </summary>
[SpasEvent("product-removed", "1.0",
    Description = "Emitted when a product is removed from the catalog")]
public record ProductRemoved(
    string ProductId,
    string Name,
    string Category,
    decimal Price,
    string Description
);
