using Microsoft.AspNetCore.Mvc;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests.Fixtures;

/// <summary>
/// Test fixture controller for verifying controller metadata discovery (T005).
/// </summary>
[Route("api/test-orders")]
public class TestOrdersController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateTestOrder", "1.0.0")]
    public IActionResult CreateOrder([FromBody] TestOrderRequest request)
    {
        return Ok();
    }

    [HttpGet("{id}")]
    [SpasQuery("GetTestOrder", "1.0.0")]
    public IActionResult GetOrder(string id)
    {
        return Ok();
    }

    [HttpPut("{id}")]
    [SpasCommand("UpdateTestOrder", "1.0.0")]
    public IActionResult UpdateOrder(string id, [FromBody] TestOrderRequest request)
    {
        return Ok();
    }
}

/// <summary>
/// Test request DTO for controller actions.
/// </summary>
public record TestOrderRequest(string ProductId, int Quantity);
