using Microsoft.AspNetCore.Mvc;

namespace InventoryService.Controllers;

/// <summary>
/// Health and root endpoints
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/")]
    public ActionResult<string> Root() => Ok("Inventory Service");

    [HttpGet("/health")]
    public ActionResult<object> Health() => Ok(new { status = "healthy", service = "inventory-service", timestamp = DateTime.UtcNow });
}
