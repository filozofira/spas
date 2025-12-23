using System.Collections.Concurrent;
using ProductService.Models;

namespace ProductService.Services;

public class ProductCatalog
{
    private readonly ConcurrentDictionary<string, Product> _products = new();

    public ProductCatalog()
    {
        // Seed with sample products
        _products["prod-001"] = new Product(
            "prod-001",
            "Laptop Pro 15",
            "Electronics",
            1299.99m,
            "High-performance laptop with 15-inch display"
        );
        
        _products["prod-002"] = new Product(
            "prod-002",
            "Wireless Mouse",
            "Electronics",
            29.99m,
            "Ergonomic wireless mouse with precision tracking"
        );
        
        _products["prod-003"] = new Product(
            "prod-003",
            "USB-C Hub",
            "Electronics",
            49.99m,
            "7-in-1 USB-C hub with HDMI and ethernet"
        );
        
        _products["prod-004"] = new Product(
            "prod-004",
            "Office Chair",
            "Furniture",
            299.99m,
            "Ergonomic office chair with lumbar support"
        );
        
        _products["prod-005"] = new Product(
            "prod-005",
            "Standing Desk",
            "Furniture",
            599.99m,
            "Electric height-adjustable standing desk"
        );
    }

    public Product? Get(string productId) => 
        _products.TryGetValue(productId, out var product) ? product : null;

    public IEnumerable<Product> GetAll() => _products.Values;
}
