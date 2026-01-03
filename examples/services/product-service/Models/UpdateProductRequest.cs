using System.ComponentModel.DataAnnotations;

namespace ProductService.Models;

/// <summary>
/// Request DTO for partial update of an existing product (PATCH semantics).
/// All fields are optional - only provided fields will be updated.
/// </summary>
public record UpdateProductRequest
{
    /// <summary>
    /// Updated product name (1-200 chars). If null, name is not updated.
    /// </summary>
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Product name must be between 1 and 200 characters")]
    public string? Name { get; init; }

    /// <summary>
    /// Updated product category. If null, category is not updated.
    /// </summary>
    public string? Category { get; init; }

    /// <summary>
    /// Updated product price (must be non-negative). If null, price is not updated.
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "Product price must be greater than or equal to 0")]
    public decimal? Price { get; init; }

    /// <summary>
    /// Updated product description (1-2000 chars). If null, description is not updated.
    /// </summary>
    [StringLength(2000, MinimumLength = 1, ErrorMessage = "Product description must be between 1 and 2000 characters")]
    public string? Description { get; init; }

    /// <summary>
    /// Checks if this update request contains any fields to update.
    /// </summary>
    /// <returns>True if at least one field is provided, false if all fields are null</returns>
    public bool HasChanges() => Name != null || Category != null || Price != null || Description != null;
}
