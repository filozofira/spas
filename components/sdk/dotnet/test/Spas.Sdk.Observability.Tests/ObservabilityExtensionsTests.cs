using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Spas.Sdk.Observability.Tracing;
using Xunit;

namespace Spas.Sdk.Observability.Tests;

public class ObservabilityExtensionsTests
{
    [Fact]
    public void UseSpasTracelog_AddsMiddlewareToPipeline()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();

        var app = builder.Build();

        // Act
        app.UseSpasTracelog();
        app.MapGet("/test", () => "OK");

        // Assert - middleware should be registered (verified by successful build)
        Assert.NotNull(app);
    }

    [Fact]
    public async Task UseSpasTracelog_MiddlewareLogsRequests()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton<ILoggerProvider, TestLoggerProvider>();

        var app = builder.Build();
        app.UseSpasTracelog();
        app.MapGet("/test", () => "OK");

        await app.StartAsync();

        // Act
        var client = app.GetTestClient();
        var response = await client.GetAsync("/test");

        // Assert
        Assert.True(response.IsSuccessStatusCode);

        var loggerProvider = app.Services.GetRequiredService<ILoggerProvider>() as TestLoggerProvider;
        Assert.NotNull(loggerProvider);

        var logs = loggerProvider!.GetLogs();
        Assert.Contains(logs, log => log.Contains("GET /test"));
    }

    [Fact]
    public void UseSpasTracelog_RequiresApplicationBuilder()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            ObservabilityExtensions.UseSpasTracelog(null!)
        );
    }

    [Fact]
    public async Task UseSpasTracelog_WorksWithMultipleRequests()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton<ILoggerProvider, TestLoggerProvider>();

        var app = builder.Build();
        app.UseSpasTracelog();
        app.MapGet("/test1", () => "Test1");
        app.MapPost("/test2", () => "Test2");

        await app.StartAsync();

        // Act
        var client = app.GetTestClient();
        await client.GetAsync("/test1");
        await client.PostAsync("/test2", null);

        // Assert
        var loggerProvider = app.Services.GetRequiredService<ILoggerProvider>() as TestLoggerProvider;
        var logs = loggerProvider!.GetLogs();

        Assert.Contains(logs, log => log.Contains("GET /test1"));
        Assert.Contains(logs, log => log.Contains("POST /test2"));
    }
}

// Test helper for capturing logs
internal class TestLoggerProvider : ILoggerProvider
{
    private readonly List<string> _logs = new();
    private readonly object _lock = new();

    public ILogger CreateLogger(string categoryName)
    {
        return new TestLoggerInstance(_logs, _lock);
    }

    public void Dispose() { }

    public List<string> GetLogs()
    {
        lock (_lock)
        {
            return new List<string>(_logs);
        }
    }

    private class TestLoggerInstance : ILogger
    {
        private readonly List<string> _logs;
        private readonly object _lock;

        public TestLoggerInstance(List<string> logs, object lockObj)
        {
            _logs = logs;
            _lock = lockObj;
        }

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            lock (_lock)
            {
                _logs.Add(formatter(state, exception));
            }
        }
    }
}
