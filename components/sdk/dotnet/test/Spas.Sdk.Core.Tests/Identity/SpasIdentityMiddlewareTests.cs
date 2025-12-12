using Microsoft.AspNetCore.Http;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Identity;
using System.Security.Claims;

namespace Spas.Sdk.Core.Tests.Identity;

public class SpasIdentityMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WithAuthenticatedUser_PopulatesSpasContext()
    {
        // Arrange
        string? capturedUserId = null;
        string? capturedTenantId = null;
        
        var middleware = new SpasIdentityMiddleware(next: (innerContext) =>
        {
            // Capture values INSIDE the pipeline where AsyncLocal is active
            capturedUserId = SpasContext.UserId;
            capturedTenantId = SpasContext.TenantId;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-123"),
            new Claim("tenant_id", "tenant-456")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        context.User = new ClaimsPrincipal(identity);

        // Act
        await middleware.InvokeAsync(context);

        // Assert - check captured values from inside the pipeline
        Assert.Equal("user-123", capturedUserId);
        Assert.Equal("tenant-456", capturedTenantId);
    }

    [Fact]
    public async Task InvokeAsync_WithUnauthenticatedUser_DoesNotPopulateSpasContext()
    {
        // Arrange
        SpasContext.Clear();
        var middleware = new SpasIdentityMiddleware(next: (innerContext) => Task.CompletedTask);

        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(); // No identity

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Null(SpasContext.UserId);
        Assert.Null(SpasContext.TenantId);
    }

    [Fact]
    public async Task InvokeAsync_WithSubClaim_PopulatesUserId()
    {
        // Arrange
        string? capturedUserId = null;
        
        var middleware = new SpasIdentityMiddleware(next: (innerContext) =>
        {
            // Capture value INSIDE the pipeline where AsyncLocal is active
            capturedUserId = SpasContext.UserId;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim("sub", "user-789") // JWT standard claim
        };
        var identity = new ClaimsIdentity(claims, "JWTBearer");
        context.User = new ClaimsPrincipal(identity);

        // Act
        await middleware.InvokeAsync(context);

        // Assert - check captured value from inside the pipeline
        Assert.Equal("user-789", capturedUserId);
    }

    [Fact]
    public async Task InvokeAsync_CallsNextMiddleware()
    {
        // Arrange
        var nextCalled = false;
        var middleware = new SpasIdentityMiddleware(next: (innerContext) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public void Constructor_WithNullNext_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new SpasIdentityMiddleware(next: null!));
    }

    [Fact]
    public async Task InvokeAsync_WithTenantIdClaim_PopulatesTenantId()
    {
        // Arrange
        string? capturedUserId = null;
        string? capturedTenantId = null;
        
        var middleware = new SpasIdentityMiddleware(next: (innerContext) =>
        {
            // Capture values INSIDE the pipeline where AsyncLocal is active
            capturedUserId = SpasContext.UserId;
            capturedTenantId = SpasContext.TenantId;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-111"),
            new Claim("tenantId", "tenant-222") // Alternative claim name
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        context.User = new ClaimsPrincipal(identity);

        // Act
        await middleware.InvokeAsync(context);

        // Assert - check captured values from inside the pipeline
        Assert.Equal("user-111", capturedUserId);
        Assert.Equal("tenant-222", capturedTenantId);
    }
}
