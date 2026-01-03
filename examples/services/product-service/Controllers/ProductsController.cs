using Microsoft.AspNetCore.Mvc;
using ProductService.Models;
using ProductService.Models.Events;
using ProductService.Services;
using ProductService.Validation;
using Spas.Sdk.Events.Publish;
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
    private readonly EventPublisher _eventPublisher;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        ProductCatalog catalog, 
        EventPublisher eventPublisher,
        ILogger<ProductsController> logger)
    {
        _catalog = catalog;
        _eventPublisher = eventPublisher;
        _logger = logger;
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

    /// <summary>
    /// Adds a new product to the catalog
    /// </summary>
    [HttpPost]
    [SpasCommand("AddProduct", "1.0",
        Description = "Adds a new product to the catalog",
        Produces = new[] { typeof(ProductAdded) })]
    public async Task<ActionResult<Product>> AddProduct([FromBody] AddProductRequest request)
    {
        // Validate request
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Additional validation using ProductValidator
        if (!ProductValidator.ValidateProduct(
            request.ProductId,
            request.Name,
            request.Category,
            request.Price,
            request.Description,
            out var errors))
        {
            foreach (var error in errors)
            {
                ModelState.AddModelError(string.Empty, error);
            }
            return BadRequest(ModelState);
        }

        // Create product
        var product = new Product(
            request.ProductId,
            request.Name,
            request.Category,
            request.Price,
            request.Description
        );

        // Add to catalog
        if (!_catalog.Add(product))
        {
            return Conflict(new { error = $"Product with ID '{request.ProductId}' already exists" });
        }

        // Emit ProductAdded event (best-effort)
        try
        {
            var productAddedEvent = new ProductAdded(
                product.ProductId,
                product.Name,
                product.Category,
                product.Price,
                product.Description
            );

            await _eventPublisher.PublishAsync<ProductAdded>(payload: productAddedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish ProductAdded event for product {ProductId}. Operation succeeded but event delivery failed.", product.ProductId);
        }

        return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
    }

    /// <summary>
    /// Updates an existing product (partial update)
    /// </summary>
    [HttpPatch("{id}")]
    [SpasCommand("UpdateProduct", "1.0",
        Description = "Updates an existing product with partial field updates",
        Produces = new[] { typeof(ProductUpdated) })]
    public async Task<ActionResult<Product>> UpdateProduct(
        string id,
        [FromBody] UpdateProductRequest request)
    {
        // Validate request
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check if at least one field is provided
        if (!request.HasChanges())
        {
            return BadRequest(new { error = "At least one field must be provided for update" });
        }

        // Additional validation for provided fields
        var errors = new List<string>();

        if (request.Name != null && !ProductValidator.ValidateName(request.Name, out var nameError))
            errors.Add(nameError!);

        if (request.Category != null && !ProductValidator.ValidateCategory(request.Category, out var categoryError))
            errors.Add(categoryError!);

        if (request.Price != null && !ProductValidator.ValidatePrice(request.Price.Value, out var priceError))
            errors.Add(priceError!);

        if (request.Description != null && !ProductValidator.ValidateDescription(request.Description, out var descError))
            errors.Add(descError!);

        if (errors.Count > 0)
        {
            foreach (var error in errors)
            {
                ModelState.AddModelError(string.Empty, error);
            }
            return BadRequest(ModelState);
        }

        // Update product
        var (success, updatedProduct, hasChanges) = _catalog.Update(
            id,
            request.Name,
            request.Category,
            request.Price,
            request.Description
        );

        if (!success)
        {
            return NotFound(new { error = $"Product with ID '{id}' not found" });
        }

        // Emit ProductUpdated event if there were changes (best-effort)
        if (hasChanges && updatedProduct != null)
        {
            try
            {
                var productUpdatedEvent = new ProductUpdated(
                    updatedProduct.ProductId,
                    updatedProduct.Name,
                    updatedProduct.Category,
                    updatedProduct.Price,
                    updatedProduct.Description
                );
                await _eventPublisher.PublishAsync<ProductUpdated>(payload: productUpdatedEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish ProductUpdated event for product {ProductId}. Operation succeeded but event delivery failed.", id);
            }
        }

        return Ok(updatedProduct);
    }

    /// <summary>
    /// Removes a product from the catalog
    /// </summary>
    [HttpDelete("{id}")]
    [SpasCommand("RemoveProduct", "1.0",
        Description = "Removes a product from the catalog",
        Produces = new[] { typeof(ProductRemoved) })]
    public async Task<IActionResult> RemoveProduct(string id)
    {
        // Remove from catalog
        var removedProduct = _catalog.Remove(id);

        if (removedProduct == null)
        {
            return NotFound(new { error = $"Product with ID '{id}' not found" });
        }

        // Emit ProductRemoved event (best-effort)
        try
        {
            var productRemovedEvent = new ProductRemoved(
                removedProduct.ProductId,
                removedProduct.Name,
                removedProduct.Category,
                removedProduct.Price,
                removedProduct.Description
            );

            await _eventPublisher.PublishAsync<ProductRemoved>(payload: productRemovedEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish ProductRemoved event for product {ProductId}. Operation succeeded but event delivery failed.", id);
        }

        return NoContent();
    }
}
