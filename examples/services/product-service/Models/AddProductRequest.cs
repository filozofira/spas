using System.ComponentModel.DataAnnotations;

namespace ProductService.Models;

/// <summary>
/// Request DTO for adding a new product to the catalog.
/// All fields are required.
/// </summary>
public record AddProductRequest
{
    /// <summary>
    /// Unique product identifier (lowercase alphanumeric with hyphens, 1-50 chars).
    /// </summary>
    [Required(ErrorMessage = "Product ID is required")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Product ID must be between 1 and 50 characters")]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Product ID must contain only lowercase letters, numbers, and hyphens")]
    public required string ProductId { get; init; }

    /// <summary>
    /// Product display name (1-200 chars).
    /// </summary>
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Product name must be between 1 and 200 characters")]
    public required string Name { get; init; }

    /// <summary>
    /// Product category/classification.
    /// </summary>
    [Required(ErrorMessage = "Product category is required")]
    public required string Category { get; init; }

    /// <summary>
    /// Product price (must be non-negative).
    /// </summary>
    [Required(ErrorMessage = "Product price is required")]
    [Range(0, double.MaxValue, ErrorMessage = "Product price must be greater than or equal to 0")]
    public required decimal Price { get; init; }

    /// <summary>
    /// Detailed product description (1-2000 chars).
    /// </summary>
    [Required(ErrorMessage = "Product description is required")]
    [StringLength(2000, MinimumLength = 1, ErrorMessage = "Product description must be between 1 and 2000 characters")]
    public required string Description { get; init; }
}
