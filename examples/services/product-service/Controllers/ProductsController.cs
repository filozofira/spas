using Microsoft.AspNetCore.Mvc;
using ProductService.Models;
using ProductService.Services;
using Spas.Sdk.Metadata.Attributes;

namespace ProductService.Controllers;

/// <summary>
/// Controller-based endpoints for product catalog management.
/// </summary>
[Route("products")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly ProductCatalog _catalog;

    public ProductsController(ProductCatalog catalog)
    {
        _catalog = catalog;
    }

    /// <summary>
    /// Lists products in the catalog (optionally filtered by category)
    /// </summary>
    [HttpGet]
    [SpasQuery("ListProducts", "1.0", 
        Description = "Lists products in the catalog (optionally filtered by category)")]
    public ActionResult<IEnumerable<Product>> ListProducts([FromQuery] string? category = null)
    {
        var products = _catalog.GetAll();
        
        if (!string.IsNullOrEmpty(category))
        {
            products = products.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }
        
        return Ok(products);
    }

    /// <summary>
    /// Returns product details by productId
    /// </summary>
    [HttpGet("{id}")]
    [SpasQuery("GetProduct", "1.0", 
        Description = "Returns product details by productId")]
    public ActionResult<Product> GetProduct(string id)
    {
        var product = _catalog.Get(id);
        if (product == null)
            return NotFound();
        
        return Ok(product);
    }
}
