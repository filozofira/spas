using Microsoft.AspNetCore.Mvc;

namespace ProductService.Controllers;

/// <summary>
/// Health and root endpoints
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/")]
    public ActionResult<string> Root() => Ok("Product Service");

    [HttpGet("/health")]
    public ActionResult<object> Health() => Ok(new { status = "healthy", service = "product-service", timestamp = DateTime.UtcNow });
}
