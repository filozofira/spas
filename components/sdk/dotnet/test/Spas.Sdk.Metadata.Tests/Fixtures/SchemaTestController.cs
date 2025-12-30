using Microsoft.AspNetCore.Mvc;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests.Fixtures;

/// <summary>
/// Test fixture controller for schema inference validation (T018 - US3).
/// Tests [FromBody] parameter schema generation and ActionResult&lt;T&gt; handling.
/// </summary>
[Route("api/schema-test")]
[ApiController]
public class SchemaTestController : ControllerBase
{
    [HttpPost("product")]
    [SpasCommand("CreateProduct", "1.0.0")]
    public IActionResult CreateProduct([FromBody] ProductCreateRequest request)
    {
        return Ok();
    }

    [HttpGet("product/{id}")]
    [SpasQuery("GetProduct", "1.0.0")]
    public ActionResult<ProductResponse> GetProduct(string id)
    {
        return Ok(new ProductResponse("test-id", "Test Product", 99.99m, new ProductCategory("CAT01", "Category")));
    }

    [HttpPut("product/{id}")]
    [SpasCommand("UpdateProduct", "1.0.0")]
    public async Task<ActionResult<ProductResponse>> UpdateProductAsync(string id, [FromBody] ProductUpdateRequest request)
    {
        await Task.CompletedTask;
        return Ok(new ProductResponse("test-id", "Updated Product", 99.99m, new ProductCategory("CAT01", "Category")));
    }

    [HttpPost("order")]
    [SpasCommand("CreateOrder", "1.0.0")]
    public Task<IActionResult> CreateOrderAsync([FromBody] OrderCreateRequest request)
    {
        return Task.FromResult<IActionResult>(Ok());
    }
}

/// <summary>
/// Complex request type with nested objects for schema inference testing.
/// </summary>
public record ProductCreateRequest(
    string Name,
    string Description,
    decimal Price,
    ProductCategory Category,
    List<string> Tags);

/// <summary>
/// Complex update request type.
/// </summary>
public record ProductUpdateRequest(
    string Name,
    string Description,
    decimal Price);

/// <summary>
/// Complex response type for ActionResult&lt;T&gt; testing.
/// </summary>
public record ProductResponse(
    string Id,
    string Name,
    decimal Price,
    ProductCategory Category);

/// <summary>
/// Nested complex type.
/// </summary>
public record ProductCategory(
    string Code,
    string DisplayName);

/// <summary>
/// Another complex request type.
/// </summary>
public record OrderCreateRequest(
    string CustomerId,
    List<OrderLineItem> Items,
    ShippingAddress ShippingAddress);

/// <summary>
/// Nested complex type with further nesting.
/// </summary>
public record OrderLineItem(
    string ProductId,
    int Quantity,
    decimal UnitPrice);

/// <summary>
/// Nested complex type.
/// </summary>
public record ShippingAddress(
    string Street,
    string City,
    string PostalCode,
    string Country);
