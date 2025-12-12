using System.Net;
using System.Text.Json;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;
using Spas.Sdk.Events.Publish;
using Xunit;

namespace Spas.Sdk.Events.Tests;

/// <summary>
/// Tests for EventPublisher - verifies payload publishing and header propagation to sidecar.
/// </summary>
public class EventPublisherTests
{
    private const string TestServiceName = "test-service";

    [Fact]
    public void Constructor_WithNullHttpClient_ThrowsArgumentNullException()
    {
        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(null!, TestServiceName));
        Assert.Equal("httpClient", exception.ParamName);
    }

    [Fact]
    public void Constructor_WithNullServiceName_ThrowsArgumentNullException()
    {
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };

        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(httpClient, null!));
        Assert.Equal("serviceName", exception.ParamName);
    }

    [Fact]
    public void Constructor_WithEmptyServiceName_ThrowsArgumentNullException()
    {
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };

        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(httpClient, ""));
        Assert.Equal("serviceName", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_SendsTraceparentHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("traceparent"));
        var traceparent = request.Headers.GetValues("traceparent").First();
        Assert.StartsWith("00-", traceparent); // W3C Trace Context format
    }

    [Fact]
    public async Task PublishAsync_SendsServiceNameHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("x-service-name"));
        var serviceName = request.Headers.GetValues("x-service-name").First();
        Assert.Equal(TestServiceName, serviceName);
    }

    [Fact]
    public async Task PublishAsync_SendsCorrelationIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set correlation context
        var testCorrelationId = Guid.NewGuid().ToString();
        SpasContext.CorrelationId = testCorrelationId;

        try
        {
            // Act
            await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-correlation-id"));
            var correlationId = request.Headers.GetValues("x-correlation-id").First();
            Assert.Equal(testCorrelationId, correlationId);
        }
        finally
        {
            SpasContext.CorrelationId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_WithUserIdInContext_SendsUserIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set user context
        var testUserId = "user-456";
        SpasContext.UserId = testUserId;

        try
        {
            // Act
            await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-user-id"));
            var userId = request.Headers.GetValues("x-user-id").First();
            Assert.Equal(testUserId, userId);
        }
        finally
        {
            SpasContext.UserId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_WithTenantIdInContext_SendsTenantIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set tenant context
        var testTenantId = "tenant-789";
        SpasContext.TenantId = testTenantId;

        try
        {
            // Act
            await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-tenant-id"));
            var tenantId = request.Headers.GetValues("x-tenant-id").First();
            Assert.Equal(testTenantId, tenantId);
        }
        finally
        {
            SpasContext.TenantId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_SerializesPayloadAsJson()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123", amount = 99.50 };

        // Act
        await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.NotNull(request!.Content);
        var json = await request.Content!.ReadAsStringAsync();
        var deserializedPayload = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        Assert.NotNull(deserializedPayload);
        Assert.Equal("123", deserializedPayload!["orderId"].GetString());
        Assert.Equal(99.50, deserializedPayload["amount"].GetDouble());
    }

    [Fact]
    public async Task PublishAsync_SendsToCorrectEndpoint()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync("orders", "com.example.order.created", testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.Equal("/publish/orders", request!.RequestUri!.AbsolutePath);
        Assert.Equal(HttpMethod.Post, request.Method);
    }

    [Fact]
    public async Task PublishAsync_WithNullTopic_ThrowsArgumentNullException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentNullException>(
            () => publisher.PublishAsync(null!, "com.example.order.created", testPayload));
        Assert.Equal("topic", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_WithNullPayload_ThrowsArgumentNullException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentNullException>(
            () => publisher.PublishAsync("orders", "com.example.order.created", null!));
        Assert.Equal("payload", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_WhenSidecarReturnsError_ThrowsHttpRequestException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.InternalServerError);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(
            () => publisher.PublishAsync("orders", "com.example.order.created", testPayload));
    }

    [Fact]
    public async Task PublishAsync_WithNullEventType_ThrowsArgumentNullException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentNullException>(
            () => publisher.PublishAsync("orders", null!, testPayload));
        Assert.Equal("eventType", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_SendsEventTypeHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };
        var testEventType = "com.example.order.created";

        // Act
        await publisher.PublishAsync("orders", testEventType, testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("x-event-type"));
        var eventType = request.Headers.GetValues("x-event-type").First();
        Assert.Equal(testEventType, eventType);
    }
}

/// <summary>
/// Mock HTTP message handler for testing HTTP requests without actual network calls.
/// Note: HttpClient owns and disposes the HttpResponseMessage, so we don't track responses here.
/// </summary>
internal class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    
    public HttpRequestMessage? LastRequest { get; private set; }

    public MockHttpMessageHandler(HttpStatusCode statusCode)
    {
        _statusCode = statusCode;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        // HttpClient will own and dispose this response - we must not track or dispose it ourselves
        return Task.FromResult(new HttpResponseMessage(_statusCode));
    }
}
