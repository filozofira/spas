using System.Collections.Concurrent;
using ProductService.Models;
using ProductService.Models.Events;

namespace ProductService.Services;

public class ProductCatalog
{
    private readonly ConcurrentDictionary<string, Product> _products = new();

    public ProductCatalog()
    {
    }

    public Product? Get(string productId) => 
        _products.TryGetValue(productId, out var product) ? product : null;

    public IEnumerable<Product> GetAll() => _products.Values;

    /// <summary>
    /// Adds a new product to the catalog.
    /// </summary>
    /// <param name="product">The product to add</param>
    /// <returns>True if added successfully, false if product with same ID already exists</returns>
    public bool Add(Product product)
    {
        return _products.TryAdd(product.ProductId, product);
    }

    /// <summary>
    /// Updates an existing product with partial field updates.
    /// </summary>
    /// <param name="productId">The ID of the product to update</param>
    /// <param name="name">Updated name (null to keep existing)</param>
    /// <param name="category">Updated category (null to keep existing)</param>
    /// <param name="price">Updated price (null to keep existing)</param>
    /// <param name="description">Updated description (null to keep existing)</param>
    /// <returns>Tuple of (success, updatedProduct, hasChanges). Success is false if product not found.</returns>
    public (bool Success, Product? UpdatedProduct, bool HasChanges) Update(
        string productId,
        string? name = null,
        string? category = null,
        decimal? price = null,
        string? description = null)
    {
        if (!_products.TryGetValue(productId, out var existing))
        {
            return (false, null, false);
        }

        bool hasChanges = false;

        // Check for changes and build updated product
        var updatedName = name ?? existing.Name;
        if (name != null && name != existing.Name)
        {
            hasChanges = true;
        }

        var updatedCategory = category ?? existing.Category;
        if (category != null && category != existing.Category)
        {
            hasChanges = true;
        }

        var updatedPrice = price ?? existing.Price;
        if (price != null && price != existing.Price)
        {
            hasChanges = true;
        }

        var updatedDescription = description ?? existing.Description;
        if (description != null && description != existing.Description)
        {
            hasChanges = true;
        }

        // Only update if there are changes
        if (!hasChanges)
        {
            return (true, existing, false);
        }

        var updated = new Product(productId, updatedName, updatedCategory, updatedPrice, updatedDescription);
        _products[productId] = updated;

        return (true, updated, true);
    }

    /// <summary>
    /// Removes a product from the catalog.
    /// </summary>
    /// <param name="productId">The ID of the product to remove</param>
    /// <returns>The removed product, or null if product was not found</returns>
    public Product? Remove(string productId)
    {
        return _products.TryRemove(productId, out var product) ? product : null;
    }
}
