using Microsoft.AspNetCore.Mvc;

namespace OrderService.Controllers;

/// <summary>
/// Health and root endpoints
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/")]
    public ActionResult<string> Root() => Ok("Order Service");

    [HttpGet("/health")]
    public ActionResult<object> Health() => Ok(new { status = "healthy", service = "order-service", timestamp = DateTime.UtcNow });
}
