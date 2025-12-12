using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;
using Spas.Sdk.Observability.Tracing;
using Xunit;

namespace Spas.Sdk.Observability.Tests;

public class TracelogMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_LogsRequestWithTraceAndCorrelation()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: (context) => Task.CompletedTask,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/test";

        SpasTrace.SetTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
        SpasContext.CorrelationId = "test-correlation-id";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("GET /test", logEntry.Message);
        Assert.Contains("4bf92f3577b34da6a3ce929d0e0e4736", logEntry.Message); // trace-id
        Assert.Contains("test-correlation-id", logEntry.Message);
        Assert.Contains("ms", logEntry.Message); // latency
    }

    [Fact]
    public async Task InvokeAsync_LogsWithoutTraceIfNotPresent()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: (context) => Task.CompletedTask,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "POST";
        httpContext.Request.Path = "/api/test";

        SpasTrace.Clear();
        SpasContext.CorrelationId = null;

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("POST /api/test", logEntry.Message);
        Assert.Contains("ms", logEntry.Message); // latency should still be present
    }

    [Fact]
    public async Task InvokeAsync_MeasuresLatency()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: async (context) => await Task.Delay(50), // Simulate 50ms work
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/slow";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("ms", logEntry.Message);

        // Extract latency value and verify it's >= 45ms (allowing for timing variance)
        var latencyMatch = System.Text.RegularExpressions.Regex.Match(
            logEntry.Message,
            @"(\d+\.?\d*)ms"
        );
        Assert.True(latencyMatch.Success);
        var latency = double.Parse(latencyMatch.Groups[1].Value);
        Assert.True(latency >= 45, $"Expected latency >= 45ms, got {latency}ms");
    }

    [Fact]
    public async Task InvokeAsync_IncludesHttpStatusCode()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: (context) =>
            {
                context.Response.StatusCode = 404;
                return Task.CompletedTask;
            },
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/notfound";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("404", logEntry.Message);
    }

    [Fact]
    public async Task InvokeAsync_LogsErrorsWithException()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var exception = new InvalidOperationException("Test error");
        var middleware = new TracelogMiddleware(
            next: (context) => throw exception,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "POST";
        httpContext.Request.Path = "/error";

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => middleware.InvokeAsync(httpContext)
        );

        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("POST /error", logEntry.Message);
        Assert.Contains("Error", logEntry.Message);
        Assert.Equal(LogLevel.Error, logEntry.LogLevel);
    }

    [Fact]
    public async Task InvokeAsync_PropagatesExceptionAfterLogging()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var exception = new ArgumentException("Test exception");
        var middleware = new TracelogMiddleware(
            next: (context) => throw exception,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/test";

        // Act & Assert
        var thrownException = await Assert.ThrowsAsync<ArgumentException>(
            () => middleware.InvokeAsync(httpContext)
        );

        Assert.Same(exception, thrownException);
    }

    [Fact]
    public async Task InvokeAsync_ExtractsUserIdWhenPresent()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: (context) => Task.CompletedTask,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/test";

        SpasContext.UserId = "user-123";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("user-123", logEntry.Message);
    }

    [Fact]
    public async Task InvokeAsync_ExtractsTenantIdWhenPresent()
    {
        // Arrange
        var logger = new TestLogger<TracelogMiddleware>();
        var middleware = new TracelogMiddleware(
            next: (context) => Task.CompletedTask,
            logger: logger
        );

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        httpContext.Request.Path = "/test";

        SpasContext.TenantId = "tenant-456";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Single(logger.LogEntries);
        var logEntry = logger.LogEntries[0];
        Assert.Contains("tenant-456", logEntry.Message);
    }
}

// Test helper for capturing log entries
internal class TestLogger<T> : ILogger<T>
{
    public List<LogEntry> LogEntries { get; } = new();

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        LogEntries.Add(new LogEntry
        {
            LogLevel = logLevel,
            Message = formatter(state, exception),
            Exception = exception
        });
    }
}

internal class LogEntry
{
    public LogLevel LogLevel { get; set; }
    public string Message { get; set; } = string.Empty;
    public Exception? Exception { get; set; }
}
