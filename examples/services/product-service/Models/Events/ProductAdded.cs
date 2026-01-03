using Spas.Sdk.Metadata.Attributes;

namespace ProductService.Models.Events;

/// <summary>
/// Event emitted when a new product is successfully added to the catalog.
/// </summary>
[SpasEvent("product-added", "1.0", 
    Description = "Emitted when a new product is added to the catalog")]
public record ProductAdded(
    string ProductId,
    string Name,
    string Category,
    decimal Price,
    string Description
);
