using System.Text.RegularExpressions;

namespace ProductService.Validation;

/// <summary>
/// Validation logic for product data following SPAS conventions.
/// Centralizes business rules for product IDs, names, descriptions, and prices.
/// </summary>
public static class ProductValidator
{
    private const int ProductIdMinLength = 1;
    private const int ProductIdMaxLength = 50;
    private const int NameMaxLength = 200;
    private const int DescriptionMaxLength = 2000;
    private const decimal MinimumPrice = 0m;
    
    private static readonly Regex ProductIdPattern = new(@"^[a-z0-9-]+$", RegexOptions.Compiled);

    /// <summary>
    /// Validates product ID format and length constraints.
    /// </summary>
    /// <param name="productId">The product ID to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateProductId(string? productId, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(productId))
        {
            errorMessage = "Product ID is required and cannot be empty";
            return false;
        }

        if (productId.Length < ProductIdMinLength || productId.Length > ProductIdMaxLength)
        {
            errorMessage = $"Product ID must be between {ProductIdMinLength} and {ProductIdMaxLength} characters";
            return false;
        }

        if (!ProductIdPattern.IsMatch(productId))
        {
            errorMessage = "Product ID must contain only lowercase letters, numbers, and hyphens";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates product name length constraints.
    /// </summary>
    /// <param name="name">The product name to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateName(string? name, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            errorMessage = "Product name is required and cannot be empty";
            return false;
        }

        if (name.Length > NameMaxLength)
        {
            errorMessage = $"Product name must not exceed {NameMaxLength} characters";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates product category is not empty.
    /// </summary>
    /// <param name="category">The product category to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateCategory(string? category, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            errorMessage = "Product category is required and cannot be empty";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates product description length constraints.
    /// </summary>
    /// <param name="description">The product description to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateDescription(string? description, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            errorMessage = "Product description is required and cannot be empty";
            return false;
        }

        if (description.Length > DescriptionMaxLength)
        {
            errorMessage = $"Product description must not exceed {DescriptionMaxLength} characters";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates product price is non-negative.
    /// </summary>
    /// <param name="price">The product price to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidatePrice(decimal price, out string? errorMessage)
    {
        if (price < MinimumPrice)
        {
            errorMessage = $"Product price must be greater than or equal to {MinimumPrice}";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates all product fields for a complete product.
    /// </summary>
    /// <param name="productId">The product ID</param>
    /// <param name="name">The product name</param>
    /// <param name="category">The product category</param>
    /// <param name="price">The product price</param>
    /// <param name="description">The product description</param>
    /// <param name="errors">List of validation errors</param>
    /// <returns>True if all validations pass, false otherwise</returns>
    public static bool ValidateProduct(
        string? productId, 
        string? name, 
        string? category, 
        decimal price, 
        string? description, 
        out List<string> errors)
    {
        errors = new List<string>();

        if (!ValidateProductId(productId, out var idError))
            errors.Add(idError!);

        if (!ValidateName(name, out var nameError))
            errors.Add(nameError!);

        if (!ValidateCategory(category, out var categoryError))
            errors.Add(categoryError!);

        if (!ValidatePrice(price, out var priceError))
            errors.Add(priceError!);

        if (!ValidateDescription(description, out var descError))
            errors.Add(descError!);

        return errors.Count == 0;
    }
}
