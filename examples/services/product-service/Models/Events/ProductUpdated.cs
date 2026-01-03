using Spas.Sdk.Metadata.Attributes;

namespace ProductService.Models.Events;

/// <summary>
/// Event emitted when an existing product is successfully updated.
/// Contains the full current state of the product after the update.
/// </summary>
[SpasEvent("product-updated", "1.0",
    Description = "Emitted when a product is updated with the full current state")]
public record ProductUpdated(
    string ProductId,
    string Name,
    string Category,
    decimal Price,
    string Description
);
