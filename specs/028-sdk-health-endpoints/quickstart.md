# Quickstart: Health Checks

SPAS SDKs now automatically expose standard health endpoints:
- `GET /_spas/health/live`: Liveness probe
- `GET /_spas/health/ready`: Readiness probe

These endpoints are available on the main application port and return a standard JSON response:
```json
{ "status": "UP" }
```

## Adding Custom Health Checks

The SDKs leverage the native health check registries of the underlying frameworks. To add a custom check (e.g., database connectivity), simply register it using the standard framework mechanism.

### Java (Spring Boot)

Implement the `HealthIndicator` interface and register it as a bean.

```java
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        if (checkDatabaseConnection()) {
            return Health.up().build();
        }
        return Health.down().withDetail("error", "Connection refused").build();
    }

    private boolean checkDatabaseConnection() {
        // Check logic here
        return true;
    }
}
```

The SPAS SDK will automatically include this check in the `/_spas/health/ready` status.

### .NET (ASP.NET Core)

Implement the `IHealthCheck` interface and register it in `Program.cs`.

```csharp
using Microsoft.Extensions.Diagnostics.HealthChecks;

public class DatabaseHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        if (CheckDatabaseConnection())
        {
            return Task.FromResult(HealthCheckResult.Healthy());
        }
        
        return Task.FromResult(HealthCheckResult.Unhealthy("Connection refused"));
    }

    private bool CheckDatabaseConnection() => true;
}

// In Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");
```

The SPAS SDK will automatically include this check in the `/_spas/health/ready` status.
