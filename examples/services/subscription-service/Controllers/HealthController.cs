using Microsoft.AspNetCore.Mvc;

namespace SubscriptionService.Controllers;

/// <summary>
/// Health and root endpoints
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/")]
    public ActionResult<string> Root() => Ok("Subscription Service");

    [HttpGet("/health")]
    public ActionResult<object> Health() => Ok(new { status = "healthy", service = "subscription-service", timestamp = DateTime.UtcNow });
}
